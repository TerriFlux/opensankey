#!/usr/bin/env pwsh
# Builde tous les exemples React (viewer + editor) de chaque version.
# Ne touche pas aux html-viewer (rien a builder, juste du HTML statique).
# Le build de chaque exemple atterrit dans examples/<v>/<kind>/build/
# et est consommable via examples/index.html ou examples/serve.bat.
#
# Usage :
#   ./build-all.ps1                # build tout (skip si node_modules existe deja)
#   ./build-all.ps1 -Force         # force npm install partout (apres update repo)
#   ./build-all.ps1 -Only 1.1.3    # build seulement les exemples d'une version

param(
    [switch]$Force,
    [string]$Only = ""
)

$ErrorActionPreference = 'Stop'

# Liste a maintenir alignee avec les dossiers presents dans examples/
# (current/ exclu : utilise file:../../../opensankey/client en dep, donc
# necessite une preparation differente).
$examples = @(
    "1.0.7/viewer",
    "1.0.7/editor",
    "1.1.1/viewer",
    "1.1.1/editor",
    "1.1.3/viewer",
    "1.1.3/editor"
)

if ($Only) { $examples = $examples | Where-Object { $_ -like "$Only/*" } }

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[ERR] npm introuvable dans le PATH." -ForegroundColor Red
    exit 1
}

$root = $PSScriptRoot
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
