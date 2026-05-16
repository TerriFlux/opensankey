#!/bin/bash

exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Silence pip noise (already-satisfied, version-check, progress bar) — héritées par les build_server.sh des submodules
export PIP_QUIET=${PIP_QUIET:-1}
export PIP_DISABLE_PIP_VERSION_CHECK=${PIP_DISABLE_PIP_VERSION_CHECK:-1}
export PIP_PROGRESS_BAR=${PIP_PROGRESS_BAR:-off}
export PIP_ROOT_USER_ACTION=${PIP_ROOT_USER_ACTION:-ignore}

# Wrapper "medium-verbose" : garde Building wheels / Installing / Successfully installed,
# masque uniquement le bruit "Requirement already satisfied" et "Using cached".
pip_install() {
  set -o pipefail
  PIP_QUIET=0 pip install "$@" 2>&1 | grep -v -E "^(Requirement already satisfied|Using cached)"
  local rc=${PIPESTATUS[0]}
  set +o pipefail
  return $rc
}

# Anchor to repo root (this script lives in scripts/)
cd "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." && pwd )"

# Install requirements
pip_install -r requirements.txt  || exit_if_error $?

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

