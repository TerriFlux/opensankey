#!/usr/bin/env bash
# Sert la racine examples/ en HTTP local sur :8000.
# Usage : ./serve.sh [<port>]
set -euo pipefail
PORT="${1:-8000}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:$PORT/"
echo "Servir $DIR sur $URL"
if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then open "$URL" &
fi
cd "$DIR"
exec python3 -m http.server "$PORT"
