#! /bin/bash

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
SANKEY_DIR=`pwd`

cd $SANKEY_DIR/client/src/deps
rm OpenSankey+
ln -s $SANKEY_DIR/submodules/OpenSankey+/client/src OpenSankey+

cd $SANKEY_DIR/client/src/deps/OpenSankey+/deps
rm OpenSankey
ln -s $SANKEY_DIR/submodules/OpenSankey+/submodules/OpenSankey/opensankey/client/src OpenSankey

# Build scripts for SankeyApp client
printf "SankeyApp Client --------------------------------------------------\n"
cd $SANKEY_DIR
bash build_client.sh -I -B || exit_if_error $?

# Need to change static paths in built SankeyApp client
printf "Change static paths in built SankeyApp client ---------------------\n"
cd $SANKEY_DIR/client
sed -i -e 's/\/static\//\/static\/sankeyapp\//g' ./build/index.html || exit_if_error $?
sed -i -e 's/..\/static\//..\/..\/static\/sankeyapp\//g' ./build/static/css/*.css || exit_if_error $?
sed -i -e 's/static\/sankeyanimation/\static\/sankeyapp\//g' ./build/static/*/* || exit_if_error $?
sed -i -e 's/static\/opensankey/\/static\/sankeyapp\//g' ./build/static/*/* || exit_if_error $?

# Then build server side and documentation for submodules
printf "SankeyApp Server --------------------------------------------------\n"
cd $SANKEY_DIR
bash build_server.sh || exit_if_error $?
