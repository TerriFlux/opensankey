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

REM === Get script directory ===
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM === Install global dependencies ===
if "%gdeps%"=="true" (
    echo Global dependencies -------------------------------------------------
    where pnpm >nul 2>nul
    if errorlevel 1 (
        for /f %%G in ('npm root -g') do set "GLOBAL_NPM_PATH=%%G"
        echo ^>^>^> Installation dans !GLOBAL_NPM_PATH!
        call npm install -g pnpm
    )
    echo OK ------------------------------------------------------------------
)

REM === Sub-deps build ===
if "%deps%"=="true" (
    echo OpenSankey+ ========================================================
    pushd "!SCRIPT_DIR!\submodules\OpenSankey+"
    call build_client.bat %*
    if errorlevel 1 exit /b 1
    popd
    echo OK OpenSankey+ =======================================================
)

REM === Clean sub deps ===
echo Clean deps ----------------------------------------------------------
call "!SCRIPT_DIR!\submodules\OpenSankey+\build_client.bat" >nul
for %%D in (node_modules dist build) do (
    if exist "!SCRIPT_DIR!\submodules\OpenSankey+\client\%%D" (
        echo removing !SCRIPT_DIR!\submodules\OpenSankey+\client\%%D
        rmdir /s /q "!SCRIPT_DIR!\submodules\OpenSankey+\client\%%D"
    )
)
echo OK ------------------------------------------------------------------

REM === Link dependencies ===
echo Linking dependencies ------------------------------------------------
for %%S in (OpenSankey+ LoginComponent) do (
    pushd "!SCRIPT_DIR!\client\src\deps"
    if exist "%%S" rmdir "%%S"
    mklink /D "%%S" "..\..\..\submodules\%%S\client\src"
    popd
)

for %%S in (OpenSankey+) do (
    pushd "!SCRIPT_DIR!\client\src\deps\LoginComponent\deps"
    if exist "%%S" rmdir "%%S"
    mklink /D "%%S" "..\..\..\..\..\submodules\%%S\client\src"
    popd
)

pushd "!SCRIPT_DIR!\client"
if exist public (
    rmdir /s /q public
    git restore public
)
mklink /D public "..\submodules\OpenSankey+\client\public"
popd
echo OK ------------------------------------------------------------------

REM === Front-end build ===
echo Build ---------------------------------------------------------------
pushd client
if "%install%"=="true" (
    echo ^>^>^> Install deps
    call pnpm install
    if errorlevel 1 exit /b 1
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
echo OK ------------------------------------------------------------------
