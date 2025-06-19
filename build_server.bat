@echo off
setlocal enabledelayedexpansion

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

REM Étape 1 : Installation des requirements
if "%install%"=="true" (
    echo Install OpenSankey requirements
    powershell -Command "pip install -r requirements.txt | Select-String -NotMatch 'Requirement already satisfied'"
    powershell -Command "pip install -r conda_requirements.txt | Select-String -NotMatch 'Requirement already satisfied'"
)

REM Étape 2 : Installation des dépendances
pushd submodules\SankeyExcelParser
if "%install%"=="true" (
    call build.bat -I
) else (
    call build.bat
)
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

