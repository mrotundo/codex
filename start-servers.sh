#!/bin/bash

# Alternative startup script that runs servers in parallel properly

# Load nvm and use Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

echo "Starting Codex API Server and UI..."

# Function to handle cleanup
cleanup() {
    echo -e "\nShutting down servers..."
    # Kill all child processes
    jobs -p | xargs -r kill 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Start backend server
echo "Starting backend server on port 4133..."
(cd codex-server && npm run dev) &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Give backend a moment to initialize
sleep 3

# Start frontend server
echo "Starting frontend server on port 4123..."
(cd codex-ui && npm run dev) &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait a moment for servers to start
sleep 2

echo ""
echo "========================================"
echo "Both servers are now running!"
echo "Backend API: http://localhost:4133"
echo "Frontend UI: http://localhost:4123"
echo "Press Ctrl+C to stop both servers"
echo "========================================"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID