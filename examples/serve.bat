@echo off
REM Double-clic : sert la racine examples/ en HTTP local sur :8000
REM puis ouvre index.html dans le navigateur.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
pause
