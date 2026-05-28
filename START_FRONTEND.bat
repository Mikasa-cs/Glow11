@echo off
echo ============================================
echo   GlowIQ Frontend Startup
echo ============================================
echo.

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from nodejs.org
    pause
    exit /b 1
)

cd /d "%~dp0"
echo Installing npm packages...
npm install

echo.
echo Starting React dev server on http://localhost:3000
echo.
npm run dev -- --host localhost
pause
