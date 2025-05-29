@echo off
setlocal enabledelayedexpansion

REM Étape : Installation des dépendances
pushd submodules\OpenSankey
call build_server.bat
popd

