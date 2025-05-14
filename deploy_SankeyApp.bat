
@REM Lancer dans un terminal windows avec les permissions administrateurs
@setlocal enableextensions
@cd /d "%~dp0"

@REM Install SankeyApplication client
set SankeyDir=%cd%
set EIGEN_INCLUDE=%SankeyDir%\eigen
call conda env list
set /p conda_env=Quel environnement conda?
call conda activate %conda_env%
echo %SankeyDir%
cd %SankeyDir%\client
call pnpm install

@REM Link LoginComponent with other node_modules
cd %SankeyDir%\client\src\deps\
echo %SankeyDir%\client\src\deps\
rmdir LoginComponent
echo "rmdir LoginComponent"
mklink /d LoginComponent %SankeyDir%\submodules\LoginComponent\client\src
echo "mklink"

@REM Link OpenSankey+ with LoginComponent
cd %SankeyDir%\client\src\deps\LoginComponent\deps\
echo %SankeyDir%\client\src\deps\LoginComponent\deps\
rmdir OpenSankey+
echo "rmdir OpenSankey+ in LoginComponent"
mklink /d OpenSankey+ %SankeyDir%\submodules\OpenSankey+\client\src
echo "mklink OpenSankey+ in LoginComponent"

@REM Link OpenSankey+ with other node_modules
cd %SankeyDir%\client\src\deps\
echo %SankeyDir%\client\src\deps\
rmdir OpenSankey+
echo "rmdir OpenSankey+"
mklink /d OpenSankey+ %SankeyDir%\submodules\OpenSankey+\client\src
echo "mklink"

@REM Link OpenSankeyModule with other node_modules
cd %SankeyDir%\client\src\deps\OpenSankey+\deps\
echo %SankeyDir%\client\src\deps\OpenSankey+\deps\
rmdir OpenSankey
echo "rmdir OpenSankey"
mklink /d OpenSankey %SankeyDir%\submodules\OpenSankey+\submodules\OpenSankey\opensankey\client\src
echo "mklink"

call pnpm run build
pause