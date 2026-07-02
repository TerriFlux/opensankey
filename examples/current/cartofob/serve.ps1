#!/usr/bin/env pwsh
# Sert le dossier `build/` (sortie de `pnpm run build`) en HTTP local.
# Indispensable pour que les fetch() runtime (diagrams_list, diagram=...,
# .json.gz) fonctionnent — file:// est bloque par les navigateurs (CORS).
# Usage : ./serve.ps1 [<port>]   (def: 8000)

param([int]$Port = 8000)

$ErrorActionPreference = 'Stop'

$buildDir = Join-Path $PSScriptRoot 'build'
if (-not (Test-Path $buildDir)) {
    Write-Host "Dossier 'build/' introuvable. Lance d'abord 'pnpm run build' (ou 'npm run build')." -ForegroundColor Red
    exit 1
}

function Find-Python {
    # 1) py launcher (officiel Windows)
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) { return $py.Source }

    # 2) python/python3 dans le PATH, en rejetant les stubs Microsoft Store
    foreach ($name in 'python', 'python3') {
        $cmds = Get-Command $name -All -ErrorAction SilentlyContinue
        foreach ($c in $cmds) {
            if ($c.Source -and ($c.Source -notlike '*\WindowsApps\*')) { return $c.Source }
        }
    }

    # 3) Emplacements connus
    $candidates = @(
        "D:\miniconda3\python.exe",
        "C:\miniconda3\python.exe",
        "$env:USERPROFILE\miniconda3\python.exe",
        "C:\ProgramData\Anaconda3\python.exe",
        "$env:USERPROFILE\Anaconda3\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
    )
    foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Host "Aucun interpreteur Python utilisable trouve." -ForegroundColor Red
    Write-Host "Solutions : installer python.org (qui ajoute 'py'), ou ajouter ton install (ex: D:\miniconda3) au PATH." -ForegroundColor Yellow
    Write-Host "Alternative npm : 'npx serve build -p $Port'" -ForegroundColor Yellow
    exit 1
}

$url = "http://localhost:$Port/"
Write-Host "Servir $buildDir sur $url" -ForegroundColor Green
Write-Host "Python : $python" -ForegroundColor DarkGray
Start-Process $url
Push-Location $buildDir
try { & $python -m http.server $Port } finally { Pop-Location }
