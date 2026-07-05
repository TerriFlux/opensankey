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

# Nettoyage des distributions corrompues "~xxx" laissees dans le site-packages par
# des pip install/uninstall interrompus (EACCES du double canal ubuntu/gitlab-runner,
# process tue en plein milieu). pip les renomme en ~<nom> (ex. logincomponent ->
# ~ogincomponent) sans jamais les supprimer -> "WARNING: Ignoring invalid distribution"
# a chaque build et venv qui se degrade. Suppression idempotente avant install.
SITE_PACKAGES=$(python -c "import sysconfig; print(sysconfig.get_paths()['purelib'])" 2>/dev/null)
if [ -n "$SITE_PACKAGES" ] && [ -d "$SITE_PACKAGES" ]; then
  find "$SITE_PACKAGES" -maxdepth 1 -name '~*' -exec rm -rf {} + 2>/dev/null || true
fi

# Install requirements
# S3 #18 — builds reproductibles : si un requirements_frozen.txt (fige par
# `pip freeze` sur la cible) est present, on l'utilise en priorite sur la cible
# Linux (CI dev/test/prod + update_opensankey.sh). On garde requirements.txt en
# fallback et sur les autres plateformes (dev local Windows/macOS) pour ne pas
# imposer un freeze Linux-specifique. Regenerer apres tout changement de deps :
#   pip freeze > requirements_frozen.txt   (dans le venv de deploiement)
REQ_FILE=requirements.txt
if [ -f requirements_frozen.txt ] && [ "$(uname -s)" = "Linux" ]; then
  REQ_FILE=requirements_frozen.txt
  printf ">>> Requirements figes : %s\n" "$REQ_FILE"
fi
pip_install -r "$REQ_FILE"  || exit_if_error $?

# Install deps — depuis le monorepo (#235), les couches front vivent dans
# packages/ (OpenSankey+ etait un simple passe-plat vers OpenSankey) ;
# MFAProblem reste un submodule Python.
for dep in packages/opensankey packages/login-component submodules/MFAProblem; do
  cd ./$dep
  bash build_server.sh || exit_if_error $?
  cd - > /dev/null
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

