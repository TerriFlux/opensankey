#!/bin/bash
# bootstrap_release_layout.sh — migration UNIQUE d'un env vers le layout par slots (#255)
#
# À lancer UNE SEULE FOIS par environnement, sur le serveur. Prépare le terrain
# sans interrompre le site : l'état partagé (env, cache, base) est DÉPLACÉ dans
# shared/ puis re-lié par symlink dans l'arbre actuellement servi, qui continue
# donc de fonctionner à l'identique.
#
# La bascule effective vers le premier slot est faite ensuite par
# `deploy_release.sh <env>`.
#
# Usage :
#   bash scripts/bootstrap_release_layout.sh <dev|test|prod> [--dry-run] [--with-nginx]
#
#   --with-nginx  Applique aussi le changement de socket dans la conf nginx.
#                 Sans cette option, la ligne à changer est seulement affichée.

set -euo pipefail

ENV=""
DRY_RUN=0
WITH_NGINX=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    dev|test|prod) ENV="$1"; shift ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --with-nginx)  WITH_NGINX=1; shift ;;
    -h|--help)     sed -n '2,17p' "$0"; exit 0 ;;
    *) echo "Argument inconnu : $1" >&2; exit 1 ;;
  esac
done
[[ -n "$ENV" ]] || { echo "Environnement requis : dev | test | prod" >&2; exit 1; }

# DEPLOY_ROOT permet de rejouer le script hors du VPS (repetition a blanc,
# tests) en pointant sur une arborescence factice. Non pose en production.
ROOT="${DEPLOY_ROOT:-/home/ubuntu/${ENV}_opensankey}"
LIVE_APP="${ROOT}/sankeyapplication"
RELEASES="${ROOT}/releases"
SHARED="${ROOT}/shared"
SOCKET="${ROOT}/sankeyapp.sock"
SERVICE="${ENV}_opensankey"
SYSTEMD_FILE="/etc/systemd/system/${SERVICE}.service"
NGINX_SITE="/etc/nginx/sites-enabled/${ENV}_opensankey"

run() {
  echo "+ $*"
  [[ $DRY_RUN -eq 1 ]] && return 0
  "$@"
}

[[ -d "$LIVE_APP" ]] || { echo "Introuvable : ${LIVE_APP}" >&2; exit 1; }

echo "=== Bootstrap layout par slots — ${ENV} ==="
[[ $DRY_RUN -eq 1 ]] && echo "(dry-run — aucune modification)"

# --- 1. Arborescence --------------------------------------------------------
run mkdir -p "$RELEASES" "$SHARED"

# --- 2. Extraire l'état partagé, puis le re-lier dans l'arbre servi ---------
# DÉPLACER (et non copier) : une copie créerait deux sources de vérité, et la
# divergence serait silencieuse. Le symlink de retour garantit que l'instance
# actuellement en train de tourner continue de lire/écrire exactement les mêmes
# fichiers, sans redémarrage.
migrate() {
  local name="$1" src="${LIVE_APP}/$2" dest="${SHARED}/$1"
  if [[ -L "$src" ]]; then
    echo "  = ${name} : déjà migré (symlink)"
    return 0
  fi
  if [[ ! -e "$src" ]]; then
    echo "  ! ${name} : absent de l'arbre servi (${src}) — ignoré"
    return 0
  fi
  run mv "$src" "$dest"
  run ln -sfn "$dest" "$src"
  echo "  → ${name} déplacé dans shared/ et re-lié"
}

migrate "env"           "env"
migrate "cache"         "cache"
migrate "db.sqlite"     "server/db.sqlite"
migrate "db.sqlite.bk"  "server/db.sqlite.bk"

# --- 3. Socket à chemin stable ---------------------------------------------
# Le socket doit vivre HORS des slots : sinon son chemin changerait à chaque
# déploiement et nginx devrait être reconfiguré à chaque fois. `sankeyapp.ini`
# le lit via $(UWSGI_SOCKET), fourni par le fichier env.
ENV_FILE="${SHARED}/env"
if [[ $DRY_RUN -eq 0 ]]; then
  if grep -q '^UWSGI_SOCKET=' "$ENV_FILE" 2>/dev/null; then
    echo "  = UWSGI_SOCKET déjà présent dans shared/env"
  else
    echo "UWSGI_SOCKET=${SOCKET}" >> "$ENV_FILE"
    echo "  → UWSGI_SOCKET=${SOCKET} ajouté à shared/env"
  fi
else
  echo "+ ajouter UWSGI_SOCKET=${SOCKET} à ${ENV_FILE}"
fi

# --- 4. Unit systemd pointant sur `current` --------------------------------
# WorkingDirectory traverse le symlink `current` : un simple `systemctl restart`
# après la bascule suffit à charger le nouveau slot.
SYSTEMD_BODY="$(cat <<EOF
[Unit]
Description=uWSGI instance to serve OpenSankey ${ENV} (deploiement par slots, #255)
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=${ROOT}/current/sankeyapplication
EnvironmentFile=${SHARED}/env
ExecStart=${ROOT}/current/venv/bin/uwsgi --ini sankeyapp.ini

[Install]
WantedBy=multi-user.target
EOF
)"
if [[ $DRY_RUN -eq 0 ]]; then
  if [[ -f "$SYSTEMD_FILE" ]]; then
    sudo cp -n "$SYSTEMD_FILE" "${SYSTEMD_FILE}.pre255.bak" || true
    echo "  → ancienne unit sauvegardée : ${SYSTEMD_FILE}.pre255.bak"
  fi
  echo "$SYSTEMD_BODY" | sudo tee "$SYSTEMD_FILE" >/dev/null
  sudo systemctl daemon-reload
  echo "  → unit systemd réécrite (prend effet au prochain restart, donc à la 1re bascule)"
else
  echo "+ écrire ${SYSTEMD_FILE} (WorkingDirectory=${ROOT}/current/sankeyapplication)"
fi

# --- 5. nginx : uwsgi_pass vers le socket stable ---------------------------
echo
echo "--- nginx ---"
echo "Le socket passe de  ${LIVE_APP}/sankeyapp.sock"
echo "              à     ${SOCKET}"
echo "Ligne à obtenir dans ${NGINX_SITE} :"
echo "    uwsgi_pass unix:${SOCKET};"
if [[ $WITH_NGINX -eq 1 && $DRY_RUN -eq 0 ]]; then
  sudo cp -n "$NGINX_SITE" "${NGINX_SITE}.pre255.bak" || true
  sudo sed -i "s|uwsgi_pass unix:${LIVE_APP}/sankeyapp.sock;|uwsgi_pass unix:${SOCKET};|g" "$NGINX_SITE"
  sudo nginx -t
  echo "  → nginx patché (sauvegarde : ${NGINX_SITE}.pre255.bak). NE PAS recharger maintenant."
else
  echo "(non appliqué — relancer avec --with-nginx, ou éditer à la main)"
fi

cat <<EOF

=== Bootstrap ${ENV} terminé ===

Le site tourne TOUJOURS sur l'ancien arbre : rien n'a été redémarré.

⚠️  La bascule vers le premier slot provoque une COUPURE DE QUELQUES SECONDES
    (le temps que nginx soit rechargé sur le nouveau socket et que le service
    redémarre). À faire sur dev d'abord.

Étapes suivantes :
  1. bash scripts/deploy_release.sh ${ENV}     # construit le 1er slot et bascule
  2. sudo systemctl reload nginx               # nginx pointe sur le socket stable
  3. curl -fsS \$HEALTHCHECK_URL                # vérifier

Rollback à tout moment :
  bash scripts/rollback_release.sh ${ENV} --list
  bash scripts/rollback_release.sh ${ENV}
EOF
