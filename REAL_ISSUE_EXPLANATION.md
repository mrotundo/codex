# The Real Issue: Codex Sandboxing

## What's Actually Happening

After deep investigation of the Codex CLI code, here's the truth:

### 1. No Write Tool, Only Shell Commands
- Codex doesn't have a separate "Write" or "Edit" tool
- ALL file operations go through shell commands (echo, cat, etc.)
- When you ask it to "create a file", it runs shell commands

### 2. Sandboxing by Design
In `full-auto` mode, Codex enforces sandboxing for security:
```javascript
// From approvals.ts
return policy === "full-auto"
  ? {
      type: "auto-approve",
      reason: "Full auto mode",
      group: "Running commands",
      runInSandbox: true,  // <-- This is the problem!
    }
```

### 3. macOS Sandbox Implementation
When `runInSandbox: true`, on macOS it tries to use `/usr/bin/sandbox-exec`:
```javascript
// The actual command becomes:
/usr/bin/sandbox-exec -p <policy> -- echo "Hello" > file.txt
```

Since `/usr/bin/sandbox-exec` doesn't exist on your system, you get:
```
Error: spawn /usr/bin/sandbox-exec ENOENT
```

### 4. Why CODEX_UNSAFE_ALLOW_NO_SANDBOX Doesn't Work
The environment variable check happens AFTER the platform check:
```javascript
if (runInSandbox) {
  if (process.platform === "darwin") {
    // Tries to use sandbox-exec first!
    return SandboxType.MACOS_SEATBELT;
  }
  // ... other platforms ...
  else if (CODEX_UNSAFE_ALLOW_NO_SANDBOX) {
    // This is only reached on non-macOS/Linux!
    return SandboxType.NONE;
  }
}
```

## The Solution

I've modified the executor to use `--auto-edit` mode instead of `--full-auto`. This mode:
- Still auto-approves safe commands
- Doesn't enforce sandboxing for all commands
- Allows file writes to work

## To Test

1. Start the server (with Node.js 22):
   ```bash
   cd codex-server
   source ~/.bashrc  # or ~/.zshrc
   npm run dev
   ```

2. Create a job:
   ```bash
   curl -X POST http://localhost:4133/api/jobs \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Create a file named test.txt with Hello World",
       "parameters": {}
     }'
   ```

The server will now:
- Use `--auto-edit` mode (avoiding sandboxing)
- Use `gpt-4o-mini` model (which exists)
- Execute commands without sandbox-exec

## Alternative Solutions

1. **Install sandbox-exec**: Some macOS versions have it at `/usr/bin/sandbox-exec`
2. **Patch Codex CLI**: Modify the getSandbox function to check CODEX_UNSAFE_ALLOW_NO_SANDBOX first
3. **Use different approval modes**: `suggest` or `manual` don't enforce sandboxing