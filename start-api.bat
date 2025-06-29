@echo off
setlocal enabledelayedexpansion

echo.
echo [94m🚀 Starting Codex API ^& UI...[0m
echo.

:: Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [91m❌ Node.js is not installed. Please install Node.js 18+ first.[0m
    pause
    exit /b 1
)

:: Check node version
for /f "tokens=1 delims=v." %%i in ('node -v') do set NODE_VERSION=%%i
if !NODE_VERSION! LSS 18 (
    echo [93m⚠️  Node.js version is less than 18. Please upgrade to Node.js 18+.[0m
)

:: Check if ports are in use
echo [94mChecking ports...[0m
netstat -an | findstr :4133 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [91m❌ Port 4133 is already in use.[0m
    echo    Please stop the process using port 4133 or change the port.
    pause
    exit /b 1
)

netstat -an | findstr :4123 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [91m❌ Port 4123 is already in use.[0m
    echo    Please stop the process using port 4123 or change the port.
    pause
    exit /b 1
)

echo [92m✅ Ports are available[0m
echo.

:: Install dependencies if needed
if not exist "codex-server\node_modules" (
    echo [93m📦 Installing backend dependencies...[0m
    cd codex-server
    call npm install
    cd ..
    echo.
)

if not exist "codex-ui\node_modules" (
    echo [93m📦 Installing frontend dependencies...[0m
    cd codex-ui
    call npm install
    cd ..
    echo.
)

:: Initialize database if it doesn't exist
if not exist "codex-server\database\codex.db" (
    echo [93m🗄️  Initializing database...[0m
    cd codex-server
    call npm run db:init
    cd ..
    echo.
)

:: Start servers
echo [94m🖥️  Starting backend server on port 4133...[0m
start "Codex Backend" /B cmd /c "cd codex-server && npm run dev"

:: Wait a bit for backend to start
timeout /t 3 /nobreak >nul

echo [94m🎨 Starting frontend server on port 4123...[0m
start "Codex Frontend" /B cmd /c "cd codex-ui && npm run dev"

echo.
echo [92m✅ Codex API ^& UI are starting![0m
echo.
echo [94m📍 Access points:[0m
echo    Frontend UI: [92mhttp://localhost:4123[0m
echo    Backend API: [92mhttp://localhost:4133[0m
echo    WebSocket:   [92mws://localhost:4133/ws[0m
echo.
echo [93mPress Ctrl+C in each window to stop servers[0m
echo.

:: Keep window open
pause