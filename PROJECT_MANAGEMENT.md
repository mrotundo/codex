# Project Management in Codex API Wrapper

The Codex API wrapper automatically organizes all work into project directories, ensuring files are never created in the root directory.

## How It Works

Every job runs in a project directory:

1. **With Project ID**: If you specify a project ID, it uses `{root}/projects/{project-id}`
2. **Without Project ID**: Automatically generates one like `project-a1b2c3d4` (using job ID)
3. **Always Isolated**: Each project has its own workspace directory
4. **Database Tracked**: All projects are tracked with timestamps

## Using Projects

### Via the UI

1. Navigate to the job creation form
2. **Option A**: Enter a specific Project ID (e.g., `my-webapp`, `data-analysis`)
3. **Option B**: Leave it empty for auto-generated ID
4. Submit your job

The system will:
- Create the project directory if it doesn't exist
- Show the project ID in the job status bar with a 📁 icon
- Run all Codex operations in that directory
- Never create files in the root directory

### Via the API

```json
POST /api/jobs
{
  "prompt": "Create a React app with TypeScript",
  "projectId": "my-react-app",
  "parameters": {
    "model": "gpt-4",
    "approvalMode": "auto-edit"
  }
}
```

## Project Structure

```
codex/
├── projects/                 # All project workspaces
│   ├── my-webapp/           # Project folder (created automatically)
│   │   ├── src/            # Files created by Codex
│   │   ├── package.json    # for this project
│   │   └── ...
│   ├── data-analysis/      # Another project
│   │   ├── notebooks/
│   │   ├── data/
│   │   └── ...
│   └── .gitkeep
```

## Benefits

1. **Organization**: Keep different projects separate and organized
2. **Context Preservation**: Each project maintains its own files and state
3. **Reusability**: Return to a project later by using the same Project ID
4. **Isolation**: Projects don't interfere with each other

## Database Tracking

Projects are tracked in the database with:
- Project ID
- Project path
- Creation timestamp
- Last accessed timestamp

## Example Workflow

1. **Start a new web app project**:
   - Project ID: `todo-app`
   - Prompt: "Create a todo list app with React and TypeScript"

2. **Continue working on it later**:
   - Project ID: `todo-app` (same as before)
   - Prompt: "Add user authentication to the todo app"

3. **Start a different project**:
   - Project ID: `data-viz`
   - Prompt: "Create a Python script to visualize CSV data"

Each project gets its own workspace, keeping your work organized and separate.

## API Endpoints

- `GET /api/projects` - List all projects with their last accessed times

## Notes

- Project IDs are case-sensitive but will be sanitized for filesystem compatibility
- Projects persist between server restarts (stored in the database)
- The `projects/` directory is excluded from git by default