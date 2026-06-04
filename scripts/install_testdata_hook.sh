#!/usr/bin/env bash
# install_testdata_hook.sh — Installe testdata_post_commit_hook.sh dans
# <SA>/SankeyData/.git/hooks/post-commit.
#
# Depuis le retrait du submodule TestData de OS+/OS/SEP/MFA, TestData n'est
# plus embarque que dans SankeyApplication. Un seul hook a poser.
#
# Les hooks git ne sont pas versionnes : a relancer une fois par worktree SA
# (chaque worktree a son propre .git/hooks/).
#
# Usage : scripts/install_testdata_hook.sh [--uninstall]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SA_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

HOOK_SRC="$SCRIPT_DIR/testdata_post_commit_hook.sh"

if [ ! -f "$HOOK_SRC" ]; then
  echo "ERR: $HOOK_SRC introuvable" >&2
  exit 1
fi

TD="$SA_ROOT/SankeyData"
if [ ! -e "$TD" ]; then
  echo "ERR: $TD pas initialise (git submodule update --init ?)" >&2
  exit 1
fi

hooks_dir="$(git -C "$TD" rev-parse --git-path hooks)"
if [[ "$hooks_dir" != /* ]]; then
  hooks_dir="$TD/$hooks_dir"
fi
dst="$hooks_dir/post-commit"

ACTION="${1:-install}"
case "$ACTION" in
  install|"")
    cp "$HOOK_SRC" "$dst"
    chmod +x "$dst"
    echo "[ok] $dst"
    echo
    echo "Le hook se declenche apres chaque 'git commit' dans $TD."
    ;;
  --uninstall)
    if [ -f "$dst" ]; then
      rm "$dst"
      echo "[rm] $dst"
    else
      echo "[skip] $dst : pas installe"
    fi
    ;;
  *)
    echo "Usage: $0 [--uninstall]" >&2
    exit 2
    ;;
esac
