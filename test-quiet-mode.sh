#!/bin/bash

# Load nvm and use Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

echo "=== Testing Codex CLI Quiet Mode Output ==="
echo

# Create a test directory
mkdir -p test-output
cd test-output

# Run Codex in quiet mode with a simple command
echo "Running: node ../codex-cli/bin/codex.js -q --full-auto 'Create a simple hello.txt file with the content Hello World'"
echo
node ../codex-cli/bin/codex.js -q --full-auto "Create a simple hello.txt file with the content Hello World"

echo
echo "=== Files created ==="
ls -la