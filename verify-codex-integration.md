# Verifying Codex Integration

## What is "Codex" in this project?

1. **NOT OpenAI Codex**: This is not using the discontinued OpenAI Codex API
2. **Codex CLI Tool**: A TypeScript CLI application that uses OpenAI's current APIs
3. **Model Used**: When you see "codex-mini-latest", it's likely mapped to GPT-4 or similar

## How the Integration Works

### 1. Backend Executor Flow

```
User submits job → Backend receives request → Executor spawns Codex CLI process
                                                ↓
                                          Checks Node.js version (needs 22+)
                                                ↓
                                          Finds codex-cli/bin/codex.js
                                                ↓
                                          Spawns: node codex.js -q "prompt"
                                                ↓
                                          Parses JSON output from CLI
                                                ↓
                                          Converts to WebSocket events
```

### 2. Authentication

The Codex CLI gets its API key from (in order):
1. `OPENAI_API_KEY` environment variable (passed from backend)
2. `~/.codex/auth.json` (if user logged in via CLI)
3. `~/.codex.env` file
4. Project `.env` file (loaded by the backend)

### 3. Evidence It's Using Real OpenAI API

From our test:
```
STDOUT: {"id":"msg_68615132f3fc8198a5085e5c18e2991502e993c93b117507","type":"message","status":"completed","content":[{"type":"output_text","annotations":[],"logprobs":[],"text":"2 + 2 = 4"}],"role":"assistant"}
```

This shows:
- Real message IDs from OpenAI
- Proper response format
- Actual AI responses (not hardcoded)

### 4. Backend Integration Points

1. **Executor** (`codex-server/src/services/executor.ts`):
   - Line 218: `console.log('Using Codex TypeScript CLI in quiet mode');`
   - Line 238: Spawns actual CLI process
   - Line 242: Passes OPENAI_API_KEY to subprocess

2. **Output Parsing** (`handleCodexQuietModeOutput`):
   - Parses JSON messages from CLI
   - Converts to internal event types
   - Streams to frontend via WebSocket

## Verification Steps

To verify it's using the real CLI and OpenAI API:

1. **Check logs when running a job**:
   - Backend console shows: "Using Codex TypeScript CLI in quiet mode"
   - Backend console shows: "API Key available: true"

2. **Monitor API usage**:
   - Check your OpenAI dashboard for API calls
   - You'll see requests when jobs are executed

3. **Test with invalid API key**:
   - Remove/corrupt the API key
   - Jobs will fail with authentication errors

## Summary

YES, this is using the actual Codex CLI tool, which in turn uses OpenAI's API. The "Codex" name is just what this particular CLI tool is called - it's not using the old OpenAI Codex models.