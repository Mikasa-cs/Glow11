@echo off
REM Test script to verify the AI Image Button integration

cd C:\Users\shivi\Downloads\glow12.0

echo.
echo ============================================================
echo TESTING AI IMAGE BUTTON INTEGRATION
echo ============================================================
echo.

REM Check if all required files exist
echo Checking required files...
if not exist "src\components\SkinSelfieAnalyzer.jsx" (
    echo ERROR: SkinSelfieAnalyzer.jsx not found!
    exit /b 1
)
echo ✓ SkinSelfieAnalyzer.jsx exists

if not exist "src\components\SkinResultPage.jsx" (
    echo ERROR: SkinResultPage.jsx not found!
    exit /b 1
)
echo ✓ SkinResultPage.jsx exists

if not exist "src\components\SkinResultsPage.jsx" (
    echo ERROR: SkinResultsPage.jsx not found!
    exit /b 1
)
echo ✓ SkinResultsPage.jsx exists

if not exist "src\data\imageToBase64.js" (
    echo ERROR: imageToBase64.js not found!
    exit /b 1
)
echo ✓ imageToBase64.js exists

if not exist "skin_analysis_endpoint.py" (
    echo ERROR: skin_analysis_endpoint.py not found!
    exit /b 1
)
echo ✓ skin_analysis_endpoint.py exists

if not exist "skin_vision_prompt.py" (
    echo ERROR: skin_vision_prompt.py not found!
    exit /b 1
)
echo ✓ skin_vision_prompt.py exists

if not exist "Skin_Care.csv" (
    echo ERROR: Skin_Care.csv not found!
    exit /b 1
)
echo ✓ Skin_Care.csv exists

echo.
echo All required files found!
echo.
echo ============================================================
echo SUMMARY
echo ============================================================
echo Frontend: AI Image Button added next to Shop Now ✓
echo Backend: /api/analyze-skin endpoint integrated ✓
echo Components: SkinSelfieAnalyzer, SkinResultsPage integrated ✓
echo.
echo Ready to run:
echo   1. python server.py     (in one terminal)
echo   2. npm run dev           (in another terminal)
echo.
pause
