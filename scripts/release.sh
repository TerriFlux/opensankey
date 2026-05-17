#!/usr/bin/env bash
# release.sh — Pipeline unique de release SankeyApplication
#
# Usage : scripts/release.sh <X.Y.Z>
#
# Enchaine : bump (4 package.json + ApplicationData.version) + CHANGELOG + lint/build
#            + freeze examples (OS + SA) + npm publish open-sankey + commits/tags
#            + push + merge main->prod + SSH deploy prod.
#
# Pre-requis EDITORIAUX a faire AVANT le run :
#   - client/public/WHATSNEW.md : section `## <date> -- <titre>` en tete de chaque
#     bloc <!-- LANG:fr --> et <!-- LANG:en -->
#   - doc/release-emails/<YYYY-MM-DD>-*.md : brouillon de mail
#   - Si une variable persistee a ete ajoutee : stubs fromJSON_X_Y_Z dans la chaine
#     SankeyPersistence (interactive, le script pause)
#
# Phase Persistence : tronc commun = prompt interactif (TODO auto-injection).
# Pas de rollback automatique : sur echec, set -e arrete net + log de reprise.

set -euo pipefail

# ============================================================================
# 1. CONSTANTES
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Submodule paths (relatifs a SA_ROOT)
OS_REL="submodules/OpenSankey+/submodules/OpenSankey"
OSP_REL="submodules/OpenSankey+"
LC_REL="submodules/LoginComponent"

# Package.json paths (relatifs a SA_ROOT) — 4 versions a aligner
PKG_OS="$OS_REL/opensankey/client/package.json"
PKG_OSP="$OSP_REL/client/package.json"
PKG_LC="$LC_REL/client/package.json"
PKG_SA="client/package.json"

# Fichiers specifiques
APPDATA_TSX="$OS_REL/opensankey/client/src/types/ApplicationData.tsx"
WHATSNEW="client/public/WHATSNEW.md"
RELEASE_EMAILS_DIR="doc/release-emails"

# CHANGELOG paths
CHANGELOG_OS="$OS_REL/CHANGELOG.md"
CHANGELOG_OSP="$OSP_REL/CHANGELOG.md"
CHANGELOG_LC="$LC_REL/CHANGELOG.md"
CHANGELOG_SA="CHANGELOG.md"

# Freeze scripts
FREEZE_OS="$OS_REL/examples/freeze-current.sh"
FREEZE_SA="examples/freeze-current.sh"

# npm publish : ouvrir le package open-sankey depuis ce dossier
NPM_PUBLISH_DIR="$OS_REL/opensankey/client"

# SSH deploy prod
SSH_DEPLOY_CMD="ssh -p 5378 ubuntu@open-sankey.fr 'cd dev_opensankey/sankeyapplication/ && bash update_opensankey.sh prod'"

TODAY="$(date +%Y-%m-%d)"

# ============================================================================
# 2. HELPERS
# ============================================================================

C_RED=$'\e[31m'; C_GRN=$'\e[32m'; C_YEL=$'\e[33m'; C_BLU=$'\e[34m'; C_OFF=$'\e[0m'

log()    { echo "${C_BLU}[release]${C_OFF} $*"; }
ok()     { echo "${C_GRN}[ OK   ]${C_OFF} $*"; }
warn()   { echo "${C_YEL}[WARN ]${C_OFF} $*"; }
fail()   { echo "${C_RED}[FAIL ]${C_OFF} $*" >&2; exit 1; }

confirm() {
  local prompt="$1"
  read -r -p "${C_YEL}? ${prompt} [y/N] ${C_OFF}" reply
  [[ "$reply" =~ ^[YyOo]$ ]] || fail "Abandonne sur '$prompt'"
}

phase() {
  echo ""
  echo "${C_BLU}========== PHASE $* ==========${C_OFF}"
}

# Compare versions : retourne 0 si $1 < $2, sinon 1
version_lt() {
  [ "$1" = "$2" ] && return 1
  local smaller
  smaller="$(printf '%s\n%s\n' "$1" "$2" | sort -V | head -n1)"
  [ "$smaller" = "$1" ]
}

get_pkg_version() {
  # path relatif au cwd (qu'on suppose etre SA_ROOT) — evite les soucis
  # de chemins POSIX vs Windows que node ne sait pas resoudre sous Git Bash.
  ( cd "$SA_ROOT" && node -p "require('./$1').version" )
}

# ============================================================================
# 3. PARSE ARGS
# ============================================================================

if [ $# -ne 1 ]; then
  echo "Usage: $0 <X.Y.Z>" >&2
  exit 2
fi
NEW_VERSION="$1"

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  fail "Version invalide '$NEW_VERSION' (attendu X.Y.Z numeriques)"
fi

cd "$SA_ROOT"

# ============================================================================
# 4. PHASE 0 — PRE-FLIGHT
# ============================================================================

phase "0 — Pre-flight"

# 4.1 — Sur main partout
for sub in "." "$OS_REL" "$OSP_REL" "$LC_REL"; do
  branch="$(git -C "$sub" rev-parse --abbrev-ref HEAD)"
  [ "$branch" = "main" ] || fail "$sub n'est pas sur main (actuellement '$branch')"
done
ok "Branche main partout"

# 4.2 — Working trees clean
for sub in "." "$OS_REL" "$OSP_REL" "$LC_REL"; do
  if ! git -C "$sub" diff --quiet || ! git -C "$sub" diff --cached --quiet; then
    fail "$sub a des modifications non commitees"
  fi
done
ok "Working trees clean"

# 4.3 — Versions actuelles toutes egales et < NEW_VERSION
declare -A CURRENT_VERS
for entry in "OS:$PKG_OS" "OSP:$PKG_OSP" "LC:$PKG_LC" "SA:$PKG_SA"; do
  name="${entry%%:*}"; pkg="${entry#*:}"
  v="$(get_pkg_version "$pkg")"
  CURRENT_VERS[$name]="$v"
done
log "Versions actuelles : OS=${CURRENT_VERS[OS]} OSP=${CURRENT_VERS[OSP]} LC=${CURRENT_VERS[LC]} SA=${CURRENT_VERS[SA]}"
PREV_VERSION="${CURRENT_VERS[SA]}"

# Toutes egales ?
for n in OS OSP LC; do
  [ "${CURRENT_VERS[$n]}" = "$PREV_VERSION" ] || \
    fail "Versions desalignees (SA=$PREV_VERSION, $n=${CURRENT_VERS[$n]}) — consolide avant"
done

# NEW > PREV ?
version_lt "$PREV_VERSION" "$NEW_VERSION" || \
  fail "Nouvelle version '$NEW_VERSION' n'est pas > version actuelle '$PREV_VERSION'"
ok "Versions alignees ($PREV_VERSION) et $NEW_VERSION > $PREV_VERSION"

# 4.4 — examples/<NEW_VERSION>/ absent dans OS et SA
for ex_root in "$OS_REL/examples" "examples"; do
  [ ! -e "$ex_root/$NEW_VERSION" ] || \
    fail "$ex_root/$NEW_VERSION existe deja"
done
ok "examples/$NEW_VERSION/ absent dans OS et SA"

# 4.5 — Pre-requis editoriaux
[ -f "$WHATSNEW" ] || fail "$WHATSNEW introuvable"

# Verifier qu'il y a au moins un '## ' dans les 30 lignes qui suivent chaque marqueur LANG
for lang in fr en; do
  # extrait les 30 lignes apres le marqueur LANG:$lang, cherche '## '
  if ! awk -v lang="$lang" '
    BEGIN { found=0; lines=0 }
    found && lines < 30 { if (/^## /) { print "OK"; exit } ; lines++ }
    $0 ~ "<!-- LANG:" lang " -->" { found=1 }
  ' "$WHATSNEW" | grep -q OK; then
    fail "$WHATSNEW : pas de section '## ...' dans les 30 lignes qui suivent <!-- LANG:$lang -->"
  fi
done
ok "WHATSNEW.md contient une section pour fr et en"
warn "Verifie quand meme manuellement que ces sections sont a JOUR pour $NEW_VERSION (le script ne peut pas le savoir)"

# Mail du jour
mail_match=$(find "$RELEASE_EMAILS_DIR" -maxdepth 1 -type f -name "${TODAY}-*.md" 2>/dev/null | head -n1)
[ -n "$mail_match" ] || fail "Aucun $RELEASE_EMAILS_DIR/${TODAY}-*.md — redige le brouillon de mail d'abord"
ok "Mail du jour present : $mail_match"

# 4.6 — Pas plusieurs [Unreleased] en tete dans SA CHANGELOG
count_unreleased=$(head -n 50 "$CHANGELOG_SA" | grep -cE '^## \[(Unreleased|Non publi[eé])\]' || true)
if [ "$count_unreleased" -gt 1 ]; then
  fail "$CHANGELOG_SA contient $count_unreleased sections [Unreleased] en tete — consolide en une seule avant"
fi
ok "CHANGELOG SA : <= 1 section [Unreleased] en tete"

# 4.7 — Scripts freeze-current presents
[ -x "$FREEZE_OS" ] || [ -f "$FREEZE_OS" ] || fail "$FREEZE_OS introuvable (commit attendu)"
[ -x "$FREEZE_SA" ] || [ -f "$FREEZE_SA" ] || fail "$FREEZE_SA introuvable (commit attendu)"
ok "freeze-current.sh present (OS + SA)"

# 4.8 — Confirm avant de toucher quoi que ce soit
echo ""
log "Resume :"
log "  Version actuelle : $PREV_VERSION"
log "  Nouvelle version : $NEW_VERSION"
log "  Mail brouillon   : $mail_match"
log "  Aujourd'hui      : $TODAY"
confirm "Demarrer la release ?"

# ============================================================================
# 5. PHASE A — BUMPS
# ============================================================================

phase "A — Bump des 4 package.json + ApplicationData.version"

for pkg in "$PKG_OS" "$PKG_OSP" "$PKG_LC" "$PKG_SA"; do
  # sed ciblant `"version": "X.Y.Z"` au top-level (premiere occurrence suffit)
  sed -i.bak -E "0,/\"version\":[[:space:]]*\"[^\"]+\"/s|\"version\":[[:space:]]*\"[^\"]+\"|\"version\": \"$NEW_VERSION\"|" "$pkg"
  rm -f "$pkg.bak"
  new_v="$(get_pkg_version "$pkg")"
  [ "$new_v" = "$NEW_VERSION" ] || fail "Bump rate sur $pkg (lu: $new_v)"
  ok "$pkg -> $NEW_VERSION"
done

# ApplicationData.tsx : `public version: string = 'X.Y.Z'`
sed -i.bak -E "s|public version: string = '[^']+'|public version: string = '$NEW_VERSION'|" "$APPDATA_TSX"
rm -f "$APPDATA_TSX.bak"
grep -q "public version: string = '$NEW_VERSION'" "$APPDATA_TSX" || fail "Bump rate sur $APPDATA_TSX"
ok "$APPDATA_TSX -> $NEW_VERSION"

# ============================================================================
# 6. PHASE B — PROMPT MANUEL PERSISTENCE
# ============================================================================

phase "B — Persistence stubs (interactif)"

cat <<EOF

Si cette release ajoute une nouvelle variable persistee dans le JSON Sankey,
tu dois ajouter une methode statique vide \`fromJSON_${NEW_VERSION//./_}\` dans
chaque classe Persistence + miroir OSP + branche dans le routeur.

Classes a instrumenter (chaine SankeyPersistence.tsx) :
  - BaseElementPersistence
  - ProtoElementPersistence
  - NodeBasePersistence
  - ContainerPersistence
  - LinkElementPersistence
  - NodeElementPersistence
  - LegendPersistence
  - StylePersistence
  - SankeyPersistence
  - DrawingAreaPersistence
+ miroir DrawingAreaPersistenceOSP dans :
  $OSP_REL/client/src/types/DrawingAreaOSP.tsx

Modele : dupliquer la methode fromJSON_1_1_1 existante, renommer en
fromJSON_${NEW_VERSION//./_}, vider le corps (laisse vide si pas de migration).

Si AUCUNE variable persistee n'est ajoutee dans cette release, presse simplement
ENTER pour continuer sans rien faire (les stubs ne sont pas strictement requis).

EOF
read -r -p "${C_YEL}? Persistence stubs faits (ou non necessaires) ? Presse ENTER pour continuer (ou Ctrl-C pour annuler) ${C_OFF}" _

# ============================================================================
# 7. PHASE C — CHANGELOG
# ============================================================================

phase "C — CHANGELOG (les 4)"

update_changelog() {
  local file="$1"
  local new_header="## [$NEW_VERSION] — $TODAY"

  # Cherche [Unreleased] ou [Non publi(e|é)] dans les premieres 50 lignes
  local line_no
  line_no=$(head -n 50 "$file" | grep -nE '^## \[(Unreleased|Non publi[eé])\]' | head -n1 | cut -d: -f1 || true)

  if [ -n "$line_no" ]; then
    # Renommer cette ligne
    sed -i.bak -E "${line_no}s|^## \[(Unreleased\|Non publi[eé])\][^\n]*|$new_header|" "$file"
    rm -f "$file.bak"
    ok "$file : section [Unreleased/Non publié] -> $new_header"
  else
    # Inserer apres le H1
    local h1_line
    h1_line=$(grep -nE '^# ' "$file" | head -n1 | cut -d: -f1)
    [ -n "$h1_line" ] || fail "Pas de H1 trouve dans $file"
    # Construit le bloc a inserer
    local insert_at=$((h1_line + 1))
    awk -v at="$insert_at" -v hdr="$new_header" '
      NR == at { print ""; print hdr; print ""; print "_(à compléter avant push)_"; print "" }
      { print }
    ' "$file" > "$file.new"
    mv "$file.new" "$file"
    ok "$file : bloc neuf insere apres H1 ($new_header)"
  fi
}

update_changelog "$CHANGELOG_OS"
update_changelog "$CHANGELOG_OSP"
update_changelog "$CHANGELOG_LC"
update_changelog "$CHANGELOG_SA"

warn "Verifie le contenu des sections CHANGELOG (insertions par defaut = placeholder '_(à compléter avant push)_')"
confirm "CHANGELOG a jour ? Continuer ?"

# ============================================================================
# 8. PHASE D — LINT + BUILD
# ============================================================================

phase "D — Lint + build (SA client)"

(
  cd "$SA_ROOT/client"
  log "pnpm lint..."
  pnpm lint
  log "pnpm build..."
  pnpm build
)
ok "Lint + build OK"

# ============================================================================
# 9. PHASE E — FREEZE EXAMPLES
# ============================================================================

phase "E — Freeze examples/$NEW_VERSION/ (OS + SA)"

(cd "$OS_REL/examples" && bash freeze-current.sh "$NEW_VERSION")
ok "OS examples/$NEW_VERSION/ figes"

(cd "examples" && bash freeze-current.sh "$NEW_VERSION")
ok "SA examples/$NEW_VERSION/ figes"

# ============================================================================
# 10. PHASE F — NPM PUBLISH open-sankey
# ============================================================================

phase "F — npm publish open-sankey@$NEW_VERSION"

warn "Verifie que tu es loggue npm (compte julien.alapetite) : npm whoami"
confirm "Lancer npm publish open-sankey@$NEW_VERSION (registry public) ?"

(
  cd "$SA_ROOT/$NPM_PUBLISH_DIR"
  npm publish
)
ok "open-sankey@$NEW_VERSION publie sur npm"

# ============================================================================
# 11. PHASE G — COMMITS + TAGS (bottom-up)
# ============================================================================

phase "G — Commits + tags v$NEW_VERSION (OS -> OSP -> LC -> SA)"

commit_msg=$(cat <<EOF
chore: release $NEW_VERSION

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)

# G.1 — OS : package.json + ApplicationData.tsx + CHANGELOG + examples/<v>/
git -C "$OS_REL" add \
  opensankey/client/package.json \
  opensankey/client/src/types/ApplicationData.tsx \
  CHANGELOG.md \
  "examples/$NEW_VERSION"
# Inclut aussi les modifs Persistence si presentes (chemin large)
git -C "$OS_REL" add opensankey/client/src/Persistence/ 2>/dev/null || true
git -C "$OS_REL" commit -m "$commit_msg"
git -C "$OS_REL" tag "v$NEW_VERSION"
ok "OS commit + tag v$NEW_VERSION"

# G.2 — OSP : package.json + CHANGELOG + SHA OS + miroir DrawingAreaOSP.tsx
git -C "$OSP_REL" add \
  client/package.json \
  CHANGELOG.md \
  submodules/OpenSankey
git -C "$OSP_REL" add client/src/types/DrawingAreaOSP.tsx 2>/dev/null || true
git -C "$OSP_REL" commit -m "$commit_msg"
git -C "$OSP_REL" tag "v$NEW_VERSION"
ok "OSP commit + tag v$NEW_VERSION"

# G.3 — LC : package.json + CHANGELOG
git -C "$LC_REL" add client/package.json CHANGELOG.md
git -C "$LC_REL" commit -m "$commit_msg"
git -C "$LC_REL" tag "v$NEW_VERSION"
ok "LC commit + tag v$NEW_VERSION"

# G.4 — SA : tout le reste + SHA OSP/LC + WHATSNEW + mail + examples
git add \
  client/package.json \
  CHANGELOG.md \
  "$WHATSNEW" \
  "$RELEASE_EMAILS_DIR" \
  "examples/$NEW_VERSION" \
  "$OSP_REL" \
  "$LC_REL"
git commit -m "$commit_msg"
git tag "v$NEW_VERSION"
ok "SA commit + tag v$NEW_VERSION"

# ============================================================================
# 12. PHASE H — PUSH
# ============================================================================

phase "H — Push (4 repos)"

confirm "Push main + tags v$NEW_VERSION dans OS, OSP, LC, SA ?"

for sub in "$OS_REL" "$OSP_REL" "$LC_REL" "."; do
  git -C "$sub" push origin main
  git -C "$sub" push origin "v$NEW_VERSION"
  ok "Push $sub"
done

# ============================================================================
# 13. PHASE I — MERGE main -> prod
# ============================================================================

phase "I — Merge main -> prod (4 repos, ff-only)"

confirm "Merger main -> prod (ff-only) et pousser dans OS, OSP, LC, SA ?"

for sub in "$OS_REL" "$OSP_REL" "$LC_REL" "."; do
  log "Merge prod dans $sub"
  git -C "$sub" checkout prod
  git -C "$sub" pull --ff-only origin prod
  git -C "$sub" merge --ff-only main
  git -C "$sub" push origin prod
  git -C "$sub" checkout main
  ok "$sub : main -> prod OK, retour main"
done

# ============================================================================
# 14. PHASE J — SSH DEPLOY PROD
# ============================================================================

phase "J — Deploy prod via SSH"

warn "Cette commande lance update_opensankey.sh prod sur open-sankey.fr"
warn "  $SSH_DEPLOY_CMD"
confirm "Lancer le deploy prod ?"

eval "$SSH_DEPLOY_CMD"
ok "Deploy prod lance"

# ============================================================================
# DONE
# ============================================================================

echo ""
echo "${C_GRN}========== RELEASE $NEW_VERSION TERMINEE ==========${C_OFF}"
echo "Version precedente : $PREV_VERSION"
echo "Version publiee    : $NEW_VERSION"
echo ""
echo "Verifications post-release suggerees :"
echo "  - https://www.npmjs.com/package/open-sankey  (version $NEW_VERSION publiee)"
echo "  - https://open-sankey.fr  (deploy prod actif)"
echo "  - https://open-sankey.fr/$PREV_VERSION  (archive ancienne version)"
echo "  - Envoi du mail : $mail_match"
