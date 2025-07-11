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

# Install requirements
if [ "$from_frozen_requirements" = false ] ; then
  pip install -r requirements.txt  || exit_if_error $?
  pip install -r conda_requirements.txt  || exit_if_error $?
else
  pip install -r requirements_frozen.txt  || exit_if_error $?
  pip install -r conda_requirements_frozen.txt  || exit_if_error $?
fi

# Install deps
cd ./submodules/SankeyExcelParser
bash build.sh || exit_if_error $?
cd ../..

# Flake8
cd opensankey/server
flake8  || exit_if_error $?
cd ../..

# Install
pip install .  || exit_if_error $?
