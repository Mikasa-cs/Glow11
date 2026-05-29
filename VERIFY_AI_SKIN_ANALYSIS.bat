@echo off
REM AI Skin Analysis Verification Script
REM This script verifies that all components are working correctly

echo.
echo =====================================
echo AI SKIN ANALYSIS - VERIFICATION TEST
echo =====================================
echo.

REM Check Python backend
echo Checking Python Backend...
tasklist | find /i "python.exe" >nul
if %errorlevel% equ 0 (
    echo [OK] Python backend is running
) else (
    echo [ERROR] Python backend is NOT running
    echo Please run: python server.py
    pause
    exit /b 1
)

REM Check Node frontend
echo Checking Node Frontend...
tasklist | find /i "node.exe" >nul
if %errorlevel% equ 0 (
    echo [OK] Node frontend is running
) else (
    echo [ERROR] Node frontend is NOT running
    echo Please run: npm run dev
    pause
    exit /b 1
)

REM Check environment file
echo.
echo Checking Environment Configuration...
findstr /i "VITE_API_URL=http://localhost:8000" .env >nul
if %errorlevel% equ 0 (
    echo [OK] VITE_API_URL is correctly configured
) else (
    echo [ERROR] VITE_API_URL is not set to http://localhost:8000
    pause
    exit /b 1
)

findstr /i "ANTHROPIC_API_KEY=sk-ant" .env >nul
if %errorlevel% equ 0 (
    echo [OK] ANTHROPIC_API_KEY is configured
) else (
    echo [ERROR] ANTHROPIC_API_KEY is missing
    pause
    exit /b 1
)

REM Check if required files exist
echo.
echo Checking Required Files...
if exist "skin_analysis_endpoint.py" (
    echo [OK] skin_analysis_endpoint.py found
) else (
    echo [ERROR] skin_analysis_endpoint.py not found
    exit /b 1
)

if exist "recommendation_engine.py" (
    echo [OK] recommendation_engine.py found
) else (
    echo [ERROR] recommendation_engine.py not found
    exit /b 1
)

if exist "Skin_Care.csv" (
    echo [OK] Skin_Care.csv found
) else (
    echo [ERROR] Skin_Care.csv not found
    exit /b 1
)

if exist "src\components\SkinSelfieAnalyzer.jsx" (
    echo [OK] SkinSelfieAnalyzer.jsx found
) else (
    echo [ERROR] SkinSelfieAnalyzer.jsx not found
    exit /b 1
)

echo.
echo =====================================
echo ALL CHECKS PASSED!
echo =====================================
echo.
echo Your AI Skin Analysis feature is ready to use!
echo.
echo Access the application at: http://localhost:3000
echo API Documentation at:      http://localhost:8000/docs
echo.
echo Next Steps:
echo 1. Open browser to http://localhost:3000
echo 2. Navigate to AI Skin Analysis section
echo 3. Upload a selfie or capture from camera
echo 4. View analysis results and product recommendations
echo.
pause
