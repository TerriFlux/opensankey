#!/bin/bash
# rollback_release.sh — revenir au slot précédent en quelques secondes (issue #255)
#
# Le rollback n'est qu'une bascule de symlink + un restart : aucun rebuild, aucun
# réseau. C'est tout l'intérêt du déploiement par slots.
#
# Usage :
#   bash scripts/rollback_release.sh <dev|test|prod>            # slot précédent
#   bash scripts/rollback_release.sh <dev|test|prod> <slot_id>  # slot explicite
#   bash scripts/rollback_release.sh <dev|test|prod> --list     # lister les slots
#   bash scripts/rollback_release.sh <dev|test|prod> --dry-run

set -euo pipefail

ENV=""
TARGET=""
DRY_RUN=0
LIST=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    dev|test|prod) ENV="$1"; shift ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --list)        LIST=1; shift ;;
    -h|--help)     sed -n '2,13p' "$0"; exit 0 ;;
    *)             TARGET="$1"; shift ;;
  esac
done

[[ -n "$ENV" ]] || { echo "Environnement requis : dev | test | prod" >&2; exit 1; }

# DEPLOY_ROOT permet de rejouer le script hors du VPS (repetition a blanc,
# tests) en pointant sur une arborescence factice. Non pose en production.
ROOT="${DEPLOY_ROOT:-/home/ubuntu/${ENV}_opensankey}"
RELEASES="${ROOT}/releases"
CURRENT="${ROOT}/current"
SHARED="${ROOT}/shared"
SERVICE="${ENV}_opensankey"

[[ -d "$RELEASES" ]] || { echo "Layout par slots absent : ${RELEASES}" >&2; exit 1; }

ACTIVE=""
[[ -L "$CURRENT" ]] && ACTIVE="$(readlink -f "$CURRENT")"

mapfile -t SLOTS < <(ls -1d "${RELEASES}"/*/ 2>/dev/null | sed 's|/$||' | sort -r)
[[ ${#SLOTS[@]} -gt 0 ]] || { echo "Aucun slot dans ${RELEASES}" >&2; exit 1; }

if [[ $LIST -eq 1 ]]; then
  echo "Slots ${ENV} (du plus récent au plus ancien) :"
  for s in "${SLOTS[@]}"; do
    mark="  "
    [[ "$s" == "$ACTIVE" ]] && mark="* "
    echo "${mark}$(basename "$s")"
  done
  echo "(* = actif)"
  exit 0
fi

# --- Choisir la cible -------------------------------------------------------
if [[ -n "$TARGET" ]]; then
  DEST="${RELEASES}/${TARGET}"
  [[ -d "$DEST" ]] || { echo "Slot inconnu : ${TARGET} (voir --list)" >&2; exit 1; }
else
  # Slot précédent = le plus récent qui n'est pas l'actif.
  DEST=""
  for s in "${SLOTS[@]}"; do
    if [[ "$s" != "$ACTIVE" ]]; then DEST="$s"; break; fi
  done
  [[ -n "$DEST" ]] || { echo "Aucun slot vers lequel revenir (un seul slot présent)." >&2; exit 1; }
fi

[[ "$DEST" != "$ACTIVE" ]] || { echo "Le slot demandé est déjà actif — rien à faire." >&2; exit 0; }

echo "=== Rollback ${ENV} : $(basename "${ACTIVE:-aucun}") → $(basename "$DEST") ==="
if [[ $DRY_RUN -eq 1 ]]; then
  echo "(dry-run)"
  echo "+ ln -sfn ${DEST} ${CURRENT}"
  echo "+ sudo systemctl restart ${SERVICE}"
  exit 0
fi

# Bascule atomique : `ln -sfn` fait unlink()+symlink() (fenêtre où `current`
# n'existe pas) ; le renommage d'un lien temporaire repose sur rename(2).
ln -sfn "$DEST" "${CURRENT}.tmp"
mv -Tf "${CURRENT}.tmp" "$CURRENT"
sudo systemctl restart "$SERVICE"

# --- Vérification -----------------------------------------------------------
if [[ -f "${SHARED}/env" ]]; then
  set -a; . "${SHARED}/env"; set +a
fi
if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
  for i in $(seq 1 10); do
    if curl -fsS --max-time 5 "$HEALTHCHECK_URL" >/dev/null 2>&1; then
      echo "[OK] /health répond après rollback (tentative ${i})"
      exit 0
    fi
    sleep 2
  done
  echo "[ERREUR] /health ne répond pas après le rollback — intervention manuelle requise." >&2
  exit 1
fi

echo "=== Rollback effectué sur $(basename "$DEST") ==="
