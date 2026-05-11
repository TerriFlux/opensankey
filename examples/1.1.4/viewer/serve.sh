#!/usr/bin/env bash
# Sert le dossier `build/` (sortie de `pnpm run build`) en HTTP local.
# Indispensable pour que les fetch() runtime (diagrams_list, diagram=...,
# .json.gz) fonctionnent — file:// est bloque par les navigateurs (CORS).
# Usage : ./serve.sh [port]   (def: 8000)

set -euo pipefail

PORT="${1:-8000}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$DIR/build"

if [ ! -d "$BUILD_DIR" ]; then
    echo "Dossier 'build/' introuvable. Lance d'abord 'pnpm run build' (ou 'npm run build')." >&2
    exit 1
fi

PY=""
for cmd in python3 python py; do
    if command -v "$cmd" >/dev/null 2>&1; then
        PY="$cmd"
        break
    fi
done

if [ -z "$PY" ]; then
    echo "Python introuvable. Installez Python 3, ou utilisez 'npx serve build -p $PORT'." >&2
    exit 1
fi

URL="http://localhost:$PORT/"
echo "Servir $BUILD_DIR sur $URL"
echo "Python : $PY"

# Ouvre le navigateur (best-effort, selon OS)
( sleep 1; xdg-open "$URL" 2>/dev/null || open "$URL" 2>/dev/null || true ) &

cd "$BUILD_DIR"
exec "$PY" -m http.server "$PORT"
