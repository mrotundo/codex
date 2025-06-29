# Codex Integration Guide

This document explains how to integrate the real Codex CLI with the API wrapper.

## Current Status

The Codex API wrapper has been implemented with full support for the real Codex CLI integration. However, the Rust binary needs to be built first.

## Building Codex

### Prerequisites

- Rust toolchain (install from https://rustup.rs/)
- Node.js 22+

### Build Steps

1. Build the Rust binary:
```bash
cd codex-rs
cargo build --release
```

2. Verify the binary works:
```bash
./target/release/codex --version
```

3. Test the protocol mode:
```bash
echo '{"sub_id":"test","op":{"type":"ConfigureSession","config":{}}}' | ./target/release/codex proto
```

## How Integration Works

The API wrapper communicates with Codex using a JSON-based protocol:

1. **Spawn Process**: The server spawns Codex with the `proto` subcommand
2. **Configure Session**: Sends session configuration including model, approval mode, etc.
3. **Send User Input**: Sends the user's prompt
4. **Handle Events**: Parses events from Codex including:
   - Agent messages
   - Execution approval requests
   - Command output (stdout/stderr)
   - File changes
   - Task completion

## Protocol Messages

### From Server to Codex (Operations)

```json
// Configure session
{"sub_id":"uuid","op":{"type":"ConfigureSession","config":{"model":"claude-3-5-sonnet","approval_mode":"manual"}}}

// Send user input
{"sub_id":"uuid","op":{"type":"UserInput","input":"Create a hello world program"}}

// Approve execution
{"sub_id":"uuid","op":{"type":"ExecApproval","approval":{"type":"Allow"}}}
```

### From Codex to Server (Events)

```json
// Agent message
{"sub_id":"uuid","msg":{"type":"AgentMessage","content":"I'll create a hello world program for you."}}

// Execution approval request
{"sub_id":"uuid","msg":{"type":"ExecApprovalRequest","id":"exec-123","command":"echo 'Hello World'"}}

// Command output
{"sub_id":"uuid","msg":{"type":"ExecOutput","output":"Hello World\n","stream":"stdout"}}
```

## Testing the Integration

1. Start the backend server:
```bash
cd codex-server
npm run dev
```

2. Check if Codex is available:
```bash
curl http://localhost:4133/api/test/codex-binary
```

3. Create a job (will use real Codex if available):
```bash
curl -X POST http://localhost:4133/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"prompt":"List files in current directory","parameters":{"useRealCodex":true}}'
```

## Fallback Behavior

If the Rust binary is not available, the server will:
1. Check for the TypeScript CLI (limited functionality)
2. Fall back to simulation mode for testing

To force simulation mode, set `useRealCodex: false` in the job parameters.

## Troubleshooting

- **Codex not found**: Build the Rust binary using `cargo build --release`
- **Protocol errors**: Check stderr output in the server logs
- **Approval timeout**: Ensure the frontend is properly sending approval responses
- **No output**: Verify Codex has proper permissions and API key is set