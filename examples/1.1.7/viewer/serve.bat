@echo off
REM Double-clic : delegue a serve.ps1 (meme dossier).
REM Sert le dossier build/ sur http://localhost:8000/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" %*
pause
