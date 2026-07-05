import os as _os
# Redirect submodule discovery to the actual server/ directory.
# Needed because pip modern editable installs don't honour
# package_dir={"logincomponent": "."} from setup.py on Windows.
__path__ = [_os.path.normpath(_os.path.join(_os.path.dirname(__file__), '..', '..', 'server'))]
del _os
