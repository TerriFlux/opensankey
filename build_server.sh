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
pip install -r requirements.txt  || exit_if_error $?

# Install deps
for submodule in OpenSankey+ LoginComponent MFAProblem; do
  cd ./submodules/$submodule
  bash build_server.sh || exit_if_error $?
  cd ../..
done

# Check PEP
cd server
flake8  || exit_if_error $?
cd ..

# Build Sphinx documentation (fr + en) served by Flask blueprint at /doc/<lang>/
printf "Sphinx documentation ----------------------------------------------\n"
for lang in fr en; do
  printf ">>> Build doc lang=%s\n" "$lang"
  sphinx-build -b html "doc/sources/$lang" "doc/build/html/$lang" || exit_if_error $?
done

