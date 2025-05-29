@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

REM === Demander le message de commit ===
set /p commit_message=Message de commit (utilisé partout) :

REM === Fonction de commit/push conditionnel
:commit_push_if_needed
git status --porcelain | findstr /R "." > nul
if not errorlevel 1 (
    git add .
    git commit -m "%commit_message%" > nul 2>&1
    if not errorlevel 1 (
        echo   >> Commit OK
        echo   >> Push...
        git push
    ) else (
        echo   >> Rien à committer
    )
)
goto :eof

REM === 1. Tous les sous-modules de 1er niveau
git submodule foreach --recursive "echo === Dans \$toplevel/\$path === && call git status --porcelain | findstr /R '.' > nul && if not errorlevel 1 (git add . && git commit -m \"%commit_message%\" && git push)"

REM === 2. Les sous-dossiers OpenSankey+, etc.
for %%S in (OpenSankey+ LoginComponent MFAProblem) do (
    pushd submodules\%%S
    git submodule foreach --recursive "echo === Dans \$toplevel/\$path === && call git status --porcelain | findstr /R '.' > nul && if not errorlevel 1 (git add . && git commit -m \"%commit_message%\" && git push)"
    popd
)

REM === 3. Dépôt principal
call :commit_push_if_needed

echo.
echo ✅ Commit & push terminés pour tous les dépôts.
pause
