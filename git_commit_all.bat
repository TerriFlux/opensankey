@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

REM === Demander le message de commit ===
set /p commit_message=Message de commit (utilisé partout) :

for %%S in (submodules\OpenSankey+\submodules\OpenSankey submodules\OpenSankey+ submodules\LoginComponent ) do (
    echo dossier %%S
    pushd %%S
    git submodule foreach "echo 'Adding all files.'; git add ."
    echo titi
    git submodule foreach "echo 'Adding all files.'; git commit -m '%commit_message%'"
    echo titi2
    git submodule foreach "echo 'Adding all files.'; git push"
    popd
)

echo here
git submodule foreach "echo 'Adding all files.'; git add ."
echo here2
git submodule foreach "echo 'Adding all files.'; git commit -m '%commit_message%'"
echo here3
git submodule foreach "echo 'Adding all files.'; git push"

echo tutu
git add .
echo tutu2
git commit -m "%commit_message%"
echo tutu3
git push
