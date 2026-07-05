@echo off
REM ========================================
REM Script Windows pour générer des résultats avec test_dict_results.py
REM Usage : generate_results.bat [args...]
REM Exemple : generate_results.bat --limit 50
REM ========================================

chcp 65001 >nul

rem === Install deps ===
for %%S in (OpenSankey) do (
    echo %%S generate_tests_references.bat
    pushd submodules\%%S
    call generate_tests_references.bat
    popd
)

REM pause  (décommenter si besoin)
