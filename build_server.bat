@echo off
setlocal enabledelayedexpansion

rem === Install requirements ===
powershell -Command "pip install -r requirements.txt | Select-String -NotMatch 'Requirement already satisfied'"

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