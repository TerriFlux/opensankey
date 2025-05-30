@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo === Suppression du tag 'prod' local ===
git tag -d prod

echo === Suppression du tag 'prod' distant ===
git push origin :refs/tags/prod

echo === Création du tag 'prod' ===
git tag prod

REM === Récupérer la date au format YY.MM.DD ===
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yy.MM.dd"') do set DATE_TAG=%%i

echo === Création du tag v!DATE_TAG! ===
git tag v!DATE_TAG!

echo === Poussée des tags vers origin ===
git push origin --tags

echo === Terminé ===
