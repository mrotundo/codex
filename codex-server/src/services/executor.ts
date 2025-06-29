import { spawn, ChildProcess } from 'child_process';
import { EventType, JobParameters } from '../types';
import { eventBus } from './eventBus';
import { db } from './database';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

export class CodexExecutor {
  private process: ChildProcess | null = null;
  private jobId: string | null = null;
  private rl: readline.Interface | null = null;
  private pendingApprovals: Map<string, string> = new Map(); // approval_id -> exec_id
  private taskSubId: string | null = null;

  async execute(jobId: string, prompt: string, parameters: JobParameters): Promise<void> {
    this.jobId = jobId;

    try {
      // Update job status
      await db.updateJobStatus(jobId, 'running');
      await eventBus.emitEvent(jobId, EventType.JOB_STARTED, { prompt, parameters });

      // Use real Codex CLI if available, otherwise fall back to simulation
      const useRealCodex = parameters.useRealCodex !== false; // Default to true
      
      if (useRealCodex) {
        await this.spawnCodexProcess(jobId, prompt, parameters);
      } else {
        await this.simulateCodexExecution(jobId, prompt, parameters);
      }

      // Mark job as completed
      await db.updateJobStatus(jobId, 'completed');
      await eventBus.emitEvent(jobId, EventType.JOB_COMPLETED, {});

    } catch (error: any) {
      await db.updateJobStatus(jobId, 'failed', error.message);
      await eventBus.emitEvent(jobId, EventType.JOB_FAILED, { error: error.message });
      throw error;
    }
  }

  private async simulateCodexExecution(
    jobId: string, 
    prompt: string, 
    parameters: JobParameters
  ): Promise<void> {
    // Simulate agent thinking
    await eventBus.emitEvent(jobId, EventType.AGENT_THINKING, { 
      message: 'Analyzing your request...' 
    });
    await this.delay(1000);

    // Simulate agent message
    await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
      content: `I'll help you with: "${prompt}". Let me break this down into steps.`
    });
    await this.delay(1500);

    // Simulate planning
    await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
      content: `Here's my plan:
1. First, I'll check the current project structure
2. Then, I'll implement the requested changes
3. Finally, I'll run tests to ensure everything works`
    });
    await this.delay(1000);

    // Simulate tool execution with approval
    const tool = 'shell';
    const command = 'ls -la';
    const context = 'Checking current directory structure';

    await eventBus.emitEvent(jobId, EventType.TOOL_EXECUTING, {
      tool,
      command,
      context
    });

    // Request approval
    const approvalId = await eventBus.emitApprovalRequest(
      jobId,
      tool,
      context,
      command,
      undefined
    );

    try {
      console.log(`Waiting for approval with approvalId: ${approvalId}`);
      
      // Wait for approval
      const decision = await eventBus.waitForApproval(approvalId, 60000);
      
      console.log(`Received approval decision: ${decision} for approvalId: ${approvalId}`);
      
      await eventBus.emitEvent(jobId, EventType.APPROVAL_RECEIVED, {
        approvalId,
        decision
      });

      if (decision === 'reject') {
        await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
          content: 'Operation cancelled by user.'
        });
        return;
      }

      // Wait a moment before showing output
      await this.delay(500);

      // Simulate command output
      await eventBus.emitEvent(jobId, EventType.STDOUT, {
        content: `total 64
drwxr-xr-x  10 user  staff   320 Jan 20 10:00 .
drwxr-xr-x  15 user  staff   480 Jan 20 09:00 ..
-rw-r--r--   1 user  staff  1234 Jan 20 10:00 README.md
drwxr-xr-x   8 user  staff   256 Jan 20 10:00 src
-rw-r--r--   1 user  staff   890 Jan 20 10:00 package.json
`
      });

      await eventBus.emitEvent(jobId, EventType.TOOL_COMPLETED, {
        tool,
        command,
        exitCode: 0
      });

      // Simulate file change
      await this.delay(1000);
      await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
        content: 'Now I\'ll create the requested component...'
      });

      await eventBus.emitEvent(jobId, EventType.FILE_CHANGED, {
        path: 'src/components/NewComponent.tsx',
        action: 'created',
        diff: `+import React from 'react';
+
+export const NewComponent: React.FC = () => {
+  return (
+    <div className="new-component">
+      <h1>Hello from New Component!</h1>
+    </div>
+  );
+};`
      });

      // Final message
      await this.delay(1000);
      await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
        content: 'Task completed successfully! I\'ve created the new component as requested.'
      });

    } catch (error: any) {
      if (error.message === 'Approval timeout') {
        await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
          content: 'Operation timed out waiting for approval.'
        });
      }
      throw error;
    }
  }

  private async spawnCodexProcess(
    jobId: string,
    prompt: string,
    parameters: JobParameters
  ): Promise<void> {
    // Try to use the Rust binary first, fall back to TypeScript CLI
    const codexReleasePath = path.join(__dirname, '../../../target/release/codex');
    const codexDebugPath = path.join(__dirname, '../../../target/debug/codex');
    const codexRsPath = path.join(__dirname, '../../../codex-rs/target/release/codex');
    const codexRsDebugPath = path.join(__dirname, '../../../codex-rs/target/debug/codex');
    
    // Import protocol types
    const { createSubmission, parseEvent, stringifySubmission } = await import('./codex-protocol');
    
    return new Promise((resolve, reject) => {
      // Check which binary exists
      const fs = require('fs');
      let codexBinaryPath = '';
      
      if (fs.existsSync(codexReleasePath)) {
        codexBinaryPath = codexReleasePath;
      } else if (fs.existsSync(codexDebugPath)) {
        codexBinaryPath = codexDebugPath;
      } else if (fs.existsSync(codexRsPath)) {
        codexBinaryPath = codexRsPath;
      } else if (fs.existsSync(codexRsDebugPath)) {
        codexBinaryPath = codexRsDebugPath;
      }
      
      const useRustBinary = !!codexBinaryPath;
      
      console.log(`Using ${useRustBinary ? 'Rust' : 'TypeScript'} Codex implementation`);
      
      // Spawn Codex process with stdio pipes
      if (useRustBinary) {
        // Use Rust binary with proto subcommand
        this.process = spawn(codexBinaryPath, ['proto'], {
          cwd: parameters.workingDirectory || process.cwd(),
          env: { 
            ...process.env,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY,
            NO_COLOR: '1' // Disable color output for easier parsing
          },
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } else {
        // Fall back to TypeScript CLI (note: this doesn't support protocol mode)
        console.warn('TypeScript CLI does not support protocol mode, falling back to simulation');
        this.simulateCodexExecution(jobId, prompt, parameters).then(resolve).catch(reject);
        return;
      }

      if (!this.process.stdin || !this.process.stdout) {
        reject(new Error('Failed to create process streams'));
        return;
      }

      // Create readline interface for parsing JSON messages
      this.rl = readline.createInterface({
        input: this.process.stdout,
        crlfDelay: Infinity
      });

      // Handle process errors
      this.process.on('error', (error) => {
        console.error('Codex process error:', error);
        reject(error);
      });

      this.process.on('exit', (code) => {
        this.cleanup();
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Codex process exited with code ${code}`));
        }
      });

      // Handle stderr (errors and debug info)
      this.process.stderr?.on('data', (data) => {
        const stderr = data.toString();
        console.error('Codex stderr:', stderr);
        eventBus.emitEvent(jobId, EventType.STDERR, { content: stderr });
      });

      // Handle stdout (protocol messages)
      this.rl.on('line', async (line) => {
        await this.handleCodexMessage(jobId, line);
      });

      // Initialize session
      this.taskSubId = uuidv4();
      const configureSession = createSubmission(uuidv4(), {
        type: 'ConfigureSession',
        config: {
          model: parameters.model || 'claude-3-5-sonnet-20241022',
          approval_mode: parameters.approvalMode === 'auto' ? 'auto' : 'manual',
          working_directory: parameters.workingDirectory
        }
      });
      
      this.process.stdin.write(stringifySubmission(configureSession));

      // Send user input
      const userInputSub = createSubmission(this.taskSubId, {
        type: 'UserInput',
        input: prompt,
        last_response_id: parameters.lastResponseId
      });
      
      this.process.stdin.write(stringifySubmission(userInputSub));
    });
  }

  private async handleCodexMessage(jobId: string, line: string): Promise<void> {
    const { parseEvent, createSubmission, stringifySubmission } = await import('./codex-protocol');
    
    const event = parseEvent(line);
    if (!event) {
      console.log('Codex output (non-JSON):', line);
      return;
    }

    console.log('Codex event:', event.msg.type, event);

    switch (event.msg.type) {
      case 'SessionConfigured':
        console.log('Session configured');
        break;

      case 'TaskStarted':
        console.log('Task started');
        break;

      case 'AgentMessage':
        await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
          content: event.msg.content
        });
        break;

      case 'AgentThinking':
        await eventBus.emitEvent(jobId, EventType.AGENT_THINKING, {
          message: event.msg.thinking
        });
        break;

      case 'ExecApprovalRequest': {
        const approvalId = await eventBus.emitApprovalRequest(
          jobId,
          'exec',
          event.msg.context || 'Execute command',
          event.msg.command,
          undefined
        );
        
        // Store mapping from our approval ID to Codex's exec ID
        this.pendingApprovals.set(approvalId, event.msg.id);
        
        // Set up approval handler
        this.handleApprovalResponse(jobId, approvalId, event.msg.id);
        break;
      }

      case 'ExecStart':
        await eventBus.emitEvent(jobId, EventType.TOOL_EXECUTING, {
          tool: 'exec',
          command: event.msg.command,
          context: 'Executing command'
        });
        break;

      case 'ExecOutput':
        if (event.msg.stream === 'stdout') {
          await eventBus.emitEvent(jobId, EventType.STDOUT, {
            content: event.msg.output
          });
        } else {
          await eventBus.emitEvent(jobId, EventType.STDERR, {
            content: event.msg.output
          });
        }
        break;

      case 'ExecStop':
        await eventBus.emitEvent(jobId, EventType.TOOL_COMPLETED, {
          tool: 'exec',
          command: '',
          exitCode: event.msg.exit_code
        });
        break;

      case 'PatchApprovalRequest':
        await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
          content: `Patch requested for ${event.msg.path}`
        });
        break;

      case 'PatchApplied':
        await eventBus.emitEvent(jobId, EventType.FILE_CHANGED, {
          path: event.msg.path,
          action: 'modified'
        });
        break;

      case 'FileChanged':
        await eventBus.emitEvent(jobId, EventType.FILE_CHANGED, {
          path: event.msg.path,
          action: event.msg.action
        });
        break;

      case 'TurnComplete':
        // Store response ID for future use
        console.log('Turn complete, response_id:', event.msg.response_id);
        break;

      case 'TaskComplete':
        console.log('Task complete, response_id:', event.msg.response_id);
        break;

      case 'Error':
        await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
          content: `Error: ${event.msg.error}`
        });
        break;
    }
  }

  private async handleApprovalResponse(jobId: string, approvalId: string, execId: string): Promise<void> {
    const { createSubmission, stringifySubmission } = await import('./codex-protocol');
    
    try {
      const decision = await eventBus.waitForApproval(approvalId, 60000);
      
      console.log(`Sending approval decision to Codex: ${decision} for exec ${execId}`);
      
      const approvalSub = createSubmission(uuidv4(), {
        type: 'ExecApproval',
        approval: decision === 'approve' 
          ? { type: 'Allow' }
          : decision === 'always'
          ? { type: 'AlwaysAllow' }
          : { type: 'Deny' }
      });
      
      if (this.process?.stdin) {
        this.process.stdin.write(stringifySubmission(approvalSub));
      }
      
      await eventBus.emitEvent(jobId, EventType.APPROVAL_RECEIVED, {
        approvalId,
        decision
      });
      
    } catch (error: any) {
      if (error.message === 'Approval timeout') {
        // Send deny on timeout
        const denySub = createSubmission(uuidv4(), {
          type: 'ExecApproval',
          approval: { type: 'Deny' }
        });
        
        if (this.process?.stdin) {
          this.process.stdin.write(stringifySubmission(denySub));
        }
        
        await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
          content: 'Operation timed out waiting for approval.'
        });
      }
      throw error;
    }
  }

  private cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    this.process = null;
    this.pendingApprovals.clear();
    this.taskSubId = null;
  }

  cancel(): void {
    if (this.process) {
      // Send interrupt message before killing
      if (this.process.stdin) {
        import('./codex-protocol').then(({ createSubmission, stringifySubmission }) => {
          const interruptSub = createSubmission(uuidv4(), { type: 'Interrupt' });
          this.process!.stdin!.write(stringifySubmission(interruptSub));
        });
      }
      
      // Give it a moment to clean up
      setTimeout(() => {
        if (this.process) {
          this.process.kill();
          this.cleanup();
        }
      }, 500);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const executor = new CodexExecutor();