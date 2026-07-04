@echo off
setlocal enabledelayedexpansion

REM Étape : Installation des dépendances (forward des flags reçus, ex -I)
pushd submodules\OpenSankey
call build_server.bat %*
popd

