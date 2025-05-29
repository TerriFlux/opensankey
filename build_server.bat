@echo off
setlocal enabledelayedexpansion

REM Étape 1 : Installation des requirements
pip install -r requirements.txt

pip install -r conda_requirements.txt

REM Étape 2 : Installation des dépendances
pushd submodules\SankeyExcelParser
call build.bat
popd

REM Étape 3 : Vérification flake8
pushd opensankey\server
flake8
popd

REM Étape 4 : Installation du package principal
pip install .

