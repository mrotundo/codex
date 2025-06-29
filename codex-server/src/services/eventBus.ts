import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, ServerMessage, ApprovalRequest } from '../types';
import { db } from './database';

export class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Support many WebSocket connections
  }

  async emit(jobId: string, type: EventType, data: any): Promise<void> {
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
    command?: string,
    operation?: string,
    context: string
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
    await this.emit(jobId, EventType.APPROVAL_REQUIRED, {
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
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(`approval-${approvalId}`, handler);
        reject(new Error('Approval timeout'));
      }, timeout);

      const handler = (decision: string) => {
        clearTimeout(timer);
        resolve(decision);
      };

      this.once(`approval-${approvalId}`, handler);
    });
  }

  notifyApprovalDecision(approvalId: string, decision: string): void {
    this.emit(`approval-${approvalId}`, decision);
  }
}

// Create singleton instance
export const eventBus = new EventBus();