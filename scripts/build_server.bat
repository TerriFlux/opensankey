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

REM === Repo root (this script lives in scripts/) ===
for %%I in ("%~dp0..") do set "REPO_ROOT=%%~fI"

rem === Install requirements ===
if "%install%"=="true" (
    echo Install SankeyApp requirements
    pip install -r "%REPO_ROOT%\requirements.txt"
)

rem === Install deps ===
for %%S in (OpenSankey+ LoginComponent MFAProblem) do (
    pushd "%REPO_ROOT%\submodules\%%S" || (
        echo ERROR: pushd vers submodules\%%S a echoue
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