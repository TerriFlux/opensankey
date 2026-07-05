#!/usr/bin/env bash
# freeze-current.sh — Snapshot examples/current/ vers examples/<version>/
#
# Usage :
#   ./freeze-current.sh 1.1.4
#
# Que fait le script :
#   1. Copie examples/current/{viewer,editor,html-viewer} → examples/<version>/...
#      en excluant node_modules/ et build/ (qui sont des artefacts locaux).
#   2. Pour chaque package.json (viewer, editor) :
#      - Remplace "<pkg>": "file:..." par "<pkg>": "<version>" (consomme le
#        package depuis le registre, plus le file:link).
#      - Renomme "<pkg>-example-current" en "<pkg>-example-<version>".
#   3. Retire le postinstall dedupe-deps.cjs du viewer (les registry installs
#      sont auto-deduplique, le script ne sert plus).
#
# Detection automatique du nom du package depuis le viewer/package.json
# courant (cherche la ligne `file:` dans dependencies). Marche tel quel pour
# SankeyApplication (@terriflux/sankeyapplication) ET OpenSankey (open-sankey),
# pas besoin de configuration manuelle.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.1.4"
  exit 1
fi

VERSION="$1"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$DIR/current"
DST="$DIR/$VERSION"

if [ ! -d "$SRC" ]; then
  echo "[ERR] $SRC introuvable"
  exit 1
fi
if [ -e "$DST" ]; then
  echo "[ERR] $DST existe deja — supprimer avant de relancer"
  exit 1
fi

# 1) Detection du nom du package consomme (premiere ligne `"<name>": "file:`
#    trouvee dans current/viewer/package.json)
PKG_NAME=$(grep -oE '"[^"]+"\s*:\s*"file:' "$SRC/viewer/package.json" \
           | head -n1 \
           | sed -E 's/^"([^"]+)"\s*:.*/\1/')
if [ -z "${PKG_NAME:-}" ]; then
  echo "[ERR] Impossible de detecter le nom du package via file:link dans $SRC/viewer/package.json"
  exit 1
fi
echo "[INFO] Package detecte: $PKG_NAME"
echo "[INFO] Snapshot $SRC -> $DST (version $VERSION)"

# 2) Copie sans node_modules ni build
#    Ordre de preference: rsync (le plus efficace), tar (POSIX universel),
#    cp -R en dernier recours (probleme avec les symlinks dans node_modules
#    sur Windows/git bash, donc on cleanup avant).
mkdir -p "$DST"
for kind in viewer editor html-viewer; do
  if [ -d "$SRC/$kind" ]; then
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --exclude='node_modules' --exclude='build' "$SRC/$kind/" "$DST/$kind/"
    elif command -v tar >/dev/null 2>&1; then
      mkdir -p "$DST/$kind"
      ( cd "$SRC/$kind" && tar -cf - --exclude='node_modules' --exclude='build' . ) \
        | ( cd "$DST/$kind" && tar -xf - )
    else
      cp -R "$SRC/$kind" "$DST/$kind"
      rm -rf "$DST/$kind/node_modules" "$DST/$kind/build"
    fi
    echo "[OK] $kind"
  fi
done

# 3) Adaptation des package.json (viewer + editor)
#    - bascule "<pkg>": "file:..." -> "<pkg>": "<version>"
#    - renomme "<pkg>-example-current" -> "<pkg>-example-<version>"
PKG_NAME_ESC=$(printf '%s' "$PKG_NAME" | sed 's|/|\\/|g')
for kind in viewer editor; do
  PJ="$DST/$kind/package.json"
  if [ ! -f "$PJ" ]; then continue; fi
  sed -i.bak -E \
    -e "s|\"$PKG_NAME_ESC\"\s*:\s*\"file:[^\"]+\"|\"$PKG_NAME_ESC\": \"$VERSION\"|" \
    -e "s|(-example-)current\"|\1$VERSION\"|" \
    "$PJ"
  rm -f "$PJ.bak"
  echo "[OK] $PJ adapte (version=$VERSION)"
done

# 4) Supprime les lockfiles copies depuis current/ — sinon ils contiennent
#    encore la resolution vers `file:../../../client` et `npm install` dans
#    le snapshot reinstallera depuis le file:link local au lieu du registre.
for kind in viewer editor; do
  rm -f "$DST/$kind/package-lock.json" \
        "$DST/$kind/pnpm-lock.yaml" \
        "$DST/$kind/yarn.lock"
done

# 5) Ajoute un .gitignore racine au snapshot — node_modules/, build/ et
#    lockfiles ne sont pas censes etre commit dans un dossier de release.
cat > "$DST/.gitignore" <<'GITIGNORE'
# Artefacts d'install/build — generes localement, jamais commit
**/node_modules/
**/build/
**/package-lock.json
**/pnpm-lock.yaml
**/yarn.lock
GITIGNORE
echo "[OK] .gitignore racine ajoute"

# 6) Retire le postinstall dedupe-deps du viewer (inutile sur registry install)
VIEWER_PJ="$DST/viewer/package.json"
if [ -f "$VIEWER_PJ" ] && grep -q 'dedupe-deps' "$VIEWER_PJ"; then
  # Retire la ligne "postinstall": "..."
  sed -i.bak -E '/"postinstall"\s*:\s*"node \.\/scripts\/dedupe-deps\.cjs"\s*,?/d' "$VIEWER_PJ"
  rm -f "$VIEWER_PJ.bak"
  rm -rf "$DST/viewer/scripts"
  echo "[OK] postinstall + scripts/dedupe-deps.cjs retires (snapshot consomme depuis registry)"
fi

echo ""
echo "[DONE] examples/$VERSION/ pret. Verifier le diff puis commit."
echo "       cd examples/$VERSION/viewer && npm install && npm run build  # test rapide"
