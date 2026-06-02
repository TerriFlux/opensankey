#!/bin/bash
# Function to exit if any error -> for CI / CD
exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Check args
install=false
linter=false
build=false
dist=false
deps=false
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
      deps=true
      shift # past argument
      ;;
    --global_deps | -G)
      gdeps=true
      shift # past argument
      ;;
    --help | -H)
      echo 'Options: '
      echo '--install_deps | -I : Install node modules dependencies'
      echo '--linter | -L : Run linter'
      echo '--build | -B : Run build'
      echo '--dist | -D : Compile dist'
      echo '--global_deps | -G : Run install of global deps'
      exit 1
      ;;
    *)
      echo 'Unknown option $1'
      echo ''
      echo 'Options: '
      echo '--install_deps | -I : Install node modules dependencies'
      echo '--linter | -L : Run linter'
      echo '--build | -B : Run build'
      echo '--dist | -D : Compile dist'
      echo '--global_deps | -G : Run install of global deps'
      exit 1
      ;;
  esac
done

# Install global dependencies
if [ "$gdeps" = true ] ; then
  printf "\nGlobal dependencies ------------------------------------------------\n"
  global=`npm root -g`
  printf ">>> Installation dans "${global}"\n"
  npm install -g pnpm
  printf "OK -----------------------------------------------------------------\n"
fi

# Front-end build
printf "\nBuild --------------------------------------------------------------\n"
cd opensankey/client
if [ "$install" = true ] ; then
  printf ">>> Install deps\n\n" && pnpm install --config.dangerouslyAllowAllBuilds=true || exit_if_error $?
  printf "\n"
fi
if [ "$linter" = true ] ; then
  printf ">>> Run linter\n" && pnpm run lint || exit_if_error $?
fi
if [ "$build" = true ] ; then
  # DISABLE_ESLINT_PLUGIN: OS build = react-scripts brut (pas craco comme OS+/SA) ; l'eslint
  # interne de CRA ne charge pas le plugin typescript-eslint v7/v8 et plante sur les commentaires
  # `eslint-disable @typescript-eslint/...` des fichiers tableur. Le lint est déjà fait par
  # l'étape dédiée `eslint --fix ./src` au-dessus.
  printf ">>> Build standalone\n" && DISABLE_ESLINT_PLUGIN=true CI= pnpm run build || exit_if_error $?
fi
if [ "$dist" = true ] ; then
  printf ">>> Build distribution lib\n" && pnpm run dist || exit_if_error $?
fi
cd ../..
printf "OK -----------------------------------------------------------------\n"