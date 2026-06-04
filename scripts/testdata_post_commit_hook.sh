#!/usr/bin/env bash
# testdata_post_commit_hook.sh — Hook post-commit pose dans <SA>/SankeyData/.git/hooks/.
#
# A chaque commit dans SankeyData, propose de pousser SankeyData + bumper le
# pointeur dans SA + commit/push SA, via bump_testdata.sh.
#
# Installation : scripts/install_testdata_hook.sh
#
# Auto-detection : on remonte la chaine des superprojects jusqu'au top
# (SA principal ou worktree SA).

set -euo pipefail

TD_DIR="$(git rev-parse --show-toplevel)"

find_sa_root() {
  local p="$1"
  while true; do
    local sup
    sup="$(git -C "$p" rev-parse --show-superproject-working-tree 2>/dev/null || true)"
    if [ -z "$sup" ]; then
      echo "$p"
      return
    fi
    p="$sup"
  done
}

SA_ROOT="$(find_sa_root "$TD_DIR")"

SCRIPT="$SA_ROOT/scripts/bump_testdata.sh"
if [ ! -x "$SCRIPT" ]; then
  echo "[testdata-hook] $SCRIPT introuvable ou non executable, skip." >&2
  exit 0
fi

TARGET_SHA="$(git -C "$TD_DIR" rev-parse HEAD)"
SHORT="$(git -C "$TD_DIR" rev-parse --short=12 HEAD)"

echo
echo "================================================================"
echo " SankeyData : commit detecte"
echo " SA root    : $SA_ROOT"
echo " Target SHA : $SHORT"
echo "================================================================"
echo
read -p "Lancer bump_testdata.sh maintenant ? [y/N] " ans
[ "${ans,,}" = "y" ] || { echo "Skipped. Tu peux le lancer plus tard :"; echo "  $SCRIPT '$SA_ROOT' $TARGET_SHA"; exit 0; }

exec bash "$SCRIPT" "$SA_ROOT" "$TARGET_SHA"
