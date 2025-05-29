@echo off
setlocal enabledelayedexpansion

rem === Install requirements ===
pip install -r requirements.txt
call :exit_if_error %ERRORLEVEL%

rem === Install deps ===
for %%S in (OpenSankey+ LoginComponent MFAProblem) do (
    pushd submodules\%%S
    call build_server.bat
    popd
)

rem === Check PEP (flake8) ===
pushd server
flake8
popd