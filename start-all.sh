#!/bin/bash

# Load nvm and use Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

echo "Starting Codex API Server and UI..."

# Function to cleanup on exit
cleanup() {
    echo -e "\nShutting down servers..."
    # Kill the process group
    kill -TERM -$$
    exit
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server in new process group
echo "Starting backend server on port 4133..."
(cd codex-server && exec npm run dev) &
BACKEND_PID=$!

# Wait a bit for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Start frontend server in new process group  
echo "Starting frontend server on port 4123..."
(cd codex-ui && exec npm run dev) &
FRONTEND_PID=$!

# Give frontend a moment to start
sleep 2

echo ""
echo "========================================"
echo "Both servers are now running!"
echo "Backend API: http://localhost:4133"
echo "Frontend UI: http://localhost:4123"
echo "Press Ctrl+C to stop both servers"
echo "========================================"
echo ""

# Wait indefinitely
while true; do
    sleep 1
done