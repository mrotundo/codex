#!/bin/bash

echo "=== Patching Codex CLI to disable sandboxing ==="
echo

# Backup the original file
cp codex-cli/src/utils/agent/handle-exec-command.ts codex-cli/src/utils/agent/handle-exec-command.ts.backup

# Create a patched version that checks CODEX_UNSAFE_ALLOW_NO_SANDBOX first
cat > codex-cli/src/utils/agent/handle-exec-command.ts.patch << 'EOF'
--- a/handle-exec-command.ts
+++ b/handle-exec-command.ts
@@ -293,6 +293,11 @@
 
 async function getSandbox(runInSandbox: boolean): Promise<SandboxType> {
+  // Check environment override first - for development/testing
+  if (CODEX_UNSAFE_ALLOW_NO_SANDBOX) {
+    return SandboxType.NONE;
+  }
+  
   if (runInSandbox) {
     if (process.platform === "darwin") {
       // On macOS we rely on the system-provided `sandbox-exec` binary to
EOF

echo "Applying patch..."
cd codex-cli/src/utils/agent
patch -p1 < handle-exec-command.ts.patch

echo
echo "Rebuilding Codex CLI..."
cd ../../../
npm run build

echo
echo "Done! Sandboxing should now be disabled when CODEX_UNSAFE_ALLOW_NO_SANDBOX is set."