@echo off
echo ============================================
echo   GlowIQ Backend Startup
echo ============================================
echo.

cd /d "%~dp0"

set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
set "PIP_EXE=%~dp0.venv\Scripts\pip.exe"

if not exist "%PYTHON_EXE%" (
    set "PYTHON_EXE=python"
    set "PIP_EXE=pip"
)

:: Check Python
"%PYTHON_EXE%" --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.8+ from python.org
    pause
    exit /b 1
)

:: Install dependencies
echo Installing Python dependencies...
"%PIP_EXE%" install fastapi uvicorn pandas numpy --quiet

echo.
echo Starting GlowIQ API on http://localhost:8000
echo Keep this window open while using the app.
echo Press Ctrl+C to stop.
echo.

"%PYTHON_EXE%" server.py
pause
