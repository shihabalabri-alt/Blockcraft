@echo off
cd /d "%~dp0"
echo Starting Blockcraft server...
start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:3000/"
node server.js
echo.
echo Server stopped. Press any key to close.
pause >nul
