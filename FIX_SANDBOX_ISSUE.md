# Sandbox Issue Fix

## Problem
Even with `CODEX_UNSAFE_ALLOW_NO_SANDBOX=1` set, the Codex CLI still tries to use sandboxing on macOS because:

1. In `full-auto` mode, the approval system sets `runInSandbox: true`
2. The `getSandbox` function on macOS checks for `/usr/bin/sandbox-exec` first
3. The `CODEX_UNSAFE_ALLOW_NO_SANDBOX` check only happens on non-macOS/Linux platforms

## Current Flow
```
full-auto mode → runInSandbox: true → macOS → looks for sandbox-exec → FAILS
```

## Solutions

### Option 1: Use a Different Approval Mode (Quick Fix)
Instead of `full-auto`, use `auto-edit` which might not enforce sandboxing:
```json
{
  "approvalMode": "auto-edit"
}
```

### Option 2: Patch the Codex CLI (Proper Fix)
Modify the `getSandbox` function in `handle-exec-command.ts` to check the environment variable first:

```typescript
async function getSandbox(runInSandbox: boolean): Promise<SandboxType> {
  // Check environment override first
  if (CODEX_UNSAFE_ALLOW_NO_SANDBOX) {
    return SandboxType.NONE;
  }
  
  if (runInSandbox) {
    // ... existing platform checks
  }
}
```

### Option 3: Create a Fake sandbox-exec (Workaround)
Create a dummy `/usr/bin/sandbox-exec` that just executes commands without sandboxing.

## Temporary Workaround
For now, the issue is that Codex is trying to use macOS sandboxing which doesn't exist. The models are working correctly, but the execution environment is preventing file operations.