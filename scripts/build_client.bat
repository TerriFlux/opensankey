@echo off
setlocal enabledelayedexpansion

REM Build front du monorepo pnpm workspace (#235/#236).
REM Plus de junctions src\deps ni de recursion submodules front : les couches
REM se resolvent par dependances workspace:*. L'option -S est acceptee mais
REM sans effet (compat avec les anciens appels).

REM === Capture script dir BEFORE shift (sinon %~dp0 devient le dir de %1) ===
set "BAT_DIR=%~dp0"

REM === Initialize flags ===
set "install=false"
set "linter=false"
set "build=false"
set "dist=false"
set "gdeps=false"

REM === Parse arguments ===
:parse_args
if "%~1"=="" goto end_args
if "%~1"=="--install_deps" (set "install=true") else if "%~1"=="-I" (set "install=true") else ^
if "%~1"=="--linter" (set "linter=true") else if "%~1"=="-L" (set "linter=true") else ^
if "%~1"=="--build" (set "build=true") else if "%~1"=="-B" (set "build=true") else ^
if "%~1"=="--dist" (set "dist=true") else if "%~1"=="-D" (set "dist=true") else ^
if "%~1"=="--sub_deps" (rem no-op) else if "%~1"=="-S" (rem no-op) else ^
if "%~1"=="--global_deps" (set "gdeps=true") else if "%~1"=="-G" (set "gdeps=true") else ^
goto show_help
shift
goto parse_args

:show_help
echo Options:
echo --install_deps ^| -I : Install node modules dependencies ^(workspace racine^)
echo --linter       ^| -L : Run linter ^(tous les paquets^)
echo --build        ^| -B : Build standalone du client SA
echo --dist         ^| -D : Compile dist ^(lib npm^)
echo --global_deps  ^| -G : Installe pnpm ^(corepack^)
exit /b 1

:end_args

REM === Repo root (this script lives in scripts/) ===
pushd "%BAT_DIR%.."
set "SCRIPT_DIR=%CD%"
popd

REM === Install global dependencies ===
if "%gdeps%"=="true" (
    echo Global dependencies -------------------------------------------------
    where corepack >nul 2>nul
    if not errorlevel 1 (
        call corepack enable
        call corepack prepare pnpm@10.4.1 --activate
    ) else (
        where pnpm >nul 2>nul
        if errorlevel 1 call npm install -g pnpm@10.4.1
    )
    echo OK ------------------------------------------------------------------
)

REM === Front-end build (workspace racine) ===
echo Build ---------------------------------------------------------------
pushd "!SCRIPT_DIR!"
if "%install%"=="true" (
    echo ^>^>^> Install deps ^(workspace racine^)
    call pnpm install --config.dangerouslyAllowAllBuilds=true
    if errorlevel 1 exit /b 1
)
if "%linter%"=="true" (
    echo ^>^>^> Run linter ^(workspace^)
    call pnpm run lint:ci
    if errorlevel 1 exit /b 1
)
if "%build%"=="true" (
    echo ^>^>^> Build standalone
    set "DISABLE_ESLINT_PLUGIN=true"
    set "CI="
    set "NODE_OPTIONS=--max-old-space-size=8192"
    call pnpm run build
    if errorlevel 1 exit /b 1
)
if "%dist%"=="true" (
    echo ^>^>^> Build distribution lib
    call pnpm run dist
    if errorlevel 1 exit /b 1
)
popd
echo OK ------------------------------------------------------------------
