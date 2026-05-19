#!/usr/bin/env bash
# bump_testdata.sh — Bump le pointeur du submodule TestData dans SankeyApplication.
#
# Usage : scripts/bump_testdata.sh [SA_ROOT] [TARGET_SHA]
#
# Defaults :
#   SA_ROOT     = dossier parent de scripts/
#   TARGET_SHA  = HEAD courant de $SA_ROOT/TestData
#
# Depuis le retrait du submodule TestData de OS+/OS/SEP/MFA, TestData n'est
# plus embarque que dans SankeyApplication. Le bump = un seul commit dans SA.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SA_ROOT="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"

[ -d "$SA_ROOT/TestData/.git" ] || [ -f "$SA_ROOT/TestData/.git" ] || {
  echo "ERR: $SA_ROOT/TestData not a git repo/submodule" >&2
  exit 1
}

TARGET_SHA="${2:-$(git -C "$SA_ROOT/TestData" rev-parse HEAD)}"
SHORT="$(git -C "$SA_ROOT/TestData" rev-parse --short=12 "$TARGET_SHA")"

echo "================================================================"
echo " bump_testdata.sh"
echo "----------------------------------------------------------------"
echo " SA root      : $SA_ROOT"
echo " Target SHA   : $TARGET_SHA ($SHORT)"
echo "================================================================"
echo
read -p "Push TestData + bump pointer in SA + commit/push SA ? [y/N] " ans
[ "${ans,,}" = "y" ] || { echo "Annule."; exit 0; }
echo

echo "==> [1/3] push TestData $SHORT"
git -C "$SA_ROOT/TestData" push origin HEAD
echo

echo "==> [2/3] bump pointer dans SA"
git -C "$SA_ROOT/TestData" fetch --quiet origin
git -C "$SA_ROOT/TestData" checkout --quiet --detach "$TARGET_SHA"
git -C "$SA_ROOT" add -- TestData
if git -C "$SA_ROOT" diff --cached --quiet; then
  echo "    (pointeur deja a jour, rien a committer)"
  exit 0
fi
git -C "$SA_ROOT" commit -m "chore: bump TestData -> $SHORT" --quiet
echo "    commit cree : $(git -C "$SA_ROOT" log -1 --format=%h)"
echo

echo "==> [3/3] push SA"
git -C "$SA_ROOT" push origin HEAD
echo

echo "================================================================"
echo " Done. TestData $SHORT propage dans SA."
echo "================================================================"
