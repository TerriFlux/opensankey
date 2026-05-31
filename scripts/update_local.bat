@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
:: ============================================================================
:: update_local.bat — Mise a jour locale (Windows)
:: ============================================================================
:: Equivalent local de update_opensankey.sh, sans l'archive ni le restart
:: serveur. Enchaine :
::   1. git pull
::   2. submodules sur <branche> + git pull (dev iteratif, pas de HEAD detachee)
::   3. build client (scripts\build_client.bat -B)
::   4. build serveur (scripts\build_server.bat)
::
:: Usage : update_local.bat [branche]
::   [branche] : branche cible des submodules (defaut: main).
::               Repli automatique sur main si absente dans un submodule.
::   ex : update_local.bat test
:: Pre-requis : un environnement conda deja active avec les deps installees
:: (ce script ne fait que recompiler, pas d'install ; lancer build_*.bat -I
::  manuellement si les deps ont change).
:: ============================================================================

REM === Repo root (this script lives in scripts/) ===
for %%I in ("%~dp0..") do set "SANKEY_DIR=%%~fI"
cd /d "%SANKEY_DIR%"
echo === Mise a jour locale : %SANKEY_DIR% ===

REM === Branche cible des submodules (defaut: main) ===
set "SM_BRANCH=%~1"
if "%SM_BRANCH%"=="" set "SM_BRANCH=main"
echo === Branche submodules : %SM_BRANCH% ===

REM === Pull & update submodules ===
echo ^>^>^> git pull
git pull
if errorlevel 1 ( echo ERREUR : git pull a echoue & exit /b 1 )

echo ^>^>^> git submodule update --init --recursive
git submodule update --init --recursive
if errorlevel 1 ( echo ERREUR : git submodule update a echoue & exit /b 1 )

echo ^>^>^> submodules : checkout %SM_BRANCH% (repli main) + git pull (sauf eigen)
git submodule foreach --recursive "case $sm_path in */eigen) echo skip eigen ;; *) { git checkout %SM_BRANCH% || git checkout main; } && git pull --ff-only ;; esac"
if errorlevel 1 ( echo ERREUR : checkout / pull submodules a echoue & exit /b 1 )

REM === eigen : re-pin (HEAD detachee) sur le SHA epingle par MFAProblem ===
REM --force est requis : sans lui, submodule update est un no-op quand le
REM commit correspond deja, et eigen reste sur sa branche locale 'main'.
echo ^>^>^> eigen : version epinglee par MFAProblem (HEAD detachee)
git -C submodules\MFAProblem submodule update --init --force submodules/eigen
if errorlevel 1 ( echo ERREUR : update eigen a echoue & exit /b 1 )

REM === Build client ===
echo SankeyApp Client --------------------------------------------------
call scripts\build_client.bat -B
if errorlevel 1 ( echo ERREUR : build client a echoue & exit /b 1 )

REM === Build serveur ===
echo SankeyApp Server --------------------------------------------------
call scripts\build_server.bat
if errorlevel 1 ( echo ERREUR : build serveur a echoue & exit /b 1 )

echo === Mise a jour locale terminee ===
pause
