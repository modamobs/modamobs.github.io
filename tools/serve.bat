@echo off
rem ---------------------------------------------------
rem  Local static server for this site.
rem  ASCII only on purpose: Korean text inside a .bat
rem  breaks cmd parsing depending on the code page.
rem  Real logic lives in tools\serve.js (Node, no deps).
rem ---------------------------------------------------

cd /d "%~dp0"

node -e "process.exit(0)" >nul 2>&1
if errorlevel 1 goto nonode

node serve.js 8000
goto end

:nonode
echo.
echo   Node.js was not found in PATH.
echo   Install Node.js, or run this instead:
echo     py -3 -m http.server 8000
echo.

:end
pause
