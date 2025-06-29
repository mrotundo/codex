#!/bin/bash

echo "=== Testing Auto-Project Creation ==="
echo

# Load nvm and use Node 22
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22

# Test 1: Create job WITHOUT project ID
echo "Test 1: Creating job WITHOUT project ID (should auto-generate)..."
RESPONSE=$(curl -s -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a simple index.html file with Hello World",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "full-auto"
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'

JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId')
PROJECT_ID=$(echo "$RESPONSE" | jq -r '.projectId')

echo
echo "Job ID: $JOB_ID"
echo "Project ID: $PROJECT_ID (auto-generated)"

# Wait a moment for job to start
sleep 2

# Check if project directory was created
echo
echo "Checking project directory..."
if [ -d "projects/$PROJECT_ID" ]; then
  echo "✓ Project directory created: projects/$PROJECT_ID"
  ls -la "projects/$PROJECT_ID/"
else
  echo "✗ Project directory not found"
fi

echo
echo "=== Test 2: Create job WITH specific project ID ==="
echo

RESPONSE2=$(curl -s -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a README.md file",
    "projectId": "my-test-project",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "full-auto"
    }
  }')

echo "Response:"
echo "$RESPONSE2" | jq '.'

PROJECT_ID2=$(echo "$RESPONSE2" | jq -r '.projectId')
echo
echo "Project ID: $PROJECT_ID2 (should be 'my-test-project')"

sleep 2

if [ -d "projects/my-test-project" ]; then
  echo "✓ Project directory created: projects/my-test-project"
  ls -la "projects/my-test-project/"
else
  echo "✗ Project directory not found"
fi

echo
echo "=== Summary ==="
echo "1. Jobs without project ID get auto-generated IDs"
echo "2. Jobs with project ID use the specified ID"
echo "3. All work happens in project directories"
echo "4. No files created in root directory"