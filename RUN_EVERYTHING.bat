@echo off
REM ===========================================================================
REM GlowIQ - Run Everything
REM ===========================================================================
REM This script starts the backend, frontend, and runs verification tests
REM ===========================================================================

cls
echo.
echo ═══════════════════════════════════════════════════════════════════════
echo  🚀 GlowIQ - Complete Setup & Verification
echo ═══════════════════════════════════════════════════════════════════════
echo.

REM Check if running from correct directory
if not exist "server.py" (
    echo ❌ Error: server.py not found!
    echo Please run this script from: C:\Users\shivi\Downloads\glow10\
    pause
    exit /b 1
)

REM Check Python
echo Checking dependencies...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)
echo ✓ Python found

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install Node.js
    pause
    exit /b 1
)
echo ✓ npm found

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo  STEP 1: Running Tests
echo ═══════════════════════════════════════════════════════════════════════
echo.

python test_all.py
if %errorlevel% neq 0 (
    echo.
    echo ❌ Tests failed! Please fix errors before starting servers.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo  STEP 2: Starting Backend Server
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo Starting FastAPI backend on port 8000...
echo (A new window will open)
echo.

start "GlowIQ Backend - python server.py" cmd /k "cd /d %cd% && python server.py"

timeout /t 4 /nobreak

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo  STEP 3: Installing Frontend Dependencies
echo ═══════════════════════════════════════════════════════════════════════
echo.

if exist "node_modules" (
    echo ✓ node_modules already installed
) else (
    echo Installing npm packages...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ npm install failed
        pause
        exit /b 1
    )
    echo ✓ npm packages installed
)

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo  STEP 4: Starting Frontend Server
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo Starting Vite frontend on port 5173...
echo (A new window will open)
echo.

start "GlowIQ Frontend - npm run dev" cmd /k "cd /d %cd% && npm run dev"

timeout /t 2 /nobreak

echo.
echo ═══════════════════════════════════════════════════════════════════════
echo  ✅ STARTUP COMPLETE!
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo 📍 Access the application:
echo.
echo    🌐 Frontend:  http://localhost:5173
echo    ⚙️  Backend:   http://localhost:8000
echo    📚 API Docs:  http://localhost:8000/docs
echo    ❤️  Health:    http://localhost:8000/health
echo.
echo 🔑 Login Credentials:
echo.
echo    Email: shivi5035singh@gmail.com
echo    Pass:  QWERTY@123
echo.
echo 📝 You can now:
echo    1. Sign in to the admin dashboard
echo    2. Create new user accounts (Register tab)
echo    3. Create new admin accounts (Register Admin tab)
echo    4. Browse the storefront
echo    5. Click products to test recommendations
echo.
echo 🛑 To stop the servers:
echo    - Close the backend window (Ctrl+C)
echo    - Close the frontend window (Ctrl+C)
echo.
echo ═══════════════════════════════════════════════════════════════════════
echo.
echo Backend window is opening... Press any key here when ready.
echo.
pause

echo.
echo 🎉 All systems running! Open http://localhost:5173 in your browser.
echo.
pause
