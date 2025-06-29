@echo off
echo Starting Codex API Server and UI...

REM Start backend server
echo Starting backend server on port 4133...
cd codex-server
start /B cmd /c "npm run dev"

REM Wait a bit for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

REM Start frontend server
echo Starting frontend server on port 4123...
cd ..\codex-ui
start /B cmd /c "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4133
echo Frontend: http://localhost:4123
echo.
echo Press Ctrl+C to stop the servers.

REM Keep the window open
pause > nul