import { spawn, ChildProcess } from 'child_process';
import { EventType, JobParameters } from '../types';
import { eventBus } from './eventBus';
import { db } from './database';
import path from 'path';

export class CodexExecutor {
  private process: ChildProcess | null = null;
  private jobId: string | null = null;

  async execute(jobId: string, prompt: string, parameters: JobParameters): Promise<void> {
    this.jobId = jobId;

    try {
      // Update job status
      await db.updateJobStatus(jobId, 'running');
      await eventBus.emit(jobId, EventType.JOB_STARTED, { prompt, parameters });

      // For this prototype, we'll simulate the Codex execution
      // In production, this would spawn the actual Codex CLI process
      await this.simulateCodexExecution(jobId, prompt, parameters);

      // Mark job as completed
      await db.updateJobStatus(jobId, 'completed');
      await eventBus.emit(jobId, EventType.JOB_COMPLETED, {});

    } catch (error: any) {
      await db.updateJobStatus(jobId, 'failed', error.message);
      await eventBus.emit(jobId, EventType.JOB_FAILED, { error: error.message });
      throw error;
    }
  }

  private async simulateCodexExecution(
    jobId: string, 
    prompt: string, 
    parameters: JobParameters
  ): Promise<void> {
    // Simulate agent thinking
    await eventBus.emit(jobId, EventType.AGENT_THINKING, { 
      message: 'Analyzing your request...' 
    });
    await this.delay(1000);

    // Simulate agent message
    await eventBus.emit(jobId, EventType.AGENT_MESSAGE, {
      content: `I'll help you with: "${prompt}". Let me break this down into steps.`
    });
    await this.delay(1500);

    // Simulate planning
    await eventBus.emit(jobId, EventType.AGENT_MESSAGE, {
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

    await eventBus.emit(jobId, EventType.TOOL_EXECUTING, {
      tool,
      command,
      context
    });

    // Request approval
    const approvalId = await eventBus.emitApprovalRequest(
      jobId,
      tool,
      command,
      undefined,
      context
    );

    try {
      // Wait for approval
      const decision = await eventBus.waitForApproval(approvalId, 60000);
      
      await eventBus.emit(jobId, EventType.APPROVAL_RECEIVED, {
        approvalId,
        decision
      });

      if (decision === 'reject') {
        await eventBus.emit(jobId, EventType.AGENT_MESSAGE, {
          content: 'Operation cancelled by user.'
        });
        return;
      }

      // Simulate command output
      await eventBus.emit(jobId, EventType.STDOUT, {
        content: `total 64
drwxr-xr-x  10 user  staff   320 Jan 20 10:00 .
drwxr-xr-x  15 user  staff   480 Jan 20 09:00 ..
-rw-r--r--   1 user  staff  1234 Jan 20 10:00 README.md
drwxr-xr-x   8 user  staff   256 Jan 20 10:00 src
-rw-r--r--   1 user  staff   890 Jan 20 10:00 package.json`
      });

      await eventBus.emit(jobId, EventType.TOOL_COMPLETED, {
        tool,
        command,
        exitCode: 0
      });

      // Simulate file change
      await this.delay(1000);
      await eventBus.emit(jobId, EventType.AGENT_MESSAGE, {
        content: 'Now I\'ll create the requested component...'
      });

      await eventBus.emit(jobId, EventType.FILE_CHANGED, {
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
      await eventBus.emit(jobId, EventType.AGENT_MESSAGE, {
        content: 'Task completed successfully! I\'ve created the new component as requested.'
      });

    } catch (error: any) {
      if (error.message === 'Approval timeout') {
        await eventBus.emit(jobId, EventType.AGENT_MESSAGE, {
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
    // This would be the real implementation
    const codexPath = path.join(__dirname, '../../../codex-cli/dist/cli.js');
    const args = ['--prompt', prompt];

    if (parameters.model) args.push('--model', parameters.model);
    if (parameters.approvalMode) args.push('--approval-mode', parameters.approvalMode);

    this.process = spawn('node', [codexPath, ...args], {
      cwd: parameters.workingDirectory || process.cwd(),
      env: { ...process.env }
    });

    this.process.stdout?.on('data', (data) => {
      this.parseAndEmitOutput(jobId, data.toString());
    });

    this.process.stderr?.on('data', (data) => {
      eventBus.emit(jobId, EventType.STDERR, { content: data.toString() });
    });

    return new Promise((resolve, reject) => {
      this.process!.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  private parseAndEmitOutput(jobId: string, output: string): void {
    // Parse Codex output and emit appropriate events
    // This would need to be implemented based on Codex output format
  }

  cancel(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const executor = new CodexExecutor();