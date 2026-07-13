#!/bin/bash
# archive_version.sh
#
# Snapshot the currently-deployed OpenSankey (dev or prod) to a frozen,
# self-contained slot served under https://<host>/v<X.Y.Z>/.
#
# Usage:
#   bash archive_version.sh                     # auto-detect version from prod
#   bash archive_version.sh 1.1.3               # explicit version, default env=prod
#   bash archive_version.sh dev                 # auto-detect version on dev
#   bash archive_version.sh dev 1.1.3           # explicit env + version
#   bash archive_version.sh --dry-run dev       # show actions, do nothing
#
# Run on the target server. Needs sudo for systemd + nginx.

set -euo pipefail

DRY_RUN=0
ENV=""
VERSION=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    dev|prod)  ENV="$arg" ;;
    *)         VERSION="$arg" ;;
  esac
done
ENV="${ENV:-prod}"

HOME_DIR="/home/ubuntu"
ENV_DIR="${HOME_DIR}/${ENV}_opensankey"
ENV_APP="${ENV_DIR}/sankeyapplication"
ENV_VENV_NAME="${ENV}_opensankey"

# --- Garde-fou : incompatible avec le layout par slots (#255) ---------------
# Après migration vers les slots, `${ENV_APP}/env` est un SYMLINK vers
# `${ENV_DIR}/shared/env` : les `sed -i` de ce script suivraient le lien et
# corrompraient l'environnement PARTAGÉ (celui du site en production). Par
# ailleurs `cp -a "$ENV_DIR"` embarquerait tous les slots (des gigaoctets).
# On refuse donc de tourner, plutôt que de casser silencieusement.
if [[ -d "${ENV_DIR}/releases" ]] || [[ -L "${ENV_DIR}/current" ]]; then
  cat >&2 <<EOF
archive_version.sh n'est pas encore compatible avec le déploiement par slots (#255).

L'environnement '${ENV}' a été migré (${ENV_DIR}/releases présent). Exécuter ce
script maintenant corromprait ${ENV_DIR}/shared/env (les sed suivraient les
symlinks) et copierait tous les slots.

Son adaptation est le suivi immédiat de #255. En attendant, ne pas archiver
depuis un environnement migré.
EOF
  exit 1
fi

case "$ENV" in
  prod) HOST="open-sankey.fr" ;;
  dev)  HOST="dev.open-sankey.fr" ;;
esac

# --- Detect version ---------------------------------------------------------
if [[ -z "$VERSION" ]]; then
  VERSION=$(grep -m1 '"version"' "${ENV_APP}/packages/sankeyapplication/package.json" \
            | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')
fi
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$ ]]; then
  echo "Version invalide: '$VERSION' (attendu X.Y.Z)" >&2
  exit 1
fi

SLOT="v${VERSION}"                                # ex: v1.1.3
SLOT_VENV_NAME="${ENV}_${SLOT}_opensankey"        # ex: dev_v1.1.3_opensankey
SLOT_DIR="${HOME_DIR}/${SLOT_VENV_NAME}"          # ex: /home/ubuntu/dev_v1.1.3_opensankey
SLOT_APP="${SLOT_DIR}/sankeyapplication"
SLOT_VENV_BIN="${SLOT_DIR}/${SLOT_VENV_NAME}/bin"
SOCKET_NAME="sankeyapp_${ENV}_${SLOT}.sock"       # ex: sankeyapp_dev_v1.1.3.sock
SERVICE_NAME="${ENV}_${SLOT}_opensankey.service"  # ex: dev_v1.1.3_opensankey.service
URL_PREFIX="/${SLOT}"                             # ex: /v1.1.3
SITE_FILE="/etc/nginx/sites-enabled/${ENV}_opensankey"

echo "=== Archive ${ENV} ${VERSION} → ${SLOT_DIR} (https://${HOST}${URL_PREFIX}/) ==="
[[ $DRY_RUN -eq 1 ]] && echo "(dry-run — no changes)"

run() {
  echo "+ $*"
  [[ $DRY_RUN -eq 1 ]] && return 0
  "$@"
}

# Returns true if path exists, OR if we're in dry-run mode (where the file
# won't exist yet because the cp -a in step 1 didn't actually happen).
# This lets later steps preview their planned action even though the file
# they'd operate on doesn't physically exist.
planned() {
  [[ $DRY_RUN -eq 1 ]] || [[ -e "$1" ]]
}

# --- Refuse to overwrite ----------------------------------------------------
if [[ -e "$SLOT_DIR" ]]; then
  echo "Slot ${SLOT_DIR} existe déjà — abandon." >&2
  exit 1
fi

# --- 1. Full copy of env tree (code + venv + any inlined data) -------------
# We freeze code AND venv so the archived version is independent of future
# pip/npm changes. Any MFAData dir living inside ENV_DIR comes along for free.
run cp -a "$ENV_DIR" "$SLOT_DIR"
if planned "${SLOT_DIR}/${ENV_VENV_NAME}"; then
  run mv "${SLOT_DIR}/${ENV_VENV_NAME}" "${SLOT_DIR}/${SLOT_VENV_NAME}"
fi

# --- 2. Repoint venv internals at the new path ------------------------------
PYVENV="${SLOT_DIR}/${SLOT_VENV_NAME}/pyvenv.cfg"
if planned "$PYVENV"; then
  run sed -i "s|/${ENV_VENV_NAME}/${ENV_VENV_NAME}|/${SLOT_VENV_NAME}/${SLOT_VENV_NAME}|g" "$PYVENV"
fi
if planned "$SLOT_VENV_BIN"; then
  # Rewrite shebangs in installed scripts to point at the new venv python.
  if [[ $DRY_RUN -eq 1 ]]; then
    echo "+ grep -rIl ${ENV_DIR}/${ENV_VENV_NAME} ${SLOT_VENV_BIN} | xargs sed -i s|${ENV_DIR}/${ENV_VENV_NAME}|${SLOT_DIR}/${SLOT_VENV_NAME}|g"
  else
    grep -rIl "${ENV_DIR}/${ENV_VENV_NAME}" "$SLOT_VENV_BIN" 2>/dev/null \
      | xargs -r sed -i "s|${ENV_DIR}/${ENV_VENV_NAME}|${SLOT_DIR}/${SLOT_VENV_NAME}|g"
  fi
fi

# --- 3. Snapshot MFAData if it lives OUTSIDE the env tree -------------------
# If MFAData is inlined (e.g. dev: /home/ubuntu/dev_opensankey/data), it has
# already been copied by step 1. Only snapshot when the path points outside.
ENV_FILE_SRC="${ENV_APP}/env"
MFADATA_SRC=""
if [[ -f "$ENV_FILE_SRC" ]]; then
  MFADATA_SRC=$(grep -E '^MFAData=' "$ENV_FILE_SRC" | head -1 | sed -E 's/^MFAData=//')
fi
case "$MFADATA_SRC" in
  ""|"$ENV_DIR"|"$ENV_DIR"/*)
    # Inlined — translate path from ENV_DIR to SLOT_DIR
    MFADATA_DEST="${MFADATA_SRC/${ENV_DIR}/${SLOT_DIR}}"
    echo "+ MFAData inlined under ${ENV_DIR} — already copied (step 1)"
    ;;
  *)
    # MFAData vit HORS de l'arbre env (ex. /home/ubuntu/MFAData, plusieurs Go de
    # données recherche). On ne le COPIE PAS par version — ça remplissait le
    # disque du VPS. Les versions archivées PARTAGENT la MFAData live (données,
    # pas du code : un ancien front lit sans problème la MFAData courante).
    echo "+ MFAData hors env (${MFADATA_SRC}) — partagée (pas de copie par version)"
    MFADATA_DEST="${MFADATA_SRC}"
    ;;
esac

# --- 4. Patch env file (CLIENT_ROOT_URL, MFAData, PATH) --------------------
ENV_FILE="${SLOT_APP}/env"
if planned "$ENV_FILE"; then
  run sed -i \
    -e "s|^CLIENT_ROOT_URL=.*|CLIENT_ROOT_URL=https://${HOST}${URL_PREFIX}/#/|" \
    -e "s|^MFAData=.*|MFAData=${MFADATA_DEST}|" \
    -e "s|${ENV_VENV_NAME}/${ENV_VENV_NAME}/bin|${SLOT_VENV_NAME}/${SLOT_VENV_NAME}/bin|g" \
    "$ENV_FILE"
fi

# --- 5. Patch uwsgi ini (dedicated socket) ----------------------------------
INI_FILE="${SLOT_APP}/sankeyapp.ini"
if planned "$INI_FILE"; then
  run sed -i \
    -e "s|^socket *= *sankeyapp\.sock|socket = ${SOCKET_NAME}|" \
    -e "s|^http-to *= *sankeyapp\.sock|http-to = ${SOCKET_NAME}|" \
    "$INI_FILE"
fi

# --- 6. (no-op) React build uses relative asset paths -----------------------
# CRA's homepage="." produces `./static/sankeyapp/…` in index.html. Those are
# resolved by the browser against the current page URL, so at /v<X.Y.Z>/ they
# naturally become /v<X.Y.Z>/static/sankeyapp/…, which nginx then rewrites
# back to /static/sankeyapp/… for the slot uwsgi. No build-time patching
# needed. (Earlier iteration tried to absolutize, which created a double
# /v<X.Y.Z>/v<X.Y.Z>/ prefix bug.)

# --- 7. Generate systemd service --------------------------------------------
SYSTEMD_FILE="/etc/systemd/system/${SERVICE_NAME}"
SYSTEMD_BODY="$(cat <<EOF
[Unit]
Description=uWSGI instance to serve archived OpenSankey ${ENV} ${VERSION}
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=${SLOT_APP}
EnvironmentFile=${ENV_FILE}
ExecStart=${SLOT_VENV_BIN}/uwsgi --ini sankeyapp.ini

[Install]
WantedBy=multi-user.target
EOF
)"
if [[ $DRY_RUN -eq 0 ]]; then
  echo "$SYSTEMD_BODY" | sudo tee "$SYSTEMD_FILE" >/dev/null
else
  echo "+ write $SYSTEMD_FILE"
fi

# --- 8. Generate nginx location snippet ------------------------------------
SNIPPET="/etc/nginx/snippets/sankey_${ENV}_${SLOT}.conf"
SNIPPET_BODY="$(cat <<EOF
location ${URL_PREFIX}/ {
    rewrite ^${URL_PREFIX}/(.*) /\$1 break;
    include uwsgi_params;
    uwsgi_pass unix:${SLOT_APP}/${SOCKET_NAME};
    if (\$request_method ~* "(GET|POST)") {
        add_header "Access-Control-Allow-Origin"  *;
    }
}
EOF
)"
if [[ $DRY_RUN -eq 0 ]]; then
  echo "$SNIPPET_BODY" | sudo tee "$SNIPPET" >/dev/null
else
  echo "+ write $SNIPPET"
fi

# --- 9. Wire snippet into env nginx site (idempotent) -----------------------
# Insert just above the first `location / {` of the matching server block.
# nginx routes by longest-prefix match, so /v<X.Y.Z>/ wins over / regardless
# of ordering — placement only needs to be inside the right server block.
if [[ $DRY_RUN -eq 1 ]]; then
  echo "+ inject 'include ${SNIPPET};' before first 'location /' in ${SITE_FILE}"
elif ! sudo grep -q "snippets/sankey_${ENV}_${SLOT}.conf" "$SITE_FILE"; then
  sudo sed -i "0,/^[[:space:]]*location \/ {/{s||    include ${SNIPPET};\n    location / {|}" "$SITE_FILE"
fi

# --- 10. Reload + start ----------------------------------------------------
run sudo systemctl daemon-reload
run sudo systemctl enable "$SERVICE_NAME"
run sudo systemctl start "$SERVICE_NAME"
run sudo nginx -t
run sudo systemctl reload nginx

echo "=== Archived ${ENV} ${VERSION} → https://${HOST}${URL_PREFIX}/ ==="
