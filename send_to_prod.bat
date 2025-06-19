@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo === Suppression du tag 'prod' local (si existant) ===
git tag -l prod >nul 2>&1
if not errorlevel 1 (
    git tag -d prod >nul 2>&1
)

echo === Suppression du tag 'prod' distant (si existant) ===
git ls-remote --tags origin | findstr /r /c:"refs/tags/prod" >nul
if not errorlevel 1 (
    git push origin :refs/tags/prod >nul 2>&1
)

echo === Création du tag 'prod' ===
git tag prod

REM === Récupérer la date au format YY.MM.DD ===
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yy.MM.dd"') do set DATE_TAG=%%i

echo === Création du tag v!DATE_TAG! ===
git tag v!DATE_TAG!

echo === Poussée des tags vers origin ===
git push origin --tags

echo === Tags créés et poussés : prod, v!DATE_TAG!