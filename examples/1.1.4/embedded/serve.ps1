#!/usr/bin/env pwsh
# Sert ce dossier en HTTP local (contourne CORS file://).
# Usage : ./serve.ps1 [<port>]   (def: 8000)

param([int]$Port = 8000)

$ErrorActionPreference = 'Stop'

function Find-Python {
    # 1) py launcher (officiel Windows)
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) { return $py.Source }

    # 2) python/python3 dans le PATH, mais on rejette les stubs Microsoft Store
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
    Write-Host "Les python.exe du PATH dans WindowsApps\ sont des stubs Microsoft Store, pas un vrai Python." -ForegroundColor Yellow
    Write-Host "Solutions : installer python.org (qui ajoute 'py'), ou ajouter ton install (ex: D:\miniconda3) au PATH." -ForegroundColor Yellow
    exit 1
}

$url = "http://localhost:$Port/"
Write-Host "Servir $PSScriptRoot sur $url" -ForegroundColor Green
Write-Host "Python : $python" -ForegroundColor DarkGray
Start-Process $url
Push-Location $PSScriptRoot
try { & $python -m http.server $Port } finally { Pop-Location }
