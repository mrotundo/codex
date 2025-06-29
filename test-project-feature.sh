#!/bin/bash

# Test script to verify project management feature

echo "=== Testing Project Management Feature ==="
echo

# Load nvm and use Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

echo "1. Creating a job with project ID 'test-project'..."
curl -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple hello world Python script",
    "projectId": "test-project",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "full-auto"
    }
  }' 2>/dev/null | jq '.'

echo
echo "2. Listing all projects..."
curl http://localhost:4133/api/projects 2>/dev/null | jq '.'

echo
echo "3. Checking if project directory was created..."
ls -la projects/test-project/ 2>/dev/null || echo "Project directory will be created when job runs"

echo
echo "=== Test Complete ==="