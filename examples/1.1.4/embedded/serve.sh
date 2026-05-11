#!/usr/bin/env bash
# Sert ce dossier en HTTP local (contourne CORS file://).
# Usage : ./serve.sh [<port>]   (def: 8000)

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
