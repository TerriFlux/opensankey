pushd "%~dp0"
set SankeyDir=%cd%
call conda env list
set /p conda_env=Quel environnement conda?
call conda activate %conda_env%
code .
