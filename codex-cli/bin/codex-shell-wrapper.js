#!/usr/bin/env node

/**
 * Wrapper for Codex CLI that intercepts shell commands and ensures they're executed with proper shell interpretation
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Path to the actual Codex CLI
const codexPath = path.join(__dirname, 'codex.js');

// Get command line arguments (remove node and script name)
const args = process.argv.slice(2);

console.error('[Shell Wrapper] Starting Codex with args:', args);

// Spawn the actual Codex CLI
const codexProcess = spawn('node', [codexPath, ...args], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

// Create readline interface for parsing output
const rl = readline.createInterface({
  input: codexProcess.stdout,
  crlfDelay: Infinity
});

// Pass through stderr
codexProcess.stderr.pipe(process.stderr);

// Intercept and modify function calls
rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    
    // If it's a function call for shell command, modify it
    if (msg.type === 'function_call' && msg.name === 'shell' && msg.arguments) {
      const args = JSON.parse(msg.arguments);
      
      // Check if command contains shell operators
      if (args.command && Array.isArray(args.command)) {
        const shellOperators = ['>', '>>', '<', '|', '&', '&&', '||', ';'];
        const needsShell = args.command.some(arg => shellOperators.includes(arg));
        
        if (needsShell) {
          console.error('[Shell Wrapper] Detected shell operators, wrapping in sh -c');
          // Convert array to single shell command
          const shellCommand = args.command.join(' ');
          args.command = ['sh', '-c', shellCommand];
          msg.arguments = JSON.stringify(args);
        }
      }
    }
    
    // Output the (possibly modified) message
    console.log(JSON.stringify(msg));
  } catch (e) {
    // Not JSON, pass through as-is
    console.log(line);
  }
});

// Pass through stdin
process.stdin.pipe(codexProcess.stdin);

// Handle process exit
codexProcess.on('exit', (code) => {
  process.exit(code || 0);
});