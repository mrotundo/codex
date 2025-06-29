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
      // Always use a project directory
      const projectsRoot = path.join(__dirname, '../../../projects');
      
      // Use provided project ID or generate one based on job ID
      const projectId = parameters.projectId || `project-${jobId.substring(0, 8)}`;
      
      const project = await db.getOrCreateProject(projectId, projectsRoot);
      const workingDirectory = project.path;
      
      await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
        content: `Working in project: ${projectId} (${project.path})`
      });

      // Update job status
      await db.updateJobStatus(jobId, 'running');
      await eventBus.emitEvent(jobId, EventType.JOB_STARTED, { prompt, parameters, workingDirectory });

      // Update parameters with resolved working directory
      const updatedParameters = { ...parameters, workingDirectory };
      
      // Always use real Codex CLI - no simulation
      await this.spawnCodexProcess(jobId, prompt, updatedParameters);

      // Mark job as completed
      await db.updateJobStatus(jobId, 'completed');
      await eventBus.emitEvent(jobId, EventType.JOB_COMPLETED, {});

    } catch (error: any) {
      await db.updateJobStatus(jobId, 'failed', error.message);
      await eventBus.emitEvent(jobId, EventType.JOB_FAILED, { error: error.message });
      throw error;
    }
  }


  private async spawnCodexProcess(
    jobId: string,
    prompt: string,
    parameters: JobParameters
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      
      // Check Node.js version first
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
      if (majorVersion < 22) {
        const error = `Codex CLI requires Node.js 22 or higher. Current version: ${nodeVersion}`;
        console.error(error);
        reject(new Error(error));
        return;
      }
      
      // Try to find the Codex TypeScript CLI
      const codexCliPath = path.join(__dirname, '../../../codex-cli/bin/codex.js');
      
      if (!fs.existsSync(codexCliPath)) {
        const error = `Codex CLI not found at ${codexCliPath}`;
        console.error(error);
        reject(new Error(error));
        return;
      }
      
      console.log('Using Codex TypeScript CLI in quiet mode');
      console.log('API Key available:', !!process.env.OPENAI_API_KEY);
      
      // Prepare CLI arguments
      const args = [
        '-q', // quiet mode
        prompt
      ];
      
      // Add model if specified
      if (parameters.model) {
        args.unshift('-m', parameters.model);
      }
      
      // Add approval mode
      if (parameters.approvalMode === 'full-auto') {
        args.unshift('--full-auto');
      } else if (parameters.approvalMode === 'auto-edit') {
        args.unshift('--auto-edit');
      }
      
      // Spawn Codex CLI process in quiet mode
      this.process = spawn('node', [codexCliPath, ...args], {
        cwd: parameters.workingDirectory || process.cwd(),
        env: { 
          ...process.env,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY,
          NO_COLOR: '1', // Disable color output for easier parsing
          CODEX_QUIET_MODE: '1'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.process.stdout) {
        reject(new Error('Failed to create process streams'));
        return;
      }

      // Create readline interface for parsing line-by-line output
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

      // Handle stdout (quiet mode output)
      this.rl.on('line', async (line) => {
        await this.handleCodexQuietModeOutput(jobId, line);
      });

      // In quiet mode, the CLI starts automatically with the provided prompt
      // No need to send additional input
    });
  }

  private async handleCodexQuietModeOutput(jobId: string, line: string): Promise<void> {
    // In quiet mode, the CLI outputs JSON messages
    console.log('Codex output:', line);
    
    try {
      const msg = JSON.parse(line);
      
      switch (msg.type) {
        case 'message':
          if (msg.role === 'assistant' && msg.content) {
            // Extract text from content array
            const text = msg.content
              .filter((c: any) => c.type === 'output_text')
              .map((c: any) => c.text)
              .join('');
            
            if (text) {
              await eventBus.emitEvent(jobId, EventType.AGENT_MESSAGE, {
                content: text
              });
            }
          }
          break;
          
        case 'reasoning':
          // Reasoning event - could show thinking indicator
          await eventBus.emitEvent(jobId, EventType.AGENT_THINKING, {
            message: 'Thinking...'
          });
          break;
          
        case 'function_call':
          // Function/tool call
          const toolName = msg.name || 'shell';
          const args = msg.arguments ? JSON.parse(msg.arguments) : {};
          const command = args.command ? 
            (Array.isArray(args.command) ? args.command.join(' ') : args.command) : 
            msg.name;
          
          await eventBus.emitEvent(jobId, EventType.TOOL_EXECUTING, {
            tool: toolName,
            command: command,
            context: 'Executing command'
          });
          break;
          
        case 'function_call_output':
          // Tool output
          if (msg.output) {
            await eventBus.emitEvent(jobId, EventType.STDOUT, {
              content: msg.output
            });
          }
          
          // Check for exit code in metadata
          const exitCode = msg.metadata?.exit_code ?? 0;
          await eventBus.emitEvent(jobId, EventType.TOOL_COMPLETED, {
            tool: 'shell',
            command: '',
            exitCode: exitCode
          });
          break;
          
        default:
          // Log unhandled message types
          console.log('Unhandled Codex message type:', msg.type, msg);
      }
    } catch (error) {
      // If not JSON, treat as plain text output
      if (line.trim()) {
        await eventBus.emitEvent(jobId, EventType.STDOUT, {
          content: line + '\n'
        });
      }
    }
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

}

// Create singleton instance
export const executor = new CodexExecutor();