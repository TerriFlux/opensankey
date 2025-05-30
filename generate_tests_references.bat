@echo off
REM ========================================
REM Script Windows pour générer des résultats avec test_dict_results.py
REM Usage : generate_results.bat [args...]
REM Exemple : generate_results.bat --limit 50
REM ========================================

chcp 65001 >nul

REM === Vérifier si la variable d'environnement TESTS_DIR est définie ===
IF NOT DEFINED TESTS_DIR (
    REM Définir TESTS_DIR au dossier .\Tests relatif à l’emplacement actuel
    SET "TESTS_DIR=%CD%\..\\Tests"
    echo [INFO] TEST_DIR non défini. Défini à %TEST_DIR%
)

REM === Vérifier que le dossier TESTS_DIR existe ===
IF NOT EXIST "%TESTS_DIR%" (
    echo [ERREUR] Le dossier TESTS_DIR n'existe pas : "%TESTS_DIR%"
    exit /b 1
)

REM === Lancer le script Python avec les arguments transmis au .bat ===
python opensankey\tests\test_dict_results.py --generate_results %*

REM pause  (décommenter si besoin)
