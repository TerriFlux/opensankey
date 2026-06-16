#!/bin/bash
# Usage: bash update_opensankey.sh [dev|test|prod]
# Default: dev

set -e

# --- Shared-deploy umask ---
# Ce dossier est deploye a la fois par ce script (utilisateur ubuntu) et par le
# job CI `dev_opensankey` (utilisateur gitlab-runner). umask 002 rend chaque
# fichier cree group-writable : combine au groupe partage `deploy` + setgid sur
# les repertoires, l'autre utilisateur peut ecraser les artefacts (sinon EACCES
# au build : craco unlink build/, pip wheel sur __init__.py, etc.).
umask 002

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

# --- Archive currently-deployed version before overwriting it ---
# Enabled for prod only (pas de snapshot figé sur dev ni test).
if [[ "$ENV" == "prod" ]]; then
    CURRENT_VERSION=$(grep -m1 '"version"' "${APP_DIR}/client/package.json" \
                      | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')
    SLOT_DIR="${HOME_DIR}/${ENV}_v${CURRENT_VERSION}_opensankey"
    if [[ -n "$CURRENT_VERSION" && ! -e "$SLOT_DIR" ]]; then
        echo ">>> archive_version.sh ${ENV} ${CURRENT_VERSION}"
        bash "${APP_DIR}/archive_version.sh" "$ENV" "$CURRENT_VERSION"
    else
        echo ">>> skip archive (slot ${SLOT_DIR} already exists or version unknown)"
    fi
fi

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
