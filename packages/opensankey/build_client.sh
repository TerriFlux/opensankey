#!/bin/bash

exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Front-end build
cd opensankey/client
npm install || exit_if_error $?
npm run lint || exit_if_error $?
CI= npm run build || exit_if_error $?
cd ../..