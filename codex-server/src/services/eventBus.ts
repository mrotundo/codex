import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, ServerMessage, ApprovalRequest, UserInputRequest } from '../types';
import { db } from './database';

export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Support many WebSocket connections
  }

  async emitEvent(jobId: string, type: EventType, data: any): Promise<void> {
    const event: Event = {
      id: uuidv4(),
      jobId,
      type,
      data,
      timestamp: new Date()
    };

    console.log(`[EventBus] Emitting event:`, {
      eventId: event.id,
      jobId: event.jobId,
      type: event.type,
      dataKeys: data ? Object.keys(data) : [],
      timestamp: event.timestamp
    });

    // Store event in database
    await db.createEvent(event);
    console.log(`[EventBus] Event stored in database`);

    // Emit to WebSocket listeners
    const jobEventListeners = this.listenerCount('job-event');
    console.log(`[EventBus] Emitting to ${jobEventListeners} 'job-event' listeners`);
    super.emit('job-event', event);

    // Emit job-specific event
    const jobSpecificListeners = this.listenerCount(`job-${jobId}`);
    console.log(`[EventBus] Emitting to ${jobSpecificListeners} 'job-${jobId}' listeners`);
    super.emit(`job-${jobId}`, event);

    return;
  }

  async emitApprovalRequest(
    jobId: string,
    tool: string,
    context: string,
    command?: string,
    operation?: string
  ): Promise<string> {
    const approvalId = uuidv4();
    const approval: ApprovalRequest = {
      id: approvalId,
      jobId,
      tool,
      command,
      operation,
      context,
      createdAt: new Date()
    };

    // Store approval request
    await db.createApproval(approval);

    // Emit approval event
    await this.emitEvent(jobId, EventType.APPROVAL_REQUIRED, {
      approvalId,
      tool,
      command,
      operation,
      context
    });

    return approvalId;
  }

  subscribeToJob(jobId: string, callback: (event: Event) => void): () => void {
    this.on(`job-${jobId}`, callback);
    
    // Return unsubscribe function
    return () => {
      this.off(`job-${jobId}`, callback);
    };
  }

  subscribeToAllJobs(callback: (event: Event) => void): () => void {
    this.on('job-event', callback);
    
    // Return unsubscribe function
    return () => {
      this.off('job-event', callback);
    };
  }

  async waitForApproval(approvalId: string, timeout = 300000): Promise<string> {
    console.log(`EventBus: Setting up approval listener for ${approvalId}`);
    
    return new Promise((resolve, reject) => {
      const handler = (decision: string) => {
        console.log(`EventBus: Approval handler called with decision: ${decision}`);
        clearTimeout(timer);
        resolve(decision);
      };

      // Set up listener FIRST
      this.once(`approval-${approvalId}`, handler);
      console.log(`EventBus: Listener registered for approval-${approvalId}`);

      const timer = setTimeout(() => {
        console.log(`EventBus: Approval timeout for ${approvalId}`);
        this.off(`approval-${approvalId}`, handler);
        reject(new Error('Approval timeout'));
      }, timeout);
    });
  }

  notifyApprovalDecision(approvalId: string, decision: string): void {
    console.log(`EventBus: Notifying approval decision for ${approvalId}: ${decision}`);
    const hasListeners = this.listenerCount(`approval-${approvalId}`) > 0;
    console.log(`EventBus: Has listeners for approval-${approvalId}: ${hasListeners}`);
    super.emit(`approval-${approvalId}`, decision);
  }

  async emitUserInputRequest(
    jobId: string,
    prompt: string,
    context?: string
  ): Promise<string> {
    const inputId = uuidv4();
    const inputRequest: UserInputRequest = {
      inputId,
      prompt,
      context
    };

    // Emit user input request event
    await this.emitEvent(jobId, EventType.AGENT_INPUT_REQUIRED, inputRequest);

    return inputId;
  }

  async waitForUserResponse(inputId: string, timeout = 300000): Promise<string> {
    console.log(`EventBus: Setting up user input listener for ${inputId}`);
    
    return new Promise((resolve, reject) => {
      const handler = (response: string) => {
        console.log(`EventBus: User input handler called with response`);
        clearTimeout(timer);
        resolve(response);
      };

      // Set up listener FIRST
      this.once(`user-input-${inputId}`, handler);
      console.log(`EventBus: Listener registered for user-input-${inputId}`);

      const timer = setTimeout(() => {
        console.log(`EventBus: User input timeout for ${inputId}`);
        this.off(`user-input-${inputId}`, handler);
        reject(new Error('User input timeout'));
      }, timeout);
    });
  }

  notifyUserResponse(inputId: string, response: string): void {
    console.log(`EventBus: Notifying user response for ${inputId}`);
    const hasListeners = this.listenerCount(`user-input-${inputId}`) > 0;
    console.log(`EventBus: Has listeners for user-input-${inputId}: ${hasListeners}`);
    super.emit(`user-input-${inputId}`, response);
  }
}

// Create singleton instance
export const eventBus = new EventBus();