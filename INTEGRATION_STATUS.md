# Codex API Integration Status

## Important Note on "Codex"

The "Codex" in this project refers to the CLI tool itself (in the `codex-cli` directory), not OpenAI's discontinued Codex models. This CLI tool actually uses:
- GPT-4 models (default appears to be GPT-4)
- Other OpenAI models like GPT-4o, o1, o3, etc.
- The model `codex-mini-latest` in the config maps to current GPT models

## Current Implementation

The Codex API wrapper has been built with the following components:

### Backend (codex-server)
- **Port**: 4133
- **Technology**: Node.js, Express, TypeScript, SQLite
- **Features**:
  - REST API for job management
  - WebSocket for real-time event streaming
  - SQLite database for persistence (stored in `data/codex.db`)
  - Approval flow for command execution

### Frontend (codex-ui)
- **Port**: 4123
- **Technology**: React, TypeScript, Vite, Material-UI
- **Features**:
  - Modern dark mode UI
  - Real-time terminal output
  - Approval dialogs
  - Job history and management

## Integration with Codex CLI

### Current Status

The integration uses the actual Codex TypeScript CLI in quiet mode (`-q` flag).

1. **Node.js Version**: ✅ Node.js 22.17.0 installed
   - The Codex CLI requires Node.js 22 or higher
   - The system now has the correct version installed via nvm

2. **API Key**: Requires a valid OpenAI API key set as `OPENAI_API_KEY`

3. **Quiet Mode Integration**: The executor parses JSON output from Codex CLI's quiet mode:
   ```json
   {"role":"user","content":[{"type":"input_text","text":"What is 2 + 2?"}],"type":"message"}
   {"id":"rs_...","type":"reasoning","summary":[],"duration_ms":1760}
   {"id":"msg_...","type":"message","status":"completed","content":[{"type":"output_text","text":"2 + 2 equals 4."}],"role":"assistant"}
   ```

### No Fallback Mode

The system ONLY uses the real Codex CLI. There is no simulation or fallback.
If requirements are not met (Node.js 22+, CLI present, API key), jobs will fail with clear error messages.

## Running the Application

### Using VS Code

1. Open the Command Palette (Cmd+Shift+P)
2. Run "Tasks: Run Task"
3. Select "Start All Servers"

Or use the debug configuration:
1. Go to Run and Debug (Cmd+Shift+D)
2. Select "Full Stack Debug"
3. Press F5

### Manual Start

```bash
# Terminal 1 - Backend
cd codex-server
npm run dev

# Terminal 2 - Frontend
cd codex-ui
npm run dev
```

## Current Setup

The system is now fully configured with:

1. **Node.js 22.17.0**: ✅ Installed and set as default
   ```bash
   # Verify with:
   node --version  # Should show v22.17.0
   ```

2. **Set API Key**: Ensure `OPENAI_API_KEY` is set in environment
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. **Real Integration**: The system now uses the actual Codex CLI instead of simulation

## Architecture Notes

The system uses a clean separation of concerns:
- **Executor Service**: Manages Codex process lifecycle and communication
- **Event Bus**: Handles real-time event distribution and approval flow
- **WebSocket Handler**: Manages client connections and protocol messages
- **Database Service**: Persistent storage for jobs and events

The approval flow works as follows:
1. Codex requests approval for a command
2. Backend emits approval request via WebSocket
3. Frontend shows approval dialog
4. User decision is sent back via WebSocket
5. Backend forwards decision to Codex process