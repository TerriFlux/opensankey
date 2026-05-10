#!/usr/bin/env bash
# Builde tous les exemples React (viewer + editor) de chaque version.
# Usage :
#   ./build-all.sh             # build tout (skip si node_modules existe)
#   ./build-all.sh --force     # force npm install partout
#   ./build-all.sh --only 1.1.3   # build seulement une version

set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE=0
ONLY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --force) FORCE=1; shift ;;
        --only) ONLY="$2"; shift 2 ;;
        *) echo "Usage: $0 [--force] [--only <version>]"; exit 1 ;;
    esac
done

EXAMPLES=(
    "1.0.7/viewer"
    "1.0.7/editor"
    "1.1.1/viewer"
    "1.1.1/editor"
    "1.1.3/viewer"
    "1.1.3/editor"
)

if [ -n "$ONLY" ]; then
    EXAMPLES=($(printf '%s\n' "${EXAMPLES[@]}" | grep "^$ONLY/"))
fi

built=()
failed=()
skipped=()

for ex in "${EXAMPLES[@]}"; do
    SRC="$DIR/$ex"
    echo ""
    echo "----------------------------------------------------"
    echo "[BUILD] $ex"

    if [ ! -d "$SRC" ]; then
        echo "[SKIP] source introuvable"
        skipped+=("$ex")
        continue
    fi

    (
        set -e
        cd "$SRC"
        if [ "$FORCE" = "1" ] || [ ! -d node_modules ]; then
            echo "[STEP] npm install (--legacy-peer-deps)..."
            npm install --no-audit --no-fund --prefer-offline --legacy-peer-deps
        else
            echo "[SKIP] node_modules present"
        fi
        export PUBLIC_URL="."
        export CI=false
        echo "[STEP] npm run build..."
        npm run build
        [ -d build ] || { echo "build/ manquant"; exit 1; }
    )

    if [ $? -eq 0 ]; then
        echo "[OK] $ex"
        built+=("$ex")
    else
        echo "[ERR] $ex"
        failed+=("$ex")
    fi
done

echo ""
echo "===================================================="
echo "Recapitulatif:"
echo "  Buildes  (${#built[@]}): ${built[*]:-(none)}"
[ ${#skipped[@]} -gt 0 ] && echo "  Skippes  (${#skipped[@]}): ${skipped[*]}"
[ ${#failed[@]}  -gt 0 ] && echo "  Echoues  (${#failed[@]}): ${failed[*]}"
echo ""
echo "Pour tester : ./serve.sh puis ouvrir http://localhost:8000/"

[ ${#failed[@]} -eq 0 ]
