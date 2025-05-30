@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

REM === Garder le dossier courant comme racine ===
set "SANKEY_DIR=%~dp0"
set "SANKEY_DIR=%SANKEY_DIR:~0,-1%"
echo Répertoire du projet : %SANKEY_DIR%

REM === Demande de création d'un nouvel environnement conda ===
set /p create_env=Souhaitez-vous créer un nouvel environnement conda ? (y/n) 
if /I "%create_env%"=="y" (
    set /p conda_env=Nom de l'environnement conda à créer : 
)

REM === Demander si on souhaite installer les dépendances ===
set /p install=Souhaitez-vous installer les dépendances (npm et pip) ? (y/n)

REM === Demander si on souhaite repartir d'une version propre ===
set /p clean_repo=Souhaitez-vous repartir d'une version propre ? (y/n)
if /I "%clean_repo%"=="y" (
    call "%SANKEY_DIR%\git_clean.bat"
)

REM === Choix de compilation client ===
set /p build_client=Souhaitez-vous construire le client ? (y/n)

if /I "%create_env%"=="y" (
    set python_version=3.8.18
    echo Suppression ^(si existant^) de l'environnement conda : !conda_env!
    call conda deactivate
    call conda remove -y --name !conda_env! --all >nul 2>&1
    echo Création de l'environnement conda : !conda_env! avec Python !python_version!
    call conda create -y --name !conda_env! python=!python_version!
) else (
    call conda env list
    set /p conda_env=Quel environnement conda souhaitez-vous utiliser ?
)

REM === Activation de l'environnement conda ===
call conda activate %conda_env%


if /I "%build_client%"=="y" (
    echo SankeyApp Client --------------------------------------------------
    cd /d "%SANKEY_DIR%"
    if /I "%install%"=="y" (
        call build_client.bat -I -B
    ) else (
        call build_client -B
    )
)

REM === Choix de compilation serveur ===
set /p build_server=Souhaitez-vous construire le serveur ? (y/n)
if /I "%build_server%"=="y" (
    echo SankeyApp Server --------------------------------------------------
    cd /d "%SANKEY_DIR%"
    if /I "%install%"=="y" (
        call build_server.bat -I
    ) else (
        call build_server.bat
    )
)

echo.
echo Script terminé.
pause
