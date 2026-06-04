@echo off
REM ========================================
REM Wrapper Windows -> scripts/regenerate_testdata_refs.sh
REM
REM L'ancien generate_tests_references.bat ne lancait pas la regen SEP
REM (test_run_check_input.py / test_run_load_input.py), ce qui causait des
REM desyncs CI silencieuses sur les refs SankeyExcelParser. Le script moderne
REM regenerate_testdata_refs.sh couvre SEP + MFA + OS en une commande, avec
REM TESTS_DIR pointe sur <SA>/SankeyData/tests.
REM ========================================

chcp 65001 >nul

REM On force Git Bash (pas WSL). WSL ne voit pas l'env conda Windows et fait
REM echouer l'import SankeyExcelParser/mfa_problem.
set "GITBASH="
if exist "%ProgramFiles%\Git\usr\bin\bash.exe"        set "GITBASH=%ProgramFiles%\Git\usr\bin\bash.exe"
if not defined GITBASH if exist "%ProgramFiles%\Git\bin\bash.exe"          set "GITBASH=%ProgramFiles%\Git\bin\bash.exe"
if not defined GITBASH if exist "%ProgramFiles(x86)%\Git\usr\bin\bash.exe" set "GITBASH=%ProgramFiles(x86)%\Git\usr\bin\bash.exe"
if not defined GITBASH if exist "%ProgramFiles(x86)%\Git\bin\bash.exe"     set "GITBASH=%ProgramFiles(x86)%\Git\bin\bash.exe"

if not defined GITBASH (
  echo ERR: Git Bash introuvable. Installe Git for Windows ou ajuste le wrapper.>&2
  exit /b 1
)

REM On se place dans scripts/ pour eviter les soucis de backslashes Windows
REM passes en argument a bash.
pushd "%~dp0"
"%GITBASH%" ./regenerate_testdata_refs.sh %*
set "RC=%ERRORLEVEL%"
popd
exit /b %RC%
