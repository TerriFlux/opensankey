@echo off
setlocal enabledelayedexpansion

REM Se mettre dans le dossier courant
pushd "%~dp0"

REM Fichier à exclure
set EXCLUDE_FILE=server\db.sqlite
set EXCLUDE_FILE2=.vscode\launch.json
set EXCLUDE_FILE3=.vscode\settings.json
set EXCLUDE_FILE4=deploy_SankeyApp.bat
set EXCLUDE_FILE5=git_clean.bat

echo Nettoyage du repo principal
git reset --hard
git clean -dxf -e %EXCLUDE_FILE% -e %EXCLUDE_FILE2% -e %EXCLUDE_FILE3% -e %EXCLUDE_FILE4% -e %EXCLUDE_FILE5%

echo Nettoyage récursif des sous-modules
git submodule foreach --recursive "git reset --hard && git clean -dxf"