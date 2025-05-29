@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

REM === Demander le message de commit ===
set /p commit_message=Message de commit (utilisé partout) :

git submodule foreach --recursive "echo 'Adding all files.'; git add ."
git submodule foreach --recursive "echo 'Adding all files.'; git commit -m '%commit_message%'"
git submodule foreach --recursive "echo 'Adding all files.'; git push"

git add .
git commit -m "%commit_message%"
git push
