import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { ClientMessage, ServerMessage, Event } from '../types';
import { eventBus } from '../services/eventBus';
import { db } from '../services/database';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  jobId?: string;
  isAlive: boolean;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private jobSubscriptions: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocketServer();
    this.setupEventListeners();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        isAlive: true
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId}`);

      // Setup ping-pong for connection health
      ws.on('pong', () => {
        client.isAlive = true;
      });

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          const messageStr = data.toString();
          console.log(`WebSocket received from client ${clientId}:`, messageStr);
          const message: ClientMessage = JSON.parse(messageStr);
          await this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });
    });
  }

  private async handleClientMessage(clientId: string, message: ClientMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Handling message type: ${message.type} from client ${clientId}`);

    switch (message.type) {
      case 'subscribe':
        if (message.jobId) {
          await this.handleSubscribe(clientId, message.jobId);
        }
        break;

      case 'unsubscribe':
        if (message.jobId) {
          this.handleUnsubscribe(clientId, message.jobId);
        }
        break;

      case 'approval_response':
        if (message.data) {
          await this.handleApprovalResponse(message.data);
        }
        break;

      case 'cancel_job':
        if (message.jobId) {
          await this.handleCancelJob(message.jobId);
        }
        break;

      case 'user_response':
        if (message.data) {
          await this.handleUserResponse(message.data);
        }
        break;

      case 'ping':
        this.sendMessage(client.ws, { type: 'pong', data: {} });
        break;

      default:
        this.sendError(client.ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleSubscribe(clientId: string, jobId: string): Promise<void> {
    console.log(`[WebSocket] handleSubscribe called - clientId: ${clientId}, jobId: ${jobId}`);
    
    const client = this.clients.get(clientId);
    if (!client) {
      console.log(`[WebSocket] Client ${clientId} not found in handleSubscribe`);
      return;
    }

    // Check if job exists
    const job = await db.getJob(jobId);
    console.log(`[WebSocket] Job lookup result:`, job ? { id: job.id, status: job.status } : 'null');
    
    if (!job) {
      console.log(`[WebSocket] Job ${jobId} not found, sending error`);
      this.sendError(client.ws, 'Job not found');
      return;
    }

    // Store subscription
    client.jobId = jobId;
    if (!this.jobSubscriptions.has(jobId)) {
      this.jobSubscriptions.set(jobId, new Set());
    }
    this.jobSubscriptions.get(jobId)!.add(clientId);

    // Send acknowledgment with current job status
    this.sendMessage(client.ws, {
      type: 'connection_ack',
      data: {
        jobId,
        status: job.status,
        connectedAt: new Date().toISOString()
      }
    });

    // Send any existing events
    const events = await db.getEvents(jobId);
    console.log(`[WebSocket] Sending ${events.length} existing events to client ${clientId}`);
    
    for (const event of events) {
      console.log(`[WebSocket] Sending existing event:`, {
        eventId: event.id,
        eventType: event.type,
        jobId: event.jobId
      });
      
      this.sendMessage(client.ws, {
        type: 'event',
        jobId,
        data: event
      });
    }

    // Check for pending approvals
    const pendingApproval = await db.getPendingApproval(jobId);
    if (pendingApproval) {
      this.sendMessage(client.ws, {
        type: 'approval_request',
        jobId,
        data: {
          approvalId: pendingApproval.id,
          tool: pendingApproval.tool,
          command: pendingApproval.command,
          operation: pendingApproval.operation,
          context: pendingApproval.context
        }
      });
    }

    console.log(`Client ${clientId} subscribed to job ${jobId}`);
  }

  private handleUnsubscribe(clientId: string, jobId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const subscribers = this.jobSubscriptions.get(jobId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.jobSubscriptions.delete(jobId);
      }
    }

    client.jobId = undefined;
    console.log(`Client ${clientId} unsubscribed from job ${jobId}`);
  }

  private async handleApprovalResponse(data: any): Promise<void> {
    const { approvalId, decision, comment } = data;
    
    console.log(`Received approval response: approvalId=${approvalId}, decision=${decision}, comment=${comment}`);

    try {
      // Update database
      await db.updateApproval(approvalId, decision, comment);
      console.log(`Database updated for approval ${approvalId}`);
    } catch (error) {
      console.error(`Error updating approval in database:`, error);
    }

    // Notify the executor (do this even if DB update fails)
    eventBus.notifyApprovalDecision(approvalId, decision);
    
    console.log(`Approval decision notified to executor for approvalId: ${approvalId}`);
  }

  private async handleCancelJob(jobId: string): Promise<void> {
    // This would trigger job cancellation
    // For now, we'll just update the status
    await db.updateJobStatus(jobId, 'cancelled');
  }

  private async handleUserResponse(data: any): Promise<void> {
    const { inputId, response } = data;
    
    console.log(`Received user response: inputId=${inputId}, response=${response}`);

    // Notify the executor
    eventBus.notifyUserResponse(inputId, response);
    
    console.log(`User response notified to executor for inputId: ${inputId}`);
  }

  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all subscriptions
    if (client.jobId) {
      const subscribers = this.jobSubscriptions.get(client.jobId);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.jobSubscriptions.delete(client.jobId);
        }
      }
    }

    this.clients.delete(clientId);
    console.log(`WebSocket client disconnected: ${clientId}`);
  }

  private setupEventListeners(): void {
    // Listen for all job events
    eventBus.subscribeToAllJobs((event: Event) => {
      console.log(`[WebSocket] Event received from eventBus:`, {
        eventId: event.id,
        jobId: event.jobId,
        type: event.type,
        timestamp: event.timestamp,
        dataKeys: event.data ? Object.keys(event.data) : []
      });
      
      const subscribers = this.jobSubscriptions.get(event.jobId);
      console.log(`[WebSocket] Job ${event.jobId} has ${subscribers?.size || 0} subscribers`);
      
      if (!subscribers || subscribers.size === 0) {
        console.log(`[WebSocket] No subscribers for job ${event.jobId}, skipping event`);
        return;
      }

      const message: ServerMessage = {
        type: 'event',
        jobId: event.jobId,
        data: event
      };

      // Special handling for approval requests
      if (event.type === 'approval.required') {
        console.log(`[WebSocket] Processing approval request event`);
        const approvalMessage: ServerMessage = {
          type: 'approval_request',
          jobId: event.jobId,
          data: event.data
        };

        for (const clientId of subscribers) {
          const client = this.clients.get(clientId);
          if (client) {
            console.log(`[WebSocket] Sending approval request to client ${clientId}`);
            this.sendMessage(client.ws, approvalMessage);
          } else {
            console.log(`[WebSocket] Client ${clientId} not found in clients map`);
          }
        }
      } else if (event.type === 'agent.input_required') {
        console.log(`[WebSocket] Processing user input request event`);
        const inputMessage: ServerMessage = {
          type: 'user_input_request',
          jobId: event.jobId,
          data: event.data
        };

        for (const clientId of subscribers) {
          const client = this.clients.get(clientId);
          if (client) {
            console.log(`[WebSocket] Sending user input request to client ${clientId}`);
            this.sendMessage(client.ws, inputMessage);
          } else {
            console.log(`[WebSocket] Client ${clientId} not found in clients map`);
          }
        }
      } else {
        // Send regular event to all subscribers
        console.log(`[WebSocket] Sending event type ${event.type} to ${subscribers.size} subscribers`);
        for (const clientId of subscribers) {
          const client = this.clients.get(clientId);
          if (client) {
            console.log(`[WebSocket] Sending event to client ${clientId}`);
            this.sendMessage(client.ws, message);
          } else {
            console.log(`[WebSocket] Client ${clientId} not found in clients map`);
          }
        }
      }
    });
  }

  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log(`[WebSocket] Sending message to client:`, {
        type: message.type,
        jobId: message.jobId,
        messageLength: messageStr.length,
        preview: messageStr.substring(0, 200) + (messageStr.length > 200 ? '...' : '')
      });
      ws.send(messageStr);
    } else {
      console.log(`[WebSocket] Cannot send message, WebSocket state is ${ws.readyState} (not OPEN)`);
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error }
    });
  }

  private startHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = Array.from(this.clients.values()).find(c => c.ws === ws);
        if (!client) return;

        if (!client.isAlive) {
          console.log(`Client ${client.id} failed heartbeat, terminating`);
          ws.terminate();
          this.handleDisconnect(client.id);
          return;
        }

        client.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }
}

export function setupWebSocket(server: Server): WebSocketHandler {
  return new WebSocketHandler(server);
}