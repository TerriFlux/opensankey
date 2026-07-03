if [[ $# > 0 ]]
then
    if [ $1 == "dev" ] || [ $1 == "test" ] || [ $1 == "prod" ]
    then
        export prefix=$1
    else
        echo 'Erreur : choisir dev | test | prod'
        exit
    fi
else
    export prefix="dev"
fi

sudo systemctl restart nginx
sudo systemctl stop  ${prefix}_opensankey
sudo systemctl start ${prefix}_opensankey
sudo systemctl enable ${prefix}_opensankey
sudo systemctl restart nginx
sudo systemctl status ${prefix}_opensankey --no-pager

# Ce script est un shell séparé : les variables du fichier `env` (chargé par
# systemd via EnvironmentFile dans le service) n'y sont PAS présentes. On source
# donc `env` à la racine de l'app pour récupérer HEALTHCHECK_URL (et co.).
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${APP_DIR}/env"
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
fi

# Health-check post-restart : on interroge /health jusqu'à ce que la base réponde
# (SELECT 1). Si l'URL est configurée et que le check échoue, on sort en non-zéro
# → le déploiement échoue au lieu de laisser un site cassé en ligne.
# HEALTHCHECK_URL doit être posée par env (ex: https://dev.opensankey.fr/health).
# Absente => on saute le check (compat : ne casse pas les déploiements existants).
if [ -n "${HEALTHCHECK_URL:-}" ]; then
    echo "[INFO] Health-check ${prefix} : ${HEALTHCHECK_URL}"
    ok=0
    for i in $(seq 1 10); do
        if curl -fsS --max-time 5 "${HEALTHCHECK_URL}" > /dev/null; then
            ok=1
            break
        fi
        echo "[INFO] /health pas encore prêt (tentative $i/10)…"
        sleep 2
    done
    if [ "$ok" -ne 1 ]; then
        echo "[ERREUR] Health-check KO pour ${prefix} (${HEALTHCHECK_URL}) — déploiement en échec."
        exit 1
    fi
    echo "[INFO] Health-check ${prefix} OK."
else
    echo "[WARN] HEALTHCHECK_URL non définie — health-check sauté pour ${prefix}."
fi
