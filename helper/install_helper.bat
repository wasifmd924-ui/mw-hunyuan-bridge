@echo off
echo Installing MW Hunyuan Bridge Windows SketchUp Helper...
powershell -ExecutionPolicy Bypass -File "%~dp0register_protocol.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo Installation failed. Ensure Python 3 is installed and on PATH.
    pause
    exit /b 1
)
echo.
echo Installation complete! You can also run:
echo   python "%~dp0mwhunyuan_helper.py" --serve
echo to enable live helper status detection in your browser.
pause

