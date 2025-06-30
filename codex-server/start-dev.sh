#!/bin/bash

# Load nvm and use Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Switching to Node.js 22..."
nvm use 22

echo "Starting Codex Server..."
npm run dev