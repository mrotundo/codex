#!/bin/bash

echo "=== Testing File Events ==="
echo

# Create a job that should trigger file events
JOB_RESPONSE=$(curl -s -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a Python script named test.py that prints Hello World",
    "parameters": {
      "model": "gpt-4o-mini",
      "approvalMode": "full-auto"
    }
  }')

JOB_ID=$(echo "$JOB_RESPONSE" | python3 -c "import json, sys; print(json.load(sys.stdin)['jobId'])")
PROJECT_ID=$(echo "$JOB_RESPONSE" | python3 -c "import json, sys; print(json.load(sys.stdin)['projectId'])")

echo "Job ID: $JOB_ID"
echo "Project ID: $PROJECT_ID"
echo

# Wait for job to complete
echo "Waiting for job to complete..."
sleep 10

# Check events
echo "Job events:"
curl -s http://localhost:4133/api/jobs/$JOB_ID | python3 -c "
import json, sys
data = json.load(sys.stdin)
for e in data.get('events', []):
    print(f\"{e['type']}: {e.get('data', {})}\")"

echo
echo "Checking project directory:"
ls -la "/Users/developer/projects/codex/projects/$PROJECT_ID/"

# Check if file was created
if [ -f "/Users/developer/projects/codex/projects/$PROJECT_ID/test.py" ]; then
    echo
    echo "File content:"
    cat "/Users/developer/projects/codex/projects/$PROJECT_ID/test.py"
fi