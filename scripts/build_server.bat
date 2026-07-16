@echo off
setlocal enabledelayedexpansion

REM === Capture script dir BEFORE shift (sinon %~dp0 devient le dir de %1) ===
set "SCRIPT_DIR=%~dp0"

REM === Initialize flags ===
set "install=false"
set "linter=false"
set "build=false"
set "dist=false"
set "deps=false"
set "gdeps=false"

REM === Parse arguments ===
:parse_args
if "%~1"=="" goto end_args
if "%~1"=="--install_deps" (set "install=true") else if "%~1"=="-I" (set "install=true") else ^
if "%~1"=="--linter" (set "linter=true") else if "%~1"=="-L" (set "linter=true") else ^
if "%~1"=="--build" (set "build=true") else if "%~1"=="-B" (set "build=true") else ^
if "%~1"=="--dist" (set "dist=true") else if "%~1"=="-D" (set "dist=true") else ^
if "%~1"=="--sub_deps" (set "deps=true") else if "%~1"=="-S" (set "deps=true") else ^
if "%~1"=="--global_deps" (set "gdeps=true") else if "%~1"=="-G" (set "gdeps=true") else ^
goto show_help
shift
goto parse_args

:show_help
echo Options:
echo --install_deps ^| -I : Install node modules dependencies
echo --linter       ^| -L : Run linter
echo --build        ^| -B : Run build
echo --dist         ^| -D : Compile dist
echo --sub_deps     ^| -S : Run sub-scripts of deps
echo --global_deps  ^| -G : Install global deps
exit /b 1

:end_args

REM === Repo root (this script lives in scripts/) ===
pushd "%SCRIPT_DIR%.."
set "REPO_ROOT=%CD%"
popd

rem === Install requirements ===
if "%install%"=="true" (
    echo Install SankeyApp requirements
    pip install -r "%REPO_ROOT%\requirements.txt"
)

rem === Install deps ===
rem Depuis le monorepo (#235), les couches front/Python vivent dans packages\
rem (OpenSankey+ etait un simple passe-plat vers OpenSankey) ; MFAProblem reste
rem un submodule (chemin inchange). SankeyExcelParser n'apparait pas ici : il est
rem installe en premier par packages\opensankey\build_server.bat, qui en depend.
for %%S in (packages\opensankey packages\login-component submodules\MFAProblem) do (
    pushd "%REPO_ROOT%\%%S" || (
        echo ERROR: pushd vers %%S a echoue
        exit /b 1
    )
    if "%install%"=="true" (
        call build_server.bat -I
    ) else (
        call build_server.bat
    )
    popd
)

rem === Check PEP (flake8) ===
pushd "%REPO_ROOT%\server"
flake8
popd