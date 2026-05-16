#!/bin/bash
# Usage: bash update_opensankey.sh [dev|test|prod]
# Default: dev

set -e

# --- Parse argument ---
ENV="${1:-dev}"
if [[ "$ENV" != "dev" && "$ENV" != "test" && "$ENV" != "prod" ]]; then
    echo "Erreur : choisir dev | test | prod"
    exit 1
fi

# --- Paths ---
HOME_DIR="/home/ubuntu"
ENV_DIR="${HOME_DIR}/${ENV}_opensankey"
APP_DIR="${ENV_DIR}/sankeyapplication"
VENV_ACTIVATE="${ENV_DIR}/${ENV}_opensankey/bin/activate"

echo "=== Déploiement ${ENV} (${APP_DIR}) ==="

# --- Activate venv ---
echo ">>> source $VENV_ACTIVATE"
source "$VENV_ACTIVATE"

# --- EIGEN_INCLUDE ---
export EIGEN_INCLUDE="${APP_DIR}/submodules/MFAProblem/submodules/eigen"

# --- Go to app dir ---
cd "$APP_DIR"

# --- Pull & update submodules ---
echo ">>> git pull"
git pull

echo ">>> git submodule update --recursive"
git submodule update --recursive

# --- Build & deploy ---
echo ">>> deploy_SankeyApp.sh"
bash scripts/deploy_SankeyApp.sh

# --- Restart service ---
echo ">>> restart_site.sh ${ENV}"
bash scripts/restart_site.sh "$ENV"

echo "=== Déploiement ${ENV} terminé ==="
