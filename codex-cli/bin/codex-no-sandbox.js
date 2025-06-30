#!/usr/bin/env node

// Force disable sandboxing
process.env.CODEX_UNSAFE_ALLOW_NO_SANDBOX = '1';

// Import and run the main CLI
import('../dist/cli.js');