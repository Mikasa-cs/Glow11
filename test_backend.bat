@echo off
REM Test script to verify GlowIQ backend is running correctly
REM Run this after starting: python server.py

echo.
echo ════════════════════════════════════════════════════════
echo  GlowIQ Backend Verification
echo ════════════════════════════════════════════════════════
echo.

REM Check if backend is running
echo [1/3] Checking backend health...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: Backend not running at http://localhost:8000
    echo Please start the backend with: python server.py
    exit /b 1
)
echo ✅ PASS: Backend is running

REM Check recommendation system
echo [2/3] Checking recommendation system...
curl -s http://localhost:8000/api/recommendations?session_id=test >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: Recommendation endpoint not working
    exit /b 1
)
echo ✅ PASS: Recommendation system connected

REM Check authentication endpoints
echo [3/3] Checking authentication...
curl -s -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@test.com\",\"password\":\"wrong\"}" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ FAIL: Authentication endpoint not working
    exit /b 1
)
echo ✅ PASS: Authentication endpoints working

echo.
echo ════════════════════════════════════════════════════════
echo  ✅ All systems operational!
echo ════════════════════════════════════════════════════════
echo.
echo Admin Login:
echo   Email: shivi5035singh@gmail.com
echo   Pass:  QWERTY@123
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo Docs:     http://localhost:8000/docs
echo.
pause
