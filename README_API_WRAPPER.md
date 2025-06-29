# Codex API Wrapper

This project provides a web-based API wrapper around the Codex CLI, enabling programmatic access and a modern UI for interacting with the AI agent.

**Note**: "Codex" here refers to this specific CLI tool, not OpenAI's discontinued Codex models. The tool uses current OpenAI models like GPT-4, GPT-4o, and others.

## Prerequisites

- Node.js 22+ (installed via nvm)
- OpenAI API key (configured in `.env` file)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Frontend   │────▶│   Backend   │
│             │◀────│  (React)    │◀────│  (Express)  │
└─────────────┘     └─────────────┘     └─────────────┘
                          :4123               :4133
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Codex CLI  │
                                        │   (Node)    │
                                        └─────────────┘
```

## Quick Start

1. **Ensure Node.js 22 is active:**
   ```bash
   node --version  # Should show v22.17.0 or higher
   ```

2. **Start both servers:**
   ```bash
   ./start-servers.sh
   # or
   ./start-all.sh
   ```

3. **Open the UI:**
   Navigate to http://localhost:4123

## Features

- **Real-time Communication**: WebSocket-based event streaming
- **Approval Flow**: Interactive approval dialogs for commands
- **Persistent Storage**: SQLite database for job history
- **Modern UI**: Dark mode interface with Material-UI
- **Terminal Output**: Real-time display of command execution
- **Project Management**: Organize work into separate project folders

## API Endpoints

### REST API (Port 4133)

- `POST /api/jobs` - Create a new job (with optional projectId)
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/cancel` - Cancel a job
- `GET /api/projects` - List all projects

### WebSocket Events

Connect to `ws://localhost:4133/ws` for real-time events:

- `job_started` - Job execution begins
- `agent_message` - AI agent responses
- `tool_executing` - Command execution starts
- `stdout` - Command output
- `approval_request` - Approval needed for command
- `job_completed` - Job finishes successfully

## Configuration

The system reads configuration from `.env` file at the project root:

```env
OPENAI_API_KEY=your-api-key-here
```

## Development

### VS Code Integration

Use the included VS Code configurations:

1. **Run Task**: Cmd+Shift+P → "Tasks: Run Task" → "Start All Servers"
2. **Debug**: F5 with "Full Stack Debug" configuration selected

### Manual Development

```bash
# Terminal 1 - Backend
cd codex-server
npm run dev

# Terminal 2 - Frontend  
cd codex-ui
npm run dev
```

## How It Works

1. User submits a prompt through the UI
2. Backend creates a job and spawns Codex CLI in quiet mode
3. Codex CLI outputs JSON messages as it processes the request
4. Backend parses JSON and converts to WebSocket events
5. Frontend receives events and updates UI in real-time
6. Approval requests pause execution until user responds
7. Results are stored in SQLite database

## Integration Details

The backend executor (`codex-server/src/services/executor.ts`) handles the Codex CLI integration:

- Spawns `node codex-cli/bin/codex.js -q "prompt"`
- Parses JSON output line by line
- Converts Codex events to WebSocket messages
- Manages approval flow for command execution

## Troubleshooting

### "Codex CLI requires Node.js 22 or higher"

Ensure you're using Node.js 22:
```bash
nvm use 22
node --version
```

### "Missing OpenAI API key"

Check that `.env` file exists at project root with:
```
OPENAI_API_KEY=sk-proj-...
```

### Frontend can't connect to backend

Ensure both servers are running on correct ports:
- Backend: http://localhost:4133
- Frontend: http://localhost:4123