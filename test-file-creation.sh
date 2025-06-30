#!/bin/bash

echo "=== Testing File Creation with Proper Shell Commands ==="
echo

# Test 1: Very explicit shell command
echo "Test 1: Explicit shell command with redirect operator"
curl -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Execute this exact command: echo \"Hello from test 1\" > test1.txt",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "auto-edit"
    }
  }' | python3 -m json.tool | grep -E "jobId|projectId"

sleep 5

# Test 2: Force shell with sh -c
echo -e "\nTest 2: Using sh -c to force shell execution"
curl -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Run: sh -c \"echo Hello from test 2 > test2.txt\"",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "auto-edit"
    }
  }' | python3 -m json.tool | grep -E "jobId|projectId"

sleep 5

# Test 3: Multiple commands
echo -e "\nTest 3: Multiple file operations"
curl -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Execute these commands: 1) echo \"Line 1\" > test3.txt 2) echo \"Line 2\" >> test3.txt",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "auto-edit"
    }
  }' | python3 -m json.tool | grep -E "jobId|projectId"

sleep 8

echo -e "\n=== Checking Results ==="
echo "Project directories created:"
ls -lt projects/ | head -5

echo -e "\nChecking for files in recent projects:"
for dir in $(ls -t projects/ | grep -v gitkeep | head -3); do
  echo -e "\nProject: $dir"
  ls -la "projects/$dir/"
  for file in projects/$dir/*.txt; do
    if [ -f "$file" ]; then
      echo "Content of $(basename $file):"
      cat "$file"
    fi
  done
done