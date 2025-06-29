#!/usr/bin/env node

// Wrapper to make TypeScript CLI work with protocol mode
// This is a temporary solution until Rust binary is available

import { spawn } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Store state
let sessionConfig: any = {};
let subId: string = '';

// Helper to send events
function sendEvent(msg: any) {
  console.log(JSON.stringify({ sub_id: subId, msg }));
}

// Handle incoming protocol messages
rl.on('line', (line) => {
  try {
    const submission = JSON.parse(line);
    subId = submission.sub_id;
    
    switch (submission.op.type) {
      case 'ConfigureSession':
        sessionConfig = submission.op.config;
        sendEvent({ type: 'SessionConfigured' });
        break;
        
      case 'UserInput':
        // For now, just simulate a simple response
        sendEvent({ type: 'TaskStarted' });
        
        setTimeout(() => {
          sendEvent({ 
            type: 'AgentMessage', 
            content: 'I understand you want me to: ' + submission.op.input 
          });
          
          // Simulate a simple command execution
          sendEvent({
            type: 'ExecApprovalRequest',
            id: 'exec-1',
            command: 'ls -la',
            context: 'Listing directory contents'
          });
        }, 500);
        break;
        
      case 'ExecApproval':
        if (submission.op.approval.type === 'Allow') {
          sendEvent({ type: 'ExecStart', command: 'ls -la' });
          
          setTimeout(() => {
            sendEvent({
              type: 'ExecOutput',
              output: 'total 8\ndrwxr-xr-x  3 user  staff  96 Jan 20 10:00 .\ndrwxr-xr-x  5 user  staff 160 Jan 20 09:00 ..\n-rw-r--r--  1 user  staff 100 Jan 20 10:00 test.txt\n',
              stream: 'stdout'
            });
            
            sendEvent({ type: 'ExecStop', exit_code: 0 });
            sendEvent({ type: 'TurnComplete', response_id: 'resp-1' });
            sendEvent({ type: 'TaskComplete', response_id: 'resp-1' });
          }, 500);
        } else {
          sendEvent({ 
            type: 'AgentMessage', 
            content: 'Command execution was denied.' 
          });
          sendEvent({ type: 'TaskComplete', response_id: 'resp-1' });
        }
        break;
        
      case 'Interrupt':
        sendEvent({ type: 'Error', error: 'Task interrupted' });
        break;
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  process.exit(0);
});

process.on('SIGINT', () => {
  process.exit(0);
});