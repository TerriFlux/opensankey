@echo off
chcp 65001 > nul
:: ============================================================================
:: Script Batch : Initialisation complète du projet SankeyApp
:: ============================================================================
:: Ce script interactif permet de configurer un environnement de développement 
:: complet pour SankeyApp, en réalisant les opérations suivantes :
::
:: 1. Création ou activation d'un environnement Conda :
::    - Supprime l'environnement s'il existe déjà (si "create" choisi).
::    - Le recrée avec une version fixe de Python (3.8.18).
::    - Ou propose de sélectionner un environnement existant.
::
:: 2. Nettoyage du dépôt Git :
::    - Supprime les fichiers non suivis, les modules node_modules, les caches.
::    - Basé sur le script `git_clean.bat`.
::
:: 3. Installation des dépendances :
::    - Si choisi, installe les dépendances avec NPM pour le code JavaScript client et PIP pour le code python sur serveur.
::
:: 4. Compilation du client (React) et du serveur (Python) :
::    - Appelle les scripts `build_client.bat` et `build_server.bat` selon options.
::    - Peut reconstruire de zéro, ou simplement recompiler.
::
:: Variables utilisateur demandées :
::   - %create_env%    : créer un environnement Conda (y/n)
::   - %conda_env%     : nom de l’environnement à créer ou utiliser
::   - %clean_repo%    : nettoyer le dépôt Git (y/n)
::   - %install%       : installer les dépendances (y/n)
::   - %build_client%  : construire le client React (y/n)
::   - %build_server%  : construire le serveur Python (y/n)
::
:: Pré-requis :
::   - Conda installé et accessible dans le PATH
::   - Git installé (pour git_clean.bat)
::   - Node.js + npm installés (si compilation client)
::
:: Auteur : Julien Alapetite / TerriFlux
:: Date   : mai 2025
:: ============================================================================

setlocal enabledelayedexpansion


REM === Garder le dossier courant comme racine ===
set "SANKEY_DIR=%~dp0"
set "SANKEY_DIR=%SANKEY_DIR:~0,-1%"
echo Répertoire du projet : %SANKEY_DIR%

REM === Demande de création d'un nouvel environnement conda ===
set /p create_env=Souhaitez-vous créer un nouvel environnement conda ? (y/n) 
if /I "%create_env%"=="y" (
    set /p conda_env=Nom de l'environnement conda à créer : 
) else (
    call conda env list
    set /p conda_env=Quel environnement conda souhaitez-vous utiliser ?
)

REM === Demander si on souhaite installer les dépendances ===
set /p install=Souhaitez-vous installer les dépendances (avec npm et pip) ? (y/n)

REM === Demander si on souhaite repartir d'une version propre ===
set /p clean_repo=Souhaitez-vous repartir d'une version propre ? (y/n)
if /I "%clean_repo%"=="y" (
    call "%SANKEY_DIR%\git_clean.bat"
)

REM === Choix de compilation client ===
set /p build_client=Souhaitez-vous construire le client ? (y/n)
REM === Choix de compilation serveur ===
set /p build_server=Souhaitez-vous construire le serveur ? (y/n)

if /I "%create_env%"=="y" (
    set CONDA_ENVS_PATH=USERPROFILE%\.conda\envs
    set MY_ENV_PATH=%USERPROFILE%\.conda\envs\!conda_env!
    echo !MY_ENV_PATH!
    set python_version=3.9.0
    echo Suppression ^(si existant^) de l'environnement conda : !conda_env!
    call conda deactivate
    call conda remove -y --name !conda_env! --all >nul 2>&1
    echo Création de l'environnement conda : !conda_env! avec Python !python_version!
    call conda create -y --prefix !MY_ENV_PATH! python=!python_version!
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
