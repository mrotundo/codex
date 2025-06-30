#!/usr/bin/env node

console.log('Node version:', process.version);
console.log('CODEX_UNSAFE_ALLOW_NO_SANDBOX:', process.env.CODEX_UNSAFE_ALLOW_NO_SANDBOX);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

// Test spawning a simple echo command
const { spawn } = require('child_process');

const testEnv = {
  ...process.env,
  CODEX_UNSAFE_ALLOW_NO_SANDBOX: '1'
};

console.log('\nTesting spawn with environment:');
console.log('CODEX_UNSAFE_ALLOW_NO_SANDBOX in testEnv:', testEnv.CODEX_UNSAFE_ALLOW_NO_SANDBOX);

const echo = spawn('echo', ['Hello World'], {
  env: testEnv,
  stdio: 'pipe'
});

echo.stdout.on('data', (data) => {
  console.log('Echo output:', data.toString());
});

echo.stderr.on('data', (data) => {
  console.error('Echo error:', data.toString());
});

echo.on('error', (error) => {
  console.error('Spawn error:', error.message);
});

echo.on('exit', (code) => {
  console.log('Echo exited with code:', code);
});