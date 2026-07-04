@echo off
REM ========================================
REM Script Windows pour générer des résultats avec test_dict_results.py
REM Usage : generate_results.bat [args...]
REM Exemple : generate_results.bat --limit 50
REM ========================================

chcp 65001 >nul

echo Generate Tests reference in LoginComponent

REM === Lancer le script Python avec les arguments transmis au .bat ===
REM python opensankey\tests\test_dict_results.py --generate_results %*

REM pause  (décommenter si besoin)
