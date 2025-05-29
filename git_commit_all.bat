@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

echo.
echo === Commit ^& Push pour tous les sous-modules ===

REM === Demander le message de commit (partagé par tous les sous-modules) ===
set /p commit_message=Message de commit (utilisé partout) : 

REM === Définir les chemins des sous-modules ===
set opensankeyplus=submodules\OpenSankey+
set opensankey=%opensankeyplus%\submodules\OpenSankey
set sankeyexcelparser=%opensankey%\submodules\SankeyExcelParser
set logincomponent=submodules\LoginComponent
set mfaproblem=submodules\MFAProblem

REM === Liste ordonnée à traiter ===
for %%S in (
    %sankeyexcelparser%
    %opensankey%
    %opensankeyplus%
    %logincomponent%
    %mfaproblem%
) do (
    echo.
    echo 📁 Traitement du dossier : %%S

    if exist "%%S" (
        pushd %%S

        REM Vérifie qu’il y a des modifications
        git status --porcelain | findstr . >nul
        if not errorlevel 1 (
            echo 🔄 Modifications détectées → commit + push...

            git add .
            git commit -m "%commit_message%" >nul 2>&1
            if errorlevel 1 (
                echo   ⚠️ Aucun commit créé ^(déjà commité ?^)
            ) else (
                REM Vérifie qu'on est bien sur une branche avant de pousser
                for /f %%B in ('git symbolic-ref --short -q HEAD') do set "branch=%%B"
                if defined branch (
                    echo   🚀 Pushing vers branche !branch!...
                    git push
                ) else (
                    echo   ⚠️ HEAD détaché : push ignoré
                )
            )
        ) else (
            echo ✅ Aucun changement à commiter
        )

        popd
    ) else (
        echo ❌ Dossier introuvable : %%S
    )
)

REM === Traitement du dépôt principal ===
echo.
echo 🧩 Traitement du dépôt principal
git status --porcelain | findstr . >nul
if not errorlevel 1 (
    git add .
    git commit -m "%commit_message%" >nul 2>&1
    if errorlevel 1 (
        echo   ⚠️ Aucun commit dans le dépôt principal
    ) else (
        git push
    )
) else (
    echo ✅ Aucun changement dans le dépôt principal
)

echo.
echo 🟢 Script terminé pour tous les dépôts.
pause
