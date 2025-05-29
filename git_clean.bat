@echo off
setlocal enabledelayedexpansion

REM Fichier à exclure
set EXCLUDE_FILE=server\db.sqlite

echo Nettoyage du repo principal
git reset --hard
git clean -dxf -e %EXCLUDE_FILE%

echo Nettoyage récursif des sous-modules
git submodule foreach --recursive "git reset --hard && git clean -dxf"
