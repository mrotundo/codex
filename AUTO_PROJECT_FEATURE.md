# Auto-Project Feature

The Codex API wrapper **always** creates and uses project directories for all work. This ensures clean organization and prevents files from being created in unexpected locations.

## Key Points

1. **Every job runs in a project directory** - no exceptions
2. **Auto-generation** - if you don't specify a project ID, one is created automatically
3. **Working directory** - Codex CLI's working directory is set to the project folder
4. **File isolation** - all created files go into the project directory

## How It Works

### Without Project ID
```json
{
  "prompt": "Create a Python script"
}
```
Result: Creates `projects/project-a1b2c3d4/` (auto-generated from job ID)

### With Project ID
```json
{
  "prompt": "Create a Python script",
  "projectId": "my-python-app"
}
```
Result: Creates/uses `projects/my-python-app/`

## Benefits

1. **Clean Root Directory**: Your main directory never gets cluttered
2. **Easy Organization**: All work is organized by project
3. **Reusability**: Return to a project by using the same ID
4. **Isolation**: Different projects don't interfere with each other
5. **Predictability**: You always know where files will be created

## Viewing Created Files

After a job completes, you can find all created files in:
```
projects/
├── project-a1b2c3d4/     # Auto-generated project
│   └── script.py
├── my-webapp/            # Named project
│   ├── index.html
│   ├── style.css
│   └── script.js
└── data-analysis/        # Another named project
    ├── analyze.py
    └── results.csv
```

## API Response

When you create a job, the response includes the project ID:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "project-550e8400",  // Auto-generated or your specified ID
  "status": "queued",
  "createdAt": "2024-01-20T10:00:00Z"
}
```

This way you always know which project directory your files will be in!