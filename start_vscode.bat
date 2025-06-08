pushd "%~dp0"
set SankeyDir=%cd%
set MFADATA=%SankeyDir%\..\..\MFADATA
set TESTS_DIR=%SankeyDir%\..\Tests
set USER_PREF_REP=%SankeyDir%\preferences
call conda env list
set /p conda_env=Quel environnement conda?
call conda activate %conda_env%
code .