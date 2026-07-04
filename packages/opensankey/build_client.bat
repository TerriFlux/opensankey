@echo off
setlocal enabledelayedexpansion

REM Initialisation des flags
set "install=false"
set "linter=false"
set "build=false"
set "dist=false"
set "deps=false"
set "gdeps=false"

REM Analyse des arguments
:parse_args
if "%~1"=="" goto end_args

if "%~1"=="--install_deps" (
    set "install=true"
) else if "%~1"=="-I" (
    set "install=true"
) else if "%~1"=="--linter" (
    set "linter=true"
) else if "%~1"=="-L" (
    set "linter=true"
) else if "%~1"=="--build" (
    set "build=true"
) else if "%~1"=="-B" (
    set "build=true"
) else if "%~1"=="--dist" (
    set "dist=true"
) else if "%~1"=="-D" (
    set "dist=true"
) else if "%~1"=="--sub_deps" (
    set "deps=true"
) else if "%~1"=="-S" (
    set "deps=true"
) else if "%~1"=="--global_deps" (
    set "gdeps=true"
) else if "%~1"=="-G" (
    set "gdeps=true"
) else if "%~1"=="--help" (
    goto show_help
) else if "%~1"=="-H" (
    goto show_help
) else (
    echo Unknown option: %~1
    goto show_help
)

shift
goto parse_args

:show_help
echo Options:
echo --install_deps ^| -I   : Install node modules dependencies
echo --linter       ^| -L   : Run linter
echo --build        ^| -B   : Run build
echo --dist         ^| -D   : Compile dist
echo --global_deps  ^| -G   : Install global deps
exit /b 1

:end_args

REM Étape : Install global deps
if "%gdeps%"=="true" (
    echo.
    echo Global dependencies ------------------------------------------------
    for /f %%G in ('npm root -g') do set "GLOBAL_NPM_PATH=%%G"
    echo ^>^>^> Installation dans !GLOBAL_NPM_PATH!
    call npm install -g pnpm
    echo OK -----------------------------------------------------------------
)

REM Étape : build client
echo.
echo Build --------------------------------------------------------------
pushd opensankey\client

if "%install%"=="true" (
    echo ^>^>^> Install deps
    call pnpm install
    if errorlevel 1 exit /b 1
    echo.
)

if "%linter%"=="true" (
    echo ^>^>^> Run linter
    call pnpm run lint
    if errorlevel 1 exit /b 1
)

if "%build%"=="true" (
    echo ^>^>^> Build standalone
    set CI=
    call pnpm run build
    if errorlevel 1 exit /b 1
)

if "%dist%"=="true" (
    echo ^>^>^> Build distribution lib
    call pnpm run dist
    if errorlevel 1 exit /b 1
)

popd
echo OK -----------------------------------------------------------------