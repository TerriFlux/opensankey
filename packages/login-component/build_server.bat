@echo off
setlocal enabledelayedexpansion

REM Étape 1 : Installation des requirements
echo === Installation des requirements ===
pip install -r requirements.txt

REM Étape 2 : Vérification PEP8 avec flake8
echo === Vérification flake8 ===
pushd server
flake8
popd

REM Étape 3 : Installation du package courant
echo === Installation du package ===
pip install .
