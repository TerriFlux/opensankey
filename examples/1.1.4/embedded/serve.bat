@echo off
REM Double-clic : delegue a serve.ps1 (meme dossier).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
pause
