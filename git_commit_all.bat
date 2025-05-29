@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

REM === Demander le message de commit ===
set /p commit_message=Message de commit (utilisé partout) :

REM === Fonction pour commit + push si modifs dans un dépôt ===
:commit_and_push
cd /d "%~1"

REM Vérifie s’il y a des modifs ou fichiers non suivis
git status --porcelain | findstr /R "." > nul
if not errorlevel 1 (
    echo [Dans %cd%]

    git add -A
    git commit -m "%commit_message%" > nul 2>&1
    if errorlevel 1 (
        echo   >> Aucun commit (déjà commité ?)
    ) else (
        echo   >> Commit OK
        echo   >> Push...
        git push
    )
)
goto :eof

REM === Parcours récursif des sous-modules ===
git submodule foreach --recursive "call \"%~f0\" \"%%~fpath\""

REM === Puis dépôt principal ===
call :commit_and_push "%cd%"

echo.
echo ✅ Commit & push terminés pour tous les dépôts.
pause
