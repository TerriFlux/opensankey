#!/usr/bin/env pwsh
# Builde tous les exemples React (viewer + editor) de chaque version.
# Ne touche pas aux html-viewer (rien a builder, juste du HTML statique).
# Le build de chaque exemple atterrit dans examples/<v>/<kind>/build/
# et est consommable via examples/index.html ou examples/serve.bat.
#
# Usage :
#   ./build-all.ps1                # build tout (skip si node_modules existe deja)
#   ./build-all.ps1 -Force         # force npm install partout (apres update repo)
#   ./build-all.ps1 -Only 1.1.4    # build seulement les exemples d'une version

param(
    [switch]$Force,
    [string]$Only = ""
)

$ErrorActionPreference = 'Stop'

# Detection dynamique : tous les sous-dossiers examples/<version>/{viewer,editor}
# trouves (current + chaque snapshot semver figé).
$examples = @()
foreach ($vdir in Get-ChildItem -Path $PSScriptRoot -Directory) {
    foreach ($kind in @("viewer", "editor")) {
        if (Test-Path (Join-Path $vdir.FullName "$kind\package.json")) {
            $examples += "$($vdir.Name)/$kind"
        }
    }
}

if ($Only) { $examples = $examples | Where-Object { $_ -like "$Only/*" } }

if ($examples.Count -eq 0) {
    Write-Host "[ERR] Aucun example trouve (-Only $Only)" -ForegroundColor Red
    exit 1
}
Write-Host "[INFO] Examples a builder: $($examples -join ', ')" -ForegroundColor Cyan

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERR] npm introuvable dans le PATH." -ForegroundColor Red
    exit 1
}

$root = $PSScriptRoot

# Si on builde un current/*, client/ doit avoir son propre node_modules pour
# que le file:link resolve les transitives (Chakra, d3, fortawesome, etc.).
# On le fait une fois en amont, et on s'assure aussi que `dist/` est present
# (les imports cibles `@terriflux/sankeyapplication/dist/...`).
$buildsCurrent = $examples | Where-Object { $_ -like "current/*" }
if ($buildsCurrent.Count -gt 0) {
    $saClient = Resolve-Path (Join-Path $root "..\client")
    Write-Host ""
    Write-Host "[PREP] $saClient/node_modules pour current/*..." -ForegroundColor Cyan
    if ($Force -or -not (Test-Path (Join-Path $saClient "node_modules"))) {
        Push-Location $saClient
        try {
            $prevPref = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            cmd /c "npm install --no-audit --no-fund --prefer-offline --legacy-peer-deps 2>&1"
            if ($LASTEXITCODE -ne 0) {
                Write-Host "[ERR] install client a echoue" -ForegroundColor Red
                exit 1
            }
            $ErrorActionPreference = $prevPref
        }
        finally { Pop-Location }
    }
    else {
        Write-Host "[SKIP] node_modules deja present" -ForegroundColor DarkGray
    }

    Push-Location $saClient
    try {
        Write-Host "[PREP] npm run dist (compile dist/)..." -ForegroundColor Cyan
        cmd /c "npm run dist 2>&1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERR] npm run dist a echoue" -ForegroundColor Red
            exit 1
        }
    }
    finally { Pop-Location }
}
$built = @()
$failed = @()
$skipped = @()

foreach ($ex in $examples) {
    $srcDir = Join-Path $root ($ex.Replace('/', '\'))

    Write-Host ""
    Write-Host "----------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "[BUILD] $ex" -ForegroundColor Cyan

    if (-not (Test-Path $srcDir)) {
        Write-Host "[SKIP] source introuvable: $srcDir" -ForegroundColor Yellow
        $skipped += $ex
        continue
    }

    Push-Location $srcDir
    try {
        $prevPref = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'

        $needInstall = $Force -or (-not (Test-Path "node_modules"))
        if ($needInstall) {
            Write-Host "[STEP] npm install (--legacy-peer-deps)..." -ForegroundColor DarkGray
            cmd /c "npm install --no-audit --no-fund --prefer-offline --legacy-peer-deps 2>&1"
            if ($LASTEXITCODE -ne 0) { throw "npm install a echoue (exit $LASTEXITCODE)" }
        }
        else {
            Write-Host "[SKIP] node_modules present (utilise -Force pour reinstaller)" -ForegroundColor DarkGray
        }

        $env:PUBLIC_URL = "."
        $env:CI = "false"
        Write-Host "[STEP] npm run build (PUBLIC_URL=., CI=false)..." -ForegroundColor DarkGray
        cmd /c "npm run build 2>&1"
        if ($LASTEXITCODE -ne 0) { throw "npm run build a echoue (exit $LASTEXITCODE)" }

        if (-not (Test-Path "build")) { throw "le dossier build/ n'a pas ete cree" }

        Write-Host "[OK]   build/ OK" -ForegroundColor Green
        $built += $ex
        $ErrorActionPreference = $prevPref
    }
    catch {
        Write-Host "[ERR]  $_" -ForegroundColor Red
        $failed += $ex
    }
    finally {
        Pop-Location
        Remove-Item Env:PUBLIC_URL -ErrorAction SilentlyContinue
        Remove-Item Env:CI -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor DarkGray
Write-Host "Recapitulatif:" -ForegroundColor Cyan
Write-Host ("  Buildes  ({0}): {1}" -f $built.Count,   ($built   -join ', ')) -ForegroundColor Green
if ($skipped.Count) { Write-Host ("  Skippes  ({0}): {1}" -f $skipped.Count, ($skipped -join ', ')) -ForegroundColor Yellow }
if ($failed.Count)  { Write-Host ("  Echoues  ({0}): {1}" -f $failed.Count,  ($failed  -join ', ')) -ForegroundColor Red }

Write-Host ""
Write-Host "Pour tester : double-clic sur examples\serve.bat puis ouvrir http://localhost:8000/" -ForegroundColor Cyan

if ($failed.Count -gt 0) { exit 1 }
