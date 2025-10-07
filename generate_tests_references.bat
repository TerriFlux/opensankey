@echo off
REM ========================================
REM Script Windows pour générer des résultats avec test_dict_results.py
REM Usage : generate_results.bat [args...]
REM Exemple : generate_results.bat --limit 50
REM ========================================

chcp 65001 >nul



rem === Install deps ===
@REM for %%S in (SankeyExcelParser) do (
@REM     echo %%S generate_tests_references.bat
@REM     pushd submodules\%%S
@REM     call generate_tests_references.bat
@REM     popd
@REM )

echo Generate Tests references in OpenSankey
REM === Lancer le script Python avec les arguments transmis au .bat ===
python opensankey\tests\test_dict_results.py --generate_results %*

REM pause  (décommenter si besoin)
