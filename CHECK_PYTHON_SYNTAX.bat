@echo off
REM Quick syntax check for Python files

echo Checking Python syntax...

python -m py_compile server.py
if %ERRORLEVEL% NEQ 0 (
    echo ERROR in server.py!
    exit /b 1
)
echo ✓ server.py syntax OK

python -m py_compile skin_analysis_endpoint.py
if %ERRORLEVEL% NEQ 0 (
    echo ERROR in skin_analysis_endpoint.py!
    exit /b 1
)
echo ✓ skin_analysis_endpoint.py syntax OK

python -m py_compile recommendation_engine.py
if %ERRORLEVEL% NEQ 0 (
    echo ERROR in recommendation_engine.py!
    exit /b 1
)
echo ✓ recommendation_engine.py syntax OK

echo.
echo All Python files have valid syntax!
pause
