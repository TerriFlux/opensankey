@echo off
setlocal enabledelayedexpansion

REM === Garder le dossier courant comme racine ===
set "SANKEY_DIR=%~dp0"
set "SANKEY_DIR=%SANKEY_DIR:~0,-1%"
echo %SANKEY_DIR%

REM === Build SankeyApp client ===
echo SankeyApp Client --------------------------------------------------
cd /d "%SANKEY_DIR%"
call build_client.bat -I -B

REM === Modifier les chemins statiques dans le client compilé ===
echo Change static paths in built SankeyApp client ---------------------
cd /d "%SANKEY_DIR%\client"

REM Utilisation de PowerShell pour faire les remplacements car sed n'est pas dispo en natif sur Windows
powershell -Command "(Get-Content ./build/index.html) -replace '/static/', '/static/sankeyapp/' | Set-Content ./build/index.html"

powershell -Command "Get-ChildItem ./build/static/css/*.css | ForEach-Object { (Get-Content $_) -replace '..\/static\/', '../../static/sankeyapp/' | Set-Content $_ }"

powershell -Command "Get-ChildItem ./build/static/*/* | ForEach-Object { (Get-Content $_) -replace 'static/sankeyanimation', '/static/sankeyapp/' | Set-Content $_ }"

powershell -Command "Get-ChildItem ./build/static/*/* | ForEach-Object { (Get-Content $_) -replace 'static/opensankey', '/static/sankeyapp/' | Set-Content $_ }"

REM === Build SankeyApp server ===
echo SankeyApp Server --------------------------------------------------
cd /d "%SANKEY_DIR%"
call build_server.bat

pause
