pushd "%~dp0.."
set SankeyDir=%cd%
set MFADATA=%SankeyDir%\..\..\MFADATA
set SANKEY_DATA=%SankeyDir%\SankeyData
set TESTS_DIR=%SankeyDir%\SankeyData\tests
set USER_PREF_REP=%SankeyDir%\preferences
call conda env list
set /p conda_env=Quel environnement conda?
call conda activate %conda_env%
code .