@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

REM === Demander le message de commit ===
set /p commit_message=Message de commit (utilisé partout) :

for %%S in (submodules\OpenSankey+\submodules\OpenSankey submodules\OpenSankey+ submodules\LoginComponent ) do (
    echo dossier %%S
    pushd %%S
    git submodule foreach "echo 'Adding all files.'; git add ."
    git submodule foreach "echo 'Commit files.'; git commit -m '%commit_message%'"
    git submodule foreach "echo 'Push files.'; git push"
    popd
)

git submodule foreach "echo 'Adding all files.'; git add ."
git submodule foreach "echo 'Commit files.'; git commit -m '%commit_message%'"
git submodule foreach "echo 'Push files.'; git push"

git add .
git commit -m "%commit_message%"
git push
