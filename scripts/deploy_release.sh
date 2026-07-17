#!/bin/bash
# deploy_release.sh — déploiement par slot immuable + bascule atomique (issue #255)
#
# Le déploiement historique rebuildait EN PLACE dans le dossier servi par uWSGI :
# pendant plusieurs minutes le site servait un arbre à moitié remplacé, et un
# build cassé en cours de route laissait l'environnement en rade, sans rollback.
#
# Ici, tout est construit dans un slot NEUF, hors du chemin servi. On ne bascule
# le symlink `current` qu'une fois le slot complet ET vérifié. Si quoi que ce
# soit échoue avant la bascule, le site en ligne n'a pas bougé. Après la bascule,
# un /health en échec déclenche un retour automatique sur le slot précédent.
#
# Usage :
#   bash scripts/deploy_release.sh <dev|test|prod> [options]
#
# Options :
#   --dry-run       Affiche les actions sans rien exécuter.
#   --keep N        Nombre de slots conservés (défaut 3, minimum 2 pour le rollback).
#   --from DIR      Source du code (défaut : répertoire courant, = workspace CI).
#   --db-keep-days N  Rétention des sauvegardes de base (défaut 30 ; 365 en prod).
#
# Prérequis : l'environnement doit avoir été migré vers le layout par slots
# (une seule fois) via scripts/bootstrap_release_layout.sh.

set -euo pipefail

ENV=""
DRY_RUN=0
KEEP=3
DB_KEEP_DAYS=30
SRC_DIR="$(pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    dev|test|prod)   ENV="$1"; shift ;;
    --dry-run)       DRY_RUN=1; shift ;;
    --keep)          KEEP="$2"; shift 2 ;;
    --db-keep-days)  DB_KEEP_DAYS="$2"; shift 2 ;;
    --from)          SRC_DIR="$2"; shift 2 ;;
    -h|--help)       sed -n '2,27p' "$0"; exit 0 ;;
    *) echo "Argument inconnu : $1" >&2; exit 1 ;;
  esac
done

[[ -n "$ENV" ]] || { echo "Environnement requis : dev | test | prod" >&2; exit 1; }
[[ "$KEEP" -ge 2 ]] || { echo "--keep doit valoir au moins 2 (rollback)" >&2; exit 1; }

# DEPLOY_ROOT permet de rejouer le script hors du VPS (repetition a blanc,
# tests) en pointant sur une arborescence factice. Non pose en production.
ROOT="${DEPLOY_ROOT:-/home/ubuntu/${ENV}_opensankey}"
RELEASES="${ROOT}/releases"
SHARED="${ROOT}/shared"
CURRENT="${ROOT}/current"
SERVICE="${ENV}_opensankey"

run() {
  echo "+ $*"
  [[ $DRY_RUN -eq 1 ]] && return 0
  "$@"
}

fail() { echo "ERREUR: $*" >&2; exit 1; }

# Bascule ATOMIQUE d'un symlink de dossier.
# `ln -sfn` ne l'est PAS : coreutils fait unlink() puis symlink(), laissant un
# bref instant où `current` n'existe pas. On passe donc par un lien temporaire
# renommé avec `mv -T`, qui repose sur rename(2) — atomique par définition.
swap_symlink() {
  local target="$1" link="$2"
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "+ ln -sfn ${target} ${link}.tmp && mv -Tf ${link}.tmp ${link}   (bascule atomique)"
    return 0
  fi
  ln -sfn "$target" "${link}.tmp"
  mv -Tf "${link}.tmp" "$link"
}

# --- Préconditions ----------------------------------------------------------
[[ -d "$RELEASES" && -d "$SHARED" ]] || fail \
  "Layout par slots absent (${RELEASES} / ${SHARED}).
   Lancer d'abord (une seule fois) : bash scripts/bootstrap_release_layout.sh ${ENV}"

PREVIOUS=""
if [[ -L "$CURRENT" ]]; then
  PREVIOUS="$(readlink -f "$CURRENT")"
fi

# --- Précondition : nginx proxifie bien le socket stable --------------------
# La bascule (étape 6) restart le service sur le socket défini par UWSGI_SOCKET
# (shared/env). Si la conf nginx pointe encore ailleurs — typiquement quand le
# bootstrap a été lancé SANS --with-nginx — le restart réussit mais nginx renvoie
# 502 : /health échoue et on rollback pour rien, après avoir construit tout le
# slot. On attrape ce désalignement ICI, avant de rien construire.
NGINX_SITE="/etc/nginx/sites-enabled/${ENV}_opensankey"
if [[ $DRY_RUN -eq 0 ]]; then
  SOCKET_ENV="$(set -a; . "${SHARED}/env"; set +a; echo "${UWSGI_SOCKET:-}")"
  [[ -n "$SOCKET_ENV" ]] || fail \
    "UWSGI_SOCKET absent de ${SHARED}/env — relancer bootstrap_release_layout.sh ${ENV}"
  if [[ -f "$NGINX_SITE" ]]; then
    grep -qF "unix:${SOCKET_ENV}" "$NGINX_SITE" || fail \
"nginx (${NGINX_SITE}) ne proxifie PAS le socket ${SOCKET_ENV}.
   La bascule provoquerait un 502 puis un rollback inutile. Corriger d'abord :
     sudo sed -i 's#uwsgi_pass unix:[^;]*;#uwsgi_pass unix:${SOCKET_ENV};#' ${NGINX_SITE}
     sudo nginx -t && sudo systemctl reload nginx"
  else
    echo "[WARN] Conf nginx introuvable (${NGINX_SITE}) — vérification socket ignorée."
  fi
fi

SHA="$(git -C "$SRC_DIR" rev-parse --short HEAD 2>/dev/null || echo nogit)"
RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)_${SHA}"
NEW="${RELEASES}/${RELEASE_ID}"
NEW_APP="${NEW}/sankeyapplication"
NEW_VENV="${NEW}/venv"

echo "=== Déploiement ${ENV} → slot ${RELEASE_ID} ==="
[[ $DRY_RUN -eq 1 ]] && echo "(dry-run — aucune modification)"
echo "    source   : ${SRC_DIR}"
echo "    précédent: ${PREVIOUS:-aucun}"

# --- 1. Matérialiser le slot ------------------------------------------------
# On copie l'arbre de travail (le runner CI a déjà le checkout du commit avec ses
# submodules). .git et les artefacts de build sont exclus : ils seront reconstruits
# dans le slot, et les exclure garde les slots légers.
run mkdir -p "$NEW_APP"
run rsync -a --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'cache' \
  --exclude 'server/db.sqlite' \
  --exclude 'server/db.sqlite.bk' \
  --exclude '**/__pycache__' \
  "${SRC_DIR}/" "${NEW_APP}/"

# --- 2. Rattacher l'état partagé (hors slot, donc survivant au prune) --------
# `env`, `cache/` et la base vivent dans shared/ : ils sont COMMUNS à tous les
# slots. Les lier (et non les copier) garantit qu'un rollback retrouve exactement
# le même état, et qu'un prune de vieux slot n'emporte aucune donnée.
run ln -sfn "${SHARED}/env"           "${NEW_APP}/env"
run ln -sfn "${SHARED}/cache"         "${NEW_APP}/cache"
run mkdir -p "${NEW_APP}/server"
run ln -sfn "${SHARED}/db.sqlite"     "${NEW_APP}/server/db.sqlite"
run ln -sfn "${SHARED}/db.sqlite.bk"  "${NEW_APP}/server/db.sqlite.bk"

# --- 3. venv DÉDIÉ au slot, créé à son emplacement final --------------------
# Indispensable : les paquets locaux (opensankey, login-component, MFAProblem)
# sont installés en editable et pointent donc sur le chemin du code. Un venv
# partagé rendrait le rollback illusoire (le code reviendrait en arrière, pas les
# dépendances compilées). Le créer directement à son emplacement définitif évite
# tout repointage de chemins a posteriori.
run python3 -m venv "$NEW_VENV"

if [[ $DRY_RUN -eq 0 ]]; then
  # shellcheck disable=SC1091
  source "${NEW_VENV}/bin/activate"
  cd "$NEW_APP"
  export EIGEN_INCLUDE="${NEW_APP}/submodules/MFAProblem/submodules/eigen"
  pip install --upgrade pip >/dev/null
  bash scripts/deploy_SankeyApp.sh || fail "build du slot ${RELEASE_ID} échoué — rien n'a été basculé"
else
  echo "+ source ${NEW_VENV}/bin/activate && bash scripts/deploy_SankeyApp.sh (dans ${NEW_APP})"
fi

# --- 4. Migrations : sauvegarde puis upgrade (base PARTAGÉE) ----------------
# La base est commune aux slots : la migration n'est pas rollback-able par la
# bascule du symlink. On la sauvegarde donc juste avant, et on la joue AVANT de
# basculer (le code neuf doit tourner sur le schéma neuf).
if [[ $DRY_RUN -eq 0 ]]; then
  mkdir -p "${SHARED}/db.sqlite.bk"
  cp "${SHARED}/db.sqlite" "${SHARED}/db.sqlite.bk/db_$(date --iso-8601=seconds).sqlite"
  find "${SHARED}/db.sqlite.bk" -mtime "+${DB_KEEP_DAYS}" -type f -delete || true
  (cd "$NEW_APP" && alembic upgrade head) || fail "migration alembic échouée — rien n'a été basculé"
else
  echo "+ sauvegarde db.sqlite puis alembic upgrade head (dans ${NEW_APP})"
fi

# --- 5. Vérification du slot AVANT bascule ---------------------------------
# L'app s'importe-t-elle ? C'est le filet le moins cher qui attrape l'essentiel
# (import cassé, dépendance manquante, migration incohérente avec le modèle).
if [[ $DRY_RUN -eq 0 ]]; then
  (cd "$NEW_APP" && set -a && . "${SHARED}/env" && set +a \
     && "${NEW_VENV}/bin/python" -c "import wsgi; print('import wsgi: OK')") \
    || fail "le slot ${RELEASE_ID} ne s'importe pas — rien n'a été basculé"
else
  echo "+ smoke test : python -c 'import wsgi' dans le slot"
fi

# --- 6. BASCULE --------------------------------------------------------------
# Tout ce qui précède s'est fait hors du chemin servi : c'est ICI, et seulement
# ici, que le site change de version.
swap_symlink "$NEW" "$CURRENT"
run sudo systemctl restart "$SERVICE"

# --- 7. Vérification post-bascule, rollback automatique si KO ---------------
HEALTH_OK=1
if [[ $DRY_RUN -eq 0 ]]; then
  set -a; . "${SHARED}/env"; set +a
  if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
    echo "[INFO] Health-check ${ENV} : ${HEALTHCHECK_URL}"
    for i in $(seq 1 10); do
      if curl -fsS --max-time 5 "$HEALTHCHECK_URL" >/dev/null 2>&1; then
        echo "[OK] /health répond (tentative ${i})"
        HEALTH_OK=1
        break
      fi
      HEALTH_OK=0
      sleep 2
    done
  else
    echo "[WARN] HEALTHCHECK_URL absent de env — vérification post-bascule ignorée."
  fi
fi

if [[ $DRY_RUN -eq 0 && $HEALTH_OK -eq 0 ]]; then
  echo "[ERREUR] /health ne répond pas après la bascule." >&2
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    echo "[ROLLBACK] retour automatique sur ${PREVIOUS}" >&2
    swap_symlink "$PREVIOUS" "$CURRENT"
    sudo systemctl restart "$SERVICE"
    echo "[ROLLBACK] effectué. Le slot fautif reste en place pour analyse : ${NEW}" >&2
  else
    echo "[ROLLBACK] impossible : aucun slot précédent." >&2
  fi
  exit 1
fi

# --- 8. Prune : garder les N derniers slots --------------------------------
# On ne supprime jamais le slot courant ni le précédent (filet de rollback).
#
# `sudo` + tolérance aux échecs, pour deux raisons apprises le 2026-07-17 :
#  - DEUX déployeurs écrivent ici (ubuntu via ce script, gitlab-runner via la
#    CI). Purger un slot de l'autre échoue en « Permission denied » : ce qui
#    compte pour `rm`, c'est le droit d'écriture sur le RÉPERTOIRE parent, que
#    ni umask 002 ni le groupe `deploy` ne garantissent sur tout l'arbre (pip
#    et rsync reposent leurs propres permissions).
#  - Le prune arrive APRÈS la bascule : le site tourne déjà sur le slot neuf.
#    Le faire échouer le déploiement (set -e) transformait un succès réel en
#    sortie non-zéro anxiogène. Un slot non purgé n'est qu'un peu de disque —
#    on le signale, on ne casse pas le déploiement pour autant.
if [[ $DRY_RUN -eq 0 ]]; then
  mapfile -t SLOTS < <(ls -1d "${RELEASES}"/*/ 2>/dev/null | sort -r)
  KEPT=0
  for slot in "${SLOTS[@]}"; do
    slot="${slot%/}"
    KEPT=$((KEPT + 1))
    if [[ $KEPT -le $KEEP ]] || [[ "$slot" == "$PREVIOUS" ]] || [[ "$slot" == "$NEW" ]]; then
      continue
    fi
    # Garde-fou : `sudo rm -rf` sur un chemin CALCULÉ — on n'efface que sous
    # RELEASES, et jamais RELEASES lui-même. Le rejet de `..` n'est pas
    # théorique : sans lui, « ${RELEASES}/../../.. » satisfait le motif de
    # préfixe et vaut /home (vérifié).
    case "$slot" in
      *..*)             echo "[WARN] prune ignoré (chemin suspect) : ${slot}" >&2; continue ;;
      "${RELEASES}"/?*) ;;
      *)                echo "[WARN] prune ignoré (hors ${RELEASES}) : ${slot}" >&2; continue ;;
    esac
    echo "+ prune ${slot}"
    sudo rm -rf "$slot" || echo "[WARN] prune de ${slot} impossible — slot conservé." >&2
  done
fi

echo "=== ${ENV} déployé sur ${RELEASE_ID} (rollback : bash scripts/rollback_release.sh ${ENV}) ==="
