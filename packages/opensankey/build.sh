#!/bin/bash

exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

pip install -r requirements.txt  || exit_if_error $?
pip install -r conda_requirements.txt  || exit_if_error $?
flake8  || exit_if_error $?
cd opensankey/doc
sphinx-multibuild -i ./sources/index -i ./sources/pages -i ./sources/subpages -s ./build/tmp -o ./build/html -b html -c ./sources/  || exit_if_error $?
cd ../..
pip install .  || exit_if_error $?

