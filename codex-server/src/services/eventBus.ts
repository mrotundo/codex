import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, ServerMessage, ApprovalRequest } from '../types';
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

    // Store event in database
    await db.createEvent(event);

    // Emit to WebSocket listeners
    super.emit('job-event', event);

    // Emit job-specific event
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
}

// Create singleton instance
export const eventBus = new EventBus();