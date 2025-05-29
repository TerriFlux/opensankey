@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

REM === Demander le message de commit ===
set /p commit_message=Message de commit (utilisé partout) :

REM === Fonction pour commit + push si modifs dans un dépôt donné ===
:commit_and_push
set "target_dir=%~1"
pushd "%target_dir%" > nul 2>&1
if errorlevel 1 (
    echo ⚠️ Dossier introuvable : %target_dir%
    goto :eof
)

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
popd > nul
goto :eof

REM === Calcul du chemin absolu du projet racine ===
set "ROOT_DIR=%cd%"

REM === Commit & push de tous les sous-modules ===
for /f "tokens=2 delims= " %%S in ('git config --file .gitmodules --get-regexp path') do (
    set "SUBMODULE_DIR=%ROOT_DIR%\%%S"
    call :commit_and_push "!SUBMODULE_DIR!"
)

REM === Puis commit & push du dépôt principal ===
call :commit_and_push "%ROOT_DIR%"

echo.
echo ✅ Commit & push terminés pour tous les dépôts.
pause
