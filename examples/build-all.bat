@echo off
REM Double-clic : builde tous les exemples React (viewer + editor) de chaque version.
REM Args optionnels forwardes : -Force, -Only 1.1.3, etc.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-all.ps1" %*
pause
