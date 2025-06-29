#!/bin/bash

# Start both servers using npm concurrently
# This script opens two terminal tabs/windows

echo "Starting Codex servers in separate terminals..."

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Open new terminal tab for backend
    osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/codex-server && npm run dev"'
    
    # Wait a bit for backend to start
    sleep 5
    
    # Open new terminal tab for frontend
    osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"'/codex-ui && npm run dev"'
    
    echo "Started servers in separate Terminal tabs"
    echo "Backend: http://localhost:4133"
    echo "Frontend: http://localhost:4123"

# For Linux with gnome-terminal
elif command -v gnome-terminal &> /dev/null; then
    gnome-terminal --tab --title="Codex Backend" -- bash -c "cd codex-server && npm run dev; exec bash"
    sleep 5
    gnome-terminal --tab --title="Codex Frontend" -- bash -c "cd codex-ui && npm run dev; exec bash"
    
    echo "Started servers in separate terminal tabs"
    echo "Backend: http://localhost:4133"
    echo "Frontend: http://localhost:4123"

# For Windows (Git Bash)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    start cmd //c "cd codex-server && npm run dev"
    sleep 5
    start cmd //c "cd codex-ui && npm run dev"
    
    echo "Started servers in separate command windows"
    echo "Backend: http://localhost:4133"
    echo "Frontend: http://localhost:4123"

else
    echo "Unsupported operating system. Please start servers manually:"
    echo "  Terminal 1: cd codex-server && npm run dev"
    echo "  Terminal 2: cd codex-ui && npm run dev"
fi