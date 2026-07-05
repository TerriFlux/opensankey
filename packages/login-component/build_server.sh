#!/bin/bash

# Bash function that ensure exiting if given bash command fail
exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Install requirements
pip install -r requirements.txt | grep -v 'already satisfied'

# Check PEP
cd server
flake8  || exit_if_error $?
cd ..

# Install
pip install .  || exit_if_error $?
