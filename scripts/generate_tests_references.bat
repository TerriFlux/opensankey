@echo off
REM ========================================
REM Wrapper Windows -> scripts/regenerate_testdata_refs.sh
REM
REM L'ancien generate_tests_references.bat ne lancait pas la regen SEP
REM (test_run_check_input.py / test_run_load_input.py), ce qui causait des
REM desyncs CI silencieuses sur les refs SankeyExcelParser. Le script moderne
REM regenerate_testdata_refs.sh couvre SEP + MFA + OS en une commande, avec
REM TESTS_DIR pointe sur <SA>/TestData.
REM ========================================

chcp 65001 >nul

REM bash est disponible via Git for Windows
bash "%~dp0regenerate_testdata_refs.sh" %*
