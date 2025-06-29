#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Codex API & UI...${NC}"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d. -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠️  Node.js version is less than 18. You have $(node -v).${NC}"
    echo -e "${YELLOW}   Please upgrade to Node.js 18+ for best compatibility.${NC}"
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $1 is already in use.${NC}"
        echo -e "   Please stop the process using port $1 or change the port in the configuration."
        return 1
    fi
    return 0
}

# Check if ports are available
echo -e "${BLUE}Checking ports...${NC}"
if ! check_port 4133; then
    exit 1
fi
if ! check_port 4123; then
    exit 1
fi
echo -e "${GREEN}✅ Ports are available${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "codex-server/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
    cd codex-server && npm install && cd ..
    echo ""
fi

if [ ! -d "codex-ui/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd codex-ui && npm install && cd ..
    echo ""
fi

# Initialize database if it doesn't exist
if [ ! -f "codex-server/database/codex.db" ]; then
    echo -e "${YELLOW}🗄️  Initializing database...${NC}"
    cd codex-server && npm run db:init && cd ..
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server
echo -e "${BLUE}🖥️  Starting backend server on port 4133...${NC}"
cd codex-server && npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo -e "${BLUE}🎨 Starting frontend server on port 4123...${NC}"
cd codex-ui && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Codex API & UI are starting!${NC}"
echo ""
echo -e "${BLUE}📍 Access points:${NC}"
echo -e "   Frontend UI: ${GREEN}http://localhost:4123${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:4133${NC}"
echo -e "   WebSocket:   ${GREEN}ws://localhost:4133/ws${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for processes
wait