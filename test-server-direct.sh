#!/bin/bash

echo "=== Testing Server Direct Execution ==="
echo

# Create a simple test job
echo "Creating test job..."
curl -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a file named test.txt with the content: This is a test file created by Codex",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "full-auto"
    }
  }' | python3 -m json.tool

echo
echo "Waiting for job to complete..."
sleep 10

echo
echo "Checking project directories..."
ls -la projects/

echo
echo "Checking most recent project directory..."
LATEST_PROJECT=$(ls -t projects/ | grep -v "\.gitkeep" | head -n 1)
if [ -n "$LATEST_PROJECT" ]; then
  echo "Latest project: $LATEST_PROJECT"
  echo "Contents:"
  ls -la "projects/$LATEST_PROJECT/"
  
  if [ -f "projects/$LATEST_PROJECT/test.txt" ]; then
    echo
    echo "File content:"
    cat "projects/$LATEST_PROJECT/test.txt"
  else
    echo "test.txt not found in project directory"
  fi
else
  echo "No project directories found"
fi