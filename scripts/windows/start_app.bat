@echo off
setlocal enabledelayedexpansion

echo ========================================
echo IDStudio.ai - One-Click Launcher
echo ========================================
echo.

:: Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18.17 or later from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Display Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

:: Navigate to project directory
cd /d "%~dp0..\.."

:: Check if .env.local exists, if not copy from .env.example
if not exist ".env.local" (
    if exist ".env.example" (
        echo Copying .env.example to .env.local...
        copy ".env.example" ".env.local" >nul
        echo.
        echo IMPORTANT: Please edit .env.local and add your Supabase credentials
        echo Get them from: https://supabase.com/dashboard
        echo.
        echo Press any key after you've updated .env.local with your credentials...
        pause >nul
    ) else (
        echo WARNING: No .env.example file found
    )
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
)

:: Start the development server in this window (non-blocking)
echo Starting IDStudio.ai development server...
echo.
start "" /min cmd /c "npm run dev"

:: Wait for the server to be ready
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

:check_server
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto check_server
)

:: Open browser
echo Server is ready! Opening browser...
start "" "http://localhost:3000"

echo.
echo ========================================
echo IDStudio.ai is now running!
echo URL: http://localhost:3000
echo Close this window to stop the server
echo ========================================
echo.

:: Keep window open to show logs
pause >nul



