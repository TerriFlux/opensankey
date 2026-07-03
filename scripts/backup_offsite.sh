#!/bin/bash
#
# backup_offsite.sh — Sauvegarde quotidienne hors-site de SankeyApplication.
#
# Ce script produit une archive datée LÉGÈRE contenant :
#   - un dump COHÉRENT de la base SQLite (via `sqlite3 .backup`, jamais un cp à chaud)
#   - le dossier des préférences utilisateur (USER_PREF_REP)
#   - le dossier cache/ (compteurs d'essai, analytics)
# puis l'envoie par scp sur le mutualisé OVH, en réutilisant EXACTEMENT le
# mécanisme d'authentification SSH déjà en place pour la publication
# (server/publish.py : variables d'environnement SANKEY_DEPLOY_*).
#
# MFAData (stockage du gestionnaire de fichiers = fichiers utilisateurs) est
# VOLONTAIREMENT EXCLU : il pèse ~12G, ce qui rend impraticable un tar quotidien
# vers le mutualisé OVH (14 jours × 12G) et saturait le disque en zone temporaire.
# Il doit être sauvegardé séparément (miroir rsync incrémental vers une cible
# dédiée, ou snapshot VPS). Voir la variable SANKEY_BACKUP_INCLUDE_MFADATA plus bas.
#
# On tare DIRECTEMENT depuis les dossiers source (pas de copie intermédiaire) :
# la zone temporaire ne contient que le dump SQLite + l'archive finale (petits).
#
# ---------------------------------------------------------------------------
# ENTRÉE CRONTAB (à installer avec `crontab -e` sous l'utilisateur `ubuntu`) :
#
#   # Sauvegarde hors-site quotidienne à 03h00 du matin
#   0 3 * * * /home/ubuntu/prod_opensankey/sankeyapplication/scripts/backup_offsite.sh >> /home/ubuntu/backup_offsite.log 2>&1
#
# Adapter le chemin (prod/dev/test) et le fichier de log selon l'environnement.
# ---------------------------------------------------------------------------
#
# Variables d'environnement utilisées (les SANKEY_DEPLOY_* sont partagées avec
# server/publish.py ; elles sont normalement déjà dans <APP_DIR>/env) :
#
#   SANKEY_DEPLOY_HOST   hôte SSH OVH        (défaut : ssh.cluster031.hosting.ovh.net)
#   SANKEY_DEPLOY_USER   utilisateur SSH OVH (défaut : lwdlgxd)
#   SANKEY_DEPLOY_KEY    clé privée SSH      (défaut : clé ~/.ssh du process)
#   SANKEY_DEPLOY_PORT   port SSH            (défaut : 22)
#
#   USER_PREF_REP        dossier des préférences utilisateur (dans <APP_DIR>/env)
#
# Variables propres à la sauvegarde (surchargeables) :
#
#   SANKEY_BACKUP_REMOTE_PATH   dossier distant des sauvegardes
#                               (défaut : "backups" — relatif au HOME SSH OVH)
#   SANKEY_BACKUP_DB            chemin de la base SQLite
#                               (défaut : <APP_DIR>/server/db.sqlite)
#   SANKEY_BACKUP_KEEP_DAYS     rétention en jours, distant (défaut : 14)
#   SANKEY_BACKUP_ENV_FILE      fichier d'env à sourcer (défaut : <APP_DIR>/env)
#   SANKEY_BACKUP_TAG           suffixe de nom (ex. prod/dev) ; sinon déduit du dossier
#   SANKEY_BACKUP_TMPDIR        zone temporaire (défaut : $TMPDIR ou /tmp)
#   SANKEY_BACKUP_INCLUDE_MFADATA  "1" pour inclure MFAData dans le tar (DÉCONSEILLÉ :
#                               gros volume). Défaut : non inclus.
#
set -euo pipefail

# --- 0. Localisation de l'application ---------------------------------------
# APP_DIR = parent du dossier scripts/ (racine du checkout sankeyapplication).
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

echo "=== Sauvegarde hors-site SankeyApplication ($(date '+%Y-%m-%d %H:%M:%S')) ==="
echo ">>> APP_DIR = ${APP_DIR}"

# --- 1. Charger l'environnement de déploiement ------------------------------
# Le fichier <APP_DIR>/env porte USER_PREF_REP et les SANKEY_DEPLOY_* (le même
# EnvironmentFile que celui consommé par systemd/uwsgi). On le source pour
# disposer des mêmes valeurs que le serveur en production.
ENV_FILE="${SANKEY_BACKUP_ENV_FILE:-${APP_DIR}/env}"
if [[ -f "$ENV_FILE" ]]; then
    echo ">>> source ${ENV_FILE}"
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
else
    echo "!!! Fichier d'env introuvable : ${ENV_FILE} (on continue avec l'environnement courant)"
fi

# --- 2. Résolution des chemins à sauvegarder --------------------------------
DB_FILE="${SANKEY_BACKUP_DB:-${APP_DIR}/server/db.sqlite}"
CACHE_DIR="${APP_DIR}/cache"
USER_PREF_DIR="${USER_PREF_REP:-}"
MFADATA_DIR="${MFAData:-}"

KEEP_DAYS="${SANKEY_BACKUP_KEEP_DAYS:-14}"

# Étiquette (prod/dev/test) : fournie explicitement, sinon déduite du nom du
# dossier parent de l'app (ex. /home/ubuntu/prod_opensankey -> "prod").
if [[ -n "${SANKEY_BACKUP_TAG:-}" ]]; then
    TAG="$SANKEY_BACKUP_TAG"
else
    PARENT_NAME="$(basename "$(dirname "$APP_DIR")")"
    TAG="${PARENT_NAME%%_*}"
    [[ -n "$TAG" ]] || TAG="sankeyapp"
fi

STAMP="$(date '+%Y%m%d_%H%M%S')"
ARCHIVE_NAME="sankeyapp-backup-${TAG}-${STAMP}.tar.gz"

# --- 3. Configuration SSH/OVH (réutilise le mécanisme de publish.py) ---------
DEPLOY_HOST="${SANKEY_DEPLOY_HOST:-ssh.cluster031.hosting.ovh.net}"
DEPLOY_USER="${SANKEY_DEPLOY_USER:-lwdlgxd}"
DEPLOY_PORT="${SANKEY_DEPLOY_PORT:-22}"
DEPLOY_KEY="${SANKEY_DEPLOY_KEY:-}"
REMOTE_PATH="${SANKEY_BACKUP_REMOTE_PATH:-backups}"
REMOTE_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

# Mêmes options non-interactives que publish.py::deploy_artifact_to_server.
SSH_COMMON=(-o StrictHostKeyChecking=accept-new -o BatchMode=yes)
SCP_CMD=(scp "${SSH_COMMON[@]}" -P "$DEPLOY_PORT")
SSH_CMD=(ssh "${SSH_COMMON[@]}" -p "$DEPLOY_PORT")
if [[ -n "$DEPLOY_KEY" ]]; then
    SCP_CMD+=(-i "$DEPLOY_KEY")
    SSH_CMD+=(-i "$DEPLOY_KEY")
fi

# --- 4. Répertoire de travail temporaire ------------------------------------
# La zone temporaire ne contient QUE le dump SQLite + l'archive finale (petits) :
# on ne copie jamais les dossiers volumineux, ils sont tarés depuis leur source.
BASE_TMP="${SANKEY_BACKUP_TMPDIR:-${TMPDIR:-/tmp}}"
WORK_DIR="$(mktemp -d "${BASE_TMP%/}/sankeyapp_backup.XXXXXX")"
# Nettoyage systématique du temporaire, y compris en cas d'échec (trap EXIT).
cleanup() {
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# --- 5. Dump SQLite cohérent -------------------------------------------------
# On utilise la commande `.backup` de sqlite3 (verrou propre + copie atomique),
# JAMAIS un `cp` à chaud qui pourrait capturer une base en cours d'écriture.
if [[ -f "$DB_FILE" ]]; then
    echo ">>> Dump SQLite cohérent : ${DB_FILE}"
    sqlite3 "$DB_FILE" ".backup '${WORK_DIR}/db.sqlite'"
else
    echo "!!! Base SQLite introuvable : ${DB_FILE} — étape critique en échec." >&2
    exit 1
fi

# --- 6. Construction de la liste tar (sources tarées SANS copie) ------------
# `tar -C <dir> <name>` ajoute <name> à l'archive depuis <dir> sans staging.
# Chaque dossier optionnel absent est ignoré avec un avertissement.
ARCHIVE_PATH="${WORK_DIR}/${ARCHIVE_NAME}"
TAR_ARGS=(-czf "$ARCHIVE_PATH" -C "$WORK_DIR" "db.sqlite")

add_tar_dir() {
    local src="$1" label="$2"
    if [[ -z "$src" ]]; then
        echo "!!! ${label} : chemin non défini — ignoré."
        return 0
    fi
    if [[ -d "$src" ]]; then
        echo ">>> Ajout ${label} : ${src}"
        TAR_ARGS+=(-C "$(dirname "$src")" "$(basename "$src")")
    else
        echo "!!! ${label} introuvable : ${src} — ignoré."
    fi
}

add_tar_dir "$USER_PREF_DIR" "user_pref"
add_tar_dir "$CACHE_DIR" "cache"

# MFAData : exclu par défaut (gros volume). Inclus seulement si explicitement
# demandé — DÉCONSEILLÉ (peut saturer le disque et le mutualisé OVH).
if [[ "${SANKEY_BACKUP_INCLUDE_MFADATA:-0}" == "1" ]]; then
    echo "!!! SANKEY_BACKUP_INCLUDE_MFADATA=1 : inclusion de MFAData (gros volume)."
    add_tar_dir "$MFADATA_DIR" "mfadata"
fi

# --- 7. Archive tar.gz horodatée --------------------------------------------
echo ">>> Création de l'archive ${ARCHIVE_NAME}"
tar "${TAR_ARGS[@]}"

ARCHIVE_SIZE="$(du -h "$ARCHIVE_PATH" | cut -f1)"
echo ">>> Archive prête : ${ARCHIVE_PATH} (${ARCHIVE_SIZE})"

# --- 8. Envoi hors-site par scp ---------------------------------------------
# Crée le dossier distant au besoin, puis pousse l'archive.
echo ">>> Préparation du dossier distant ${REMOTE_TARGET}:${REMOTE_PATH}"
"${SSH_CMD[@]}" "$REMOTE_TARGET" "mkdir -p '${REMOTE_PATH}'"

echo ">>> scp vers ${REMOTE_TARGET}:${REMOTE_PATH}/${ARCHIVE_NAME}"
"${SCP_CMD[@]}" "$ARCHIVE_PATH" "${REMOTE_TARGET}:${REMOTE_PATH}/${ARCHIVE_NAME}"

# --- 9. Rotation : suppression des archives trop anciennes -------------------
echo ">>> Rotation distante (> ${KEEP_DAYS} jours)"
"${SSH_CMD[@]}" "$REMOTE_TARGET" \
    "find '${REMOTE_PATH}' -maxdepth 1 -name 'sankeyapp-backup-*.tar.gz' -mtime +${KEEP_DAYS} -delete" \
    || echo "!!! Rotation distante non concluante (find -delete indisponible ?) — à vérifier."

echo "=== Sauvegarde terminée : ${REMOTE_PATH}/${ARCHIVE_NAME} ==="
