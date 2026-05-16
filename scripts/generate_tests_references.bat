@echo off
REM ========================================
REM Script Windows pour générer des résultats avec test_dict_results.py
REM Usage : generate_results.bat [args...]
REM Exemple : generate_results.bat --limit 50
REM ========================================

chcp 65001 >nul

REM === Anchor to repo root (this script lives in scripts/) ===
pushd "%~dp0.."

rem === Install deps ===
for %%S in (OpenSankey+ LoginComponent MFAProblem) do (
    echo %%S generate_tests_references.bat
    pushd submodules\%%S
    call generate_tests_references.bat
    popd
)

popd

REM pause  (décommenter si besoin)
