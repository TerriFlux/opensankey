#!/bin/bash

# Build front du monorepo pnpm workspace (#235/#236).
#
# Les couches front (OpenSankey, OpenSankey+, LoginComponent, SA) vivent dans
# packages/ et se resolvent par dependances workspace:* — il n'y a PLUS de
# symlinks src/deps ni de recursion dans des submodules front (l'option -S
# historique est acceptee mais sans effet, pour compatibilite des appels CI).

# Function that trigger exit depending on command output code
exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Check input args
install=false
linter=false
build=false
dist=false
gdeps=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --install_deps | -I )
      install=true
      shift # past argument
      ;;
    --linter | -L )
      linter=true
      shift # past argument
      ;;
    --build | -B)
      build=true
      shift # past argument
      ;;
    --dist | -D)
      dist=true
      shift # past argument
      ;;
    --sub_deps | -S)
      # Obsolete (ex-recursion submodules front) — no-op conserve pour compat
      shift # past argument
      ;;
    --global_deps | -G)
      gdeps=true
      shift # past argument
      ;;
    --help | -H)
      echo 'Options: '
      echo '--install_deps | -I : Install node modules dependencies (workspace racine)'
      echo '--linter | -L : Run linter (tous les paquets)'
      echo '--build | -B : Build standalone du client SA'
      echo '--dist | -D : Compile dist (lib npm @terriflux/sankeyapplication)'
      echo '--global_deps | -G : Installe pnpm (corepack)'
      exit 1
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Repo root (this script lives in scripts/)
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )
cd "$SCRIPT_DIR"

# pnpm epingle via corepack (champ "packageManager" du package.json racine),
# evite ERR_PNPM_LOCKFILE_CONFIG_MISMATCH quand le runner a un autre pnpm.
ensure_pnpm() {
  if command -v corepack &> /dev/null ; then
    corepack enable && corepack prepare pnpm@10.4.1 --activate
  elif ! command -v pnpm &> /dev/null ; then
    npm install -g pnpm@10.4.1
  fi
}

# Install global dependencies
if [ "$gdeps" = true ] ; then
  printf "Global dependencies -------------------------------------------------\n"
  ensure_pnpm
  printf "OK ------------------------------------------------------------------\n"
fi

# Front-end build
printf "\nBuild ---------------------------------------------------------------\n"
if [ "$install" = true ] ; then
  # S3 #18 — builds reproductibles : en CI ($CI defini par GitLab), on impose le
  # lockfile racine versionne ; l'install echoue si le lockfile devrait changer.
  # En local on laisse pnpm resoudre librement (mise a jour de deps).
  if [ -n "$CI" ] ; then
    ensure_pnpm
  fi
  FROZEN=""
  [ -n "$CI" ] && FROZEN="--frozen-lockfile"
  printf ">>> Install deps (workspace racine)\n\n" && pnpm install $FROZEN --config.dangerouslyAllowAllBuilds=true || exit_if_error $?
  printf "\n"
fi
if [ "$linter" = true ] ; then
  printf ">>> Run linter (workspace)\n" && pnpm run lint:ci || exit_if_error $?
fi
if [ "$build" = true ] ; then
  # DISABLE_ESLINT_PLUGIN : l'eslint interne de CRA/craco ne charge pas le plugin
  # typescript-eslint v7/v8 et plante sur les `eslint-disable @typescript-eslint/...` du tableur.
  # Le lint est déjà fait par l'étape dédiée (pnpm run lint:ci).
  printf ">>> Build standalone\n" && DISABLE_ESLINT_PLUGIN=true CI= NODE_OPTIONS=--max-old-space-size=8192 pnpm run build || exit_if_error $?
fi
if [ "$dist" = true ] ; then
  printf ">>> Build distribution lib\n" && pnpm --filter @terriflux/sankeyapplication run dist || exit_if_error $?
fi
printf "OK ------------------------------------------------------------------\n"
