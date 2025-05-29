@echo off
setlocal enabledelayedexpansion

REM Étape 1 : Installation des requirements
echo Install OpenSankey requirements
powershell -Command "pip install -r requirements.txt | Select-String -NotMatch 'Requirement already satisfied'"
powershell -Command "pip install -r conda_requirements.txt | Select-String -NotMatch 'Requirement already satisfied'"

REM Étape 2 : Installation des dépendances
pushd submodules\SankeyExcelParser
call build.bat
popd

REM Étape 3 : Vérification flake8
echo OpenSankey flake8
pushd opensankey\server
flake8
popd

REM Étape 4 : Installation du package principal
echo OpenSankey install
pip install .
echo OpenSankey done

