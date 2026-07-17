#! /bin/bash

# --- Shared-deploy umask ---
# Ce build est lance a la fois par deploy_release.sh (utilisateur ubuntu) et
# par les jobs CI dev/test/prod_opensankey (utilisateur gitlab-runner). umask 002
# rend chaque artefact group-writable : combine au groupe partage `deploy` +
# setgid sur les repertoires, l'autre utilisateur peut ecraser les artefacts
# (sinon EACCES : craco unlink build/, pip wheel sur __init__.py, etc.).
umask 002

# Bash function that ensure exiting if given bash command fail
exit_if_error() {
  local exit_code=$1
  shift
  [[ $exit_code ]] &&               # do nothing if no error code passed
    ((exit_code != 0)) && {         # do nothing if error code is 0
      exit 1                        # we could also check to make sure error code is numeric when passed
    }
}

# Keep current directory path
SANKEY_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." && pwd )

# Build scripts for SankeyApp client
printf "SankeyApp Client --------------------------------------------------\n"
cd $SANKEY_DIR
bash scripts/build_client.sh -I -B || exit_if_error $?

# Need to change static paths in built SankeyApp client
printf "Change static paths in built SankeyApp client ---------------------\n"
cd $SANKEY_DIR/packages/sankeyapplication
sed -i -e 's/\/static\//\/static\/sankeyapp\//g' ./build/index.html || exit_if_error $?
sed -i -e 's/..\/static\//..\/..\/static\/sankeyapp\//g' ./build/static/css/*.css || exit_if_error $?
sed -i -e 's/static\/sankeyanimation/\static\/sankeyapp\//g' ./build/static/*/* || exit_if_error $?
sed -i -e 's/static\/opensankey/\/static\/sankeyapp\//g' ./build/static/*/* || exit_if_error $?
# Chunks async (lazy-load, ex. Univer) : le runtime webpack dans les .js construit l'URL des
# chunks avec "static/js/" (et "static/css/" pour le CSS async), non couvert par les sed ci-dessus.
# Flask sert /static/sankeyapp/ -> réécrire ces chemins pour que les chunks soient trouvés.
sed -i -e 's/static\/js\//static\/sankeyapp\/js\//g' -e 's/static\/css\//static\/sankeyapp\/css\//g' ./build/static/js/*.js || exit_if_error $?

# Then build server side and documentation for submodules
printf "SankeyApp Server --------------------------------------------------\n"
cd $SANKEY_DIR
bash scripts/build_server.sh || exit_if_error $?
