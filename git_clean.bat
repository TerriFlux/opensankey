@echo off
setlocal enabledelayedexpansion

REM Se mettre dans le dossier courant
pushd "%~dp0"

REM Fichier à exclure
set EXCLUDE_FILE=server\db.sqlite
set EXCLUDE_FILE2=.vscode\launch.json
set EXCLUDE_FILE3=.vscode\settings.json

echo Nettoyage du repo principal
git reset --hard
git clean -dxf -e %EXCLUDE_FILE%

echo Nettoyage récursif des sous-modules
git submodule foreach --recursive "git reset --hard && git clean -dxf"
