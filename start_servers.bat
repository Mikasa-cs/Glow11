@echo off
REM Start both backend and frontend servers

echo.
echo ════════════════════════════════════════════════════════
echo  Starting GlowIQ Application
echo ════════════════════════════════════════════════════════
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python first.
    pause
    exit /b 1
)
echo ✅ Python is installed

REM Check Node/npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install Node.js first.
    pause
    exit /b 1
)
echo ✅ npm is installed

echo.
echo Starting backend server on port 8000...
start "GlowIQ Backend" cmd /k "cd /d %cd% && python server.py"

echo Starting frontend on port 5173...
timeout /t 3 /nobreak
start "GlowIQ Frontend" cmd /k "cd /d %cd% && npm run dev"

echo.
echo ════════════════════════════════════════════════════════
echo  Servers are starting!
echo ════════════════════════════════════════════════════════
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press Enter to run tests in 5 seconds...
timeout /t 5 /nobreak

echo.
echo Running backend tests...
call test_backend.bat

pause
