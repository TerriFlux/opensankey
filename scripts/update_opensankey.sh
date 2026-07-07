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
# Exporté pour que toute la chaîne de build (deploy_SankeyApp.sh -> build_client.sh
# -> pnpm run build -> craco.config.cjs) hérite de process.env.ENV et calcule le
# bon canal de version (prod=stable, test=beta, sinon alpha). Sans export, un
# déploiement prod produisait un bundle « alpha ». (Porté du hotfix prod 5358a0362.)
export ENV="${1:-dev}"
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

# --- Réparation des droits du checkout partagé ---
# Deux déployeurs écrivent ici : ubuntu (ce script) et gitlab-runner (CI).
# Malgré umask 002 + groupe deploy + setgid, des fichiers non group-writable
# réapparaissent (installs antérieurs au réglage, outils qui forcent leurs
# permissions) et font échouer le déploiement suivant de l'autre utilisateur
# (EACCES quand pnpm recrée node_modules). On répare AVANT le build, en ne
# touchant que les fichiers fautifs pour rester rapide quand tout est sain.
if getent group deploy >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    echo ">>> réparation droits checkout partagé (owner, groupe deploy, g+w, setgid)"
    DEPLOY_USER="$(id -un)"
    # chmod n'est permis qu'au propriétaire : pnpm fait des chmod +x au link
    # des binaires -> EPERM sur les fichiers appartenant à l'autre déployeur.
    # Le déployeur courant prend donc la propriété (le groupe reste deploy).
    sudo find "$APP_DIR" ! -user "$DEPLOY_USER" -exec chown "$DEPLOY_USER" {} + 2>/dev/null || true
    sudo find "$APP_DIR" ! -group deploy -exec chgrp deploy {} + 2>/dev/null || true
    sudo find "$APP_DIR" -type d ! -perm -2070 -exec chmod g+rwxs {} + 2>/dev/null || true
    sudo find "$APP_DIR" -type f ! -perm -g+w -exec chmod g+w {} + 2>/dev/null || true
fi

# --- Archive currently-deployed version before overwriting it ---
# Enabled for prod only (pas de snapshot figé sur dev ni test).
if [[ "$ENV" == "prod" ]]; then
    CURRENT_VERSION=$(grep -m1 '"version"' "${APP_DIR}/packages/sankeyapplication/package.json" \
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

# --- Backup DB + migrations Alembic ---
# Aligné sur les jobs de deploy de la CI (.gitlab-ci.yml : dev_opensankey /
# test_opensankey / prod_opensankey) qui, entre le build et le restart, font :
#   cp server/db.sqlite server/db.sqlite.bk/db_`date --iso-8601='seconds'`.sqlite
#   find ./server/db.sqlite.bk -mtime +N -type f -delete
#   alembic upgrade head
# Le script SSH manuel ne le faisait pas → risque de tourner sur un schéma
# périmé ou de casser la base. On reproduit ici la même séquence.
#
# cwd = $APP_DIR (on n'a pas quitté ce répertoire depuis le `cd` plus haut),
# ce qui correspond à l'URL relative d'alembic.ini (sqlalchemy.url =
# sqlite:///server/db.sqlite) et au REPO_FOLDER de la CI. Le venv est déjà
# activé, donc `alembic` est celui de l'environnement cible.
#
# set -e garantit les garde-fous demandés : si le backup OU la migration
# échoue, le script sort en non-zéro AVANT le restart (pas de redémarrage sur
# une base non migrée / non sauvegardée).

# Rétention des backups par environnement (identique à la CI).
case "$ENV" in
    dev)  BK_RETENTION_DAYS=30  ;;
    test) BK_RETENTION_DAYS=180 ;;
    prod) BK_RETENTION_DAYS=365 ;;
esac

DB_FILE="${APP_DIR}/server/db.sqlite"
DB_BK_DIR="${APP_DIR}/server/db.sqlite.bk"

# Idempotent : crée le dossier de backups s'il n'existe pas encore.
mkdir -p "$DB_BK_DIR"

if [[ -f "$DB_FILE" ]]; then
    DB_BK_FILE="${DB_BK_DIR}/db_$(date --iso-8601='seconds').sqlite"
    echo ">>> backup db.sqlite -> ${DB_BK_FILE}"
    # Copie cohérente via `sqlite3 .backup` si dispo (respecte les verrous /
    # transactions en cours) ; sinon repli sur `cp` — c'est ce que fait la CI.
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "$DB_FILE" ".backup '${DB_BK_FILE}'"
    else
        cp "$DB_FILE" "$DB_BK_FILE"
    fi
    # Purge des backups plus vieux que la rétention (mêmes seuils que la CI).
    find "$DB_BK_DIR" -mtime +"$BK_RETENTION_DAYS" -type f -delete
else
    # Premier déploiement : pas encore de base à sauvegarder. `alembic upgrade
    # head` créera la base et appliquera toutes les migrations.
    echo ">>> pas de ${DB_FILE} à sauvegarder (premier déploiement ?) — skip backup"
fi

echo ">>> alembic upgrade head"
alembic upgrade head

# --- Restart service ---
echo ">>> restart_site.sh ${ENV}"
bash scripts/restart_site.sh "$ENV"

echo "=== Déploiement ${ENV} terminé ==="
