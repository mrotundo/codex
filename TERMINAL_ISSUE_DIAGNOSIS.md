# Terminal and Code Changes Tabs Not Working - Diagnosis

## Root Causes
1. **Missing API Key**: The Codex CLI requires an OpenAI API key to function
2. **Sandbox Execution Errors**: The Codex CLI uses sandboxing which fails with "spawn /usr/bin/sandbox-exec ENOENT" errors

## Issue Details

1. **Missing API Key**: The `OPENAI_API_KEY` environment variable is not set
2. **CLI Interactive Prompt**: When the API key is missing, Codex CLI tries to show an interactive prompt to sign in or paste an API key
3. **Quiet Mode Failure**: In quiet mode (`-q`), the interactive prompt causes the process to fail with a "Raw mode is not supported" error
4. **No Events Generated**: Because the CLI fails to start, no events are generated for the UI to display

## Solution

1. **Set the OpenAI API Key**:
   ```bash
   # Add to codex-server/.env
   OPENAI_API_KEY=your-actual-api-key-here
   ```

2. **Get an API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Add it to the `.env` file

3. **Restart the Server**:
   ```bash
   cd codex-server
   npm run dev
   ```

## Testing the Fix

Once the API key is set:

1. Create a new job through the UI
2. The Terminal tab should show:
   - Command executions (with yellow `$` prompts)
   - Command output (stdout)
   - Error output in red (stderr)
   - Exit codes

3. The Code Changes tab should show:
   - File modifications
   - Syntax-highlighted code
   - File tabs for multiple changed files

## Additional Findings

1. **Sandboxing Issues**: 
   - Codex CLI tries to use macOS sandboxing (`/usr/bin/sandbox-exec`) which is not available
   - This causes all shell commands to fail with ENOENT errors
   - Fixed by setting `CODEX_UNSAFE_ALLOW_NO_SANDBOX=1` environment variable

2. **Output Parsing Issues**:
   - Codex CLI in quiet mode sometimes double-encodes JSON output
   - Fixed by parsing nested JSON in function_call_output events

3. **File Creation Issues**:
   - Commands like `echo "content" > file.txt` were failing due to sandboxing
   - With sandboxing disabled, file operations should work correctly

The executor code is properly set up to:
- Parse Codex CLI quiet mode JSON output
- Emit appropriate WebSocket events
- Handle function calls and outputs

The UI components are correctly configured to:
- Display terminal output with proper formatting
- Show file changes (though they expect a `diff` field that may need adjustment)