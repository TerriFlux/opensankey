#!/usr/bin/env bash
#
# scripts/cascade.sh — S3 #20
#
# Helper TRANSITOIRE (en attendant le monorepo) pour propager les pointeurs de
# submodules vers le haut de la chaine :
#
#     SankeyExcelParser --.
#                          }-> OpenSankey -> OpenSankey+ -> SankeyApplication
#     (MFAProblem / LoginComponent / SankeyData : pointeurs directs de SA)
#
# « Cascader » = enregistrer, a chaque niveau, le nouveau commit du/des
# submodule(s) enfant(s), de bas en haut, en un seul passage. NE bump PAS la
# version (cf. CLAUDE.md : cascade != release).
#
# Garde-fou : refuse de tourner si un repo contient des modifications de FICHIERS
# non commitees, ou un submodule *sale* (contenu modifie non commite). Seules les
# avancees de pointeur deja commitees dans l'enfant sont propagees.
#
# Usage :
#   bash scripts/cascade.sh          # commit les pointeurs, sans push
#   bash scripts/cascade.sh --push   # commit + push chaque repo modifie
#
set -euo pipefail

PUSH=false
if [ "${1:-}" = "--push" ]; then
  PUSH=true
elif [ -n "${1:-}" ]; then
  echo "Usage: bash scripts/cascade.sh [--push]" >&2
  exit 2
fi

SA_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." && pwd )
OSP_DIR="$SA_DIR/submodules/OpenSankey+"
OS_DIR="$OSP_DIR/submodules/OpenSankey"

MSG="chore(cascade): bump submodule pointers"

# Liste des chemins de submodules declares dans un repo donne.
list_submodule_paths() {
  git -C "$1" config -f .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null \
    | awk '{print $2}'
}

# Verifie qu'un repo n'a pas de modif de fichiers ni de submodule sale.
# Tolere uniquement ' M <submodule>' (avancee de pointeur deja commitee).
assert_clean_except_gitlinks() {
  local dir="$1" name="$2"
  local subs; subs=$( list_submodule_paths "$dir" )
  local bad=""
  local line xy path
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    xy="${line:0:2}"
    path="${line:3}"
    # Avancee de pointeur d'un submodule (' M ') -> toleree.
    if [ "$xy" = " M" ] && printf '%s\n' "$subs" | grep -qxF "$path"; then
      continue
    fi
    bad+="  ${line}"$'\n'
  done < <( git -C "$dir" status --porcelain --untracked-files=no )
  if [ -n "$bad" ]; then
    echo "[cascade] ABORT : $name contient des modifications non cascadables :" >&2
    printf '%s' "$bad" >&2
    echo "[cascade] Commit (ou stash) ces changements — cascade ne propage que des pointeurs." >&2
    exit 1
  fi
}

# Stage + commit (+push) tous les pointeurs de submodule ayant avance dans un repo.
cascade_dir() {
  local dir="$1" name="$2"
  local subs; subs=$( list_submodule_paths "$dir" )
  local moved=() p
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if git -C "$dir" status --porcelain -- "$p" | grep -q '^ M '; then
      moved+=( "$p" )
    fi
  done <<< "$subs"

  if [ "${#moved[@]}" -eq 0 ]; then
    echo "[cascade] $name : aucun pointeur a propager."
    return
  fi

  echo "[cascade] $name : pointeurs propages -> ${moved[*]}"
  git -C "$dir" add -- "${moved[@]}"
  git -C "$dir" commit -m "$MSG" -m "$( printf '%s\n' "${moved[@]}" )"
  if $PUSH; then
    echo "[cascade] $name : push"
    git -C "$dir" push
  fi
}

# --- 1) Garde-fou sur toute la chaine AVANT de commiter quoi que ce soit ---
assert_clean_except_gitlinks "$OS_DIR"  "OpenSankey"
assert_clean_except_gitlinks "$OSP_DIR" "OpenSankey+"
assert_clean_except_gitlinks "$SA_DIR"  "SankeyApplication"

# --- 2) Cascade de bas en haut ---
# OpenSankey enregistre l'eventuelle avancee de SankeyExcelParser, puis
# OpenSankey+ enregistre OpenSankey, puis SA enregistre OpenSankey+ (et tout
# autre pointeur direct : MFAProblem, LoginComponent, SankeyData).
cascade_dir "$OS_DIR"  "OpenSankey"
cascade_dir "$OSP_DIR" "OpenSankey+"
cascade_dir "$SA_DIR"  "SankeyApplication"

echo "[cascade] Termine."
$PUSH || echo "[cascade] (aucun push — relancer avec --push pour pousser)"
