#!/usr/bin/env pwsh
# Sert la racine examples/ en HTTP local.
# Permet de lancer index.html et tous les exemples (y compris html-viewer
# qui a besoin de HTTP pour fetch example.json).
# Usage : ./serve.ps1 [<port>]   (def: 8000)

param([int]$Port = 8000)

$ErrorActionPreference = 'Stop'

function Find-Python {
    if (Get-Command py -ErrorAction SilentlyContinue) { return (Get-Command py).Source }
    foreach ($name in 'python', 'python3') {
        $cmds = Get-Command $name -All -ErrorAction SilentlyContinue
        foreach ($c in $cmds) {
            if ($c.Source -and ($c.Source -notlike '*\WindowsApps\*')) { return $c.Source }
        }
    }
    foreach ($p in @(
        "D:\miniconda3\python.exe",
        "C:\miniconda3\python.exe",
        "$env:USERPROFILE\miniconda3\python.exe"
    )) { if (Test-Path $p) { return $p } }
    return $null
}

$python = Find-Python
if (-not $python) {
    Write-Host "Aucun interpreteur Python utilisable trouve." -ForegroundColor Red
    Write-Host "Installer Python ou ajouter D:\miniconda3 (par ex.) au PATH." -ForegroundColor Yellow
    exit 1
}

$url = "http://localhost:$Port/"
Write-Host "Servir $PSScriptRoot sur $url (via $python)" -ForegroundColor Green
Start-Process $url
Push-Location $PSScriptRoot
try { & $python -m http.server $Port } finally { Pop-Location }
