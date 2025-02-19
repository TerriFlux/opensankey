#!/bin/bash

exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Install requirements
pip install -r requirements.txt | grep -v 'already satisfied' || exit_if_error $?
pip install -r conda_requirements.txt | grep -v 'already satisfied' || exit_if_error $?

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
