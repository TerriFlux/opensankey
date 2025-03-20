#!/bin/bash

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
deps=false
gdeps=false

args=$@

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
      echo '--sub_deps | -S : Run sub-scripts of deps'
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
      echo '--sub_deps | -S : Run sub-scripts of deps'
      echo '--global_deps | -G : Run install of global deps'
      exit 1
      ;;
  esac
done

# Get script dir
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Install global dependencies
if [ "$gdeps" = true ] ; then
  printf "\nGlobal dependencies --------------------------------------------------\n"
  global=`npm root -g`
  printf ">>> Installation dans "${global}"\n"
  npm install -g pnpm
  printf "OK -------------------------------------------------------------------\n"
fi

# Check sub deps
if [ "$deps" = true ] ; then
  printf "\nOpenSankey =========================================================\n"
  cd $SCRIPT_DIR/submodules/OpenSankey
  bash build_client.sh $args || exit_if_error $?
  printf "\nOK OpenSankey ========================================================\n"
fi

# Clean sub deps
printf "\nClean deps ----------------------------------------------------------\n"
for dir in node_modules dist build; do
  if [ -d "$SCRIPT_DIR/submodules/OpenSankey/opensankey/client/$dir" ] ; then
    echo "removing $SCRIPT_DIR/submodules/OpenSankey/opensankey/client/$dir"
    rm -r "$SCRIPT_DIR/submodules/OpenSankey/opensankey/client/$dir" || exit_if_error $?
  fi
done
printf "OK --------------------------------------------------------------------\n"

# Recreate links with submodules
printf "\nLinking dependencies ------------------------------------------------\n"
# - Src
cd $SCRIPT_DIR/client/src/deps
if [ -h "OpenSankey" ]; then
  rm OpenSankey
fi
ln -s $SCRIPT_DIR/submodules/OpenSankey/opensankey/client/src OpenSankey
# - Public dir
cd $SCRIPT_DIR/client
if [ -d "public" ]; then
  rm -r public
  git restore public
fi
cp -rs $SCRIPT_DIR/submodules/OpenSankey/opensankey/client/public .
cd $SCRIPT_DIR
printf "OK -------------------------------------------------------------------\n"

# Front-end build
printf "\nBuild --------------------------------------------------------------\n"
cd client
if [ "$install" = true ] ; then
  printf ">>> Install deps\n\n" && pnpm install || exit_if_error $?
  printf "\n"
fi
if [ "$linter" = true ] ; then
  printf ">>> Run linter\n" && pnpm run lint || exit_if_error $?
fi
if [ "$build" = true ] ; then
  printf ">>> Build standalone\n" && CI= pnpm run build || exit_if_error $?
fi
if [ "$dist" = true ] ; then
  printf ">>> Build distribution lib\n" && pnpm run dist || exit_if_error $?
fi
cd ..
printf "OK ------------------------------------------------------------------\n"
