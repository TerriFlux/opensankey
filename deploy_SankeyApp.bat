@echo off
setlocal enabledelayedexpansion

REM === Garder le dossier courant comme racine ===
set "SANKEY_DIR=%~dp0"
set "SANKEY_DIR=%SANKEY_DIR:~0,-1%"
echo %SANKEY_DIR%

call conda env list
set /p conda_env=Quel environnement conda?
call conda activate %conda_env%

@REM REM === Récupérer la version actuelle de Python
@REM for /f %%P in ('python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"') do set "PYTHON_VERSION=%%P"
@REM echo Version actuelle de Python : %PYTHON_VERSION%

REM === Supprimer l'environnement conda courant
echo Suppression de l'environnement conda : %conda_env%
call conda deactivate
call conda remove -y --name %conda_env% --all

REM === Recréer l'environnement conda avec la même version de Python
echo Création de l'environnement conda : %conda_env% avec python=3.8.18
call conda create -y --name %conda_env% python=3.8.18
call conda activate %conda_env%

call git_clean.bat

REM === Build SankeyApp client ===
echo SankeyApp Client --------------------------------------------------
cd /d "%SANKEY_DIR%"
call build_client.bat -I -B

REM === Build SankeyApp server ===
echo SankeyApp Server --------------------------------------------------
cd /d "%SANKEY_DIR%"
call build_server.bat

pause
