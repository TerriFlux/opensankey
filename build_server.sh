#!/bin/bash

exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Check args
from_frozen_requirements=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --from-frozen-requirement | -f )
      from_frozen_requirements=true
      shift # past argument
      ;;
    --help | -H)
      echo 'Options: '
      echo '--from-frozen-requirement | -f : Requirements from frozen requirements files'
      exit 1
      ;;
    *)
      echo 'Unknown option $1'
      echo ''
      echo 'Options: '
      echo '--from-frozen-requirement | -f : Requirements from frozen requirements files'
      exit 1
      ;;
  esac
done

# Chronometrage par phase, meme convention que scripts/build_client.sh du depot
# appelant : ">>> <phase> : Ns", motif que deploy_SankeyApp.sh remonte en recap.
#
# Ce paquet pese 67 s sur les 145 de la branche serveur, et ces 67 s etaient
# opaques : PIP_QUIET=1 est exporte par l'appelant, donc le journal ne contient
# PAS UNE LIGNE entre le chrono precedent et le suivant. Impossible de savoir si
# le temps part dans l'installation de dependances tierces (pandas, numpy — donc
# dans le venv partage, non parallelisable) ou dans la construction de paquets
# locaux (isolee, donc parallelisable avec MFAProblem). La question decide d'un
# chantier, elle merite une mesure.
phase_os() {
  printf ">>> OS/%s : %ss\n" "$1" "$(( $(date +%s) - $2 ))"
}

# Install requirements
T_OS=$(date +%s)
if [ "$from_frozen_requirements" = false ] ; then
  pip install -r requirements.txt  || exit_if_error $?
  pip install -r conda_requirements.txt  || exit_if_error $?
else
  pip install -r requirements_frozen.txt  || exit_if_error $?
  pip install -r conda_requirements_frozen.txt  || exit_if_error $?
fi
phase_os "requirements" "$T_OS"

# Install deps
T_OS=$(date +%s)
cd ./submodules/SankeyExcelParser
bash build.sh || exit_if_error $?
cd ../..
phase_os "SankeyExcelParser" "$T_OS"

# Flake8
T_OS=$(date +%s)
cd opensankey/server
flake8  || exit_if_error $?
cd ../..
phase_os "flake8" "$T_OS"

# Install
T_OS=$(date +%s)
pip install .  || exit_if_error $?
phase_os "pip install ." "$T_OS"
