@echo off
setlocal enabledelayedexpansion

echo Nettoyage du repo principal
git reset --hard
git clean -dxf

echo Nettoyage récursif des sous-modules
git submodule foreach --recursive "git reset --hard && git clean -dxf"
