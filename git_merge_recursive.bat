@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo === Merge du dépôt principal ============================================
git fetch origin
git merge origin/main --no-ff --no-commit
if errorlevel 1 (
    echo ⚠️ Merge échoué dans le dépôt principal.
    goto :end
)

echo.
echo === Merge des sous-modules (récursif) ===================================
git submodule foreach --recursive ^
    "echo --- Dans %%name --- && git fetch origin && git merge origin/main --no-ff --no-commit"

echo.
echo ✅ Merge terminé partout (attention : commits non effectués)
:end
pause
