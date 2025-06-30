import { ClientMessage, ServerMessage, Event } from '../types';

type MessageHandler = (message: ServerMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the backend port directly for WebSocket connection
    const host = window.location.hostname + ':4133';
    this.url = `${protocol}//${host}/ws`;
    console.log('[WebSocket Client] Initialized with URL:', this.url);
  }

  connect(jobId?: string): void {
    console.log(`[WebSocket Client] Connect called with jobId: ${jobId}`);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket Client] Already connected, subscribing to job');
      if (jobId) {
        this.subscribe(jobId);
      }
      return;
    }

    console.log('[WebSocket Client] Creating new WebSocket connection');
    this.isIntentionallyClosed = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WebSocket Client] WebSocket opened successfully');
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);
      this.startPingInterval();

      if (jobId) {
        console.log(`[WebSocket Client] Subscribing to job ${jobId} after connection`);
        this.subscribe(jobId);
      }
    };

    this.ws.onmessage = (event) => {
      console.log('[WebSocket Client] Raw message received:', event.data);
      try {
        const message: ServerMessage = JSON.parse(event.data);
        console.log('[WebSocket Client] Parsed message:', {
          type: message.type,
          jobId: message.jobId,
          hasData: !!message.data,
          dataKeys: message.data ? Object.keys(message.data) : []
        });
        this.handleMessage(message);
      } catch (error) {
        console.error('[WebSocket Client] Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.notifyConnectionHandlers(false);
      this.stopPingInterval();

      if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(jobId: string): void {
    console.log(`[WebSocket Client] Subscribing to job ${jobId}`);
    this.send({
      type: 'subscribe',
      jobId
    });
  }

  unsubscribe(jobId: string): void {
    this.send({
      type: 'unsubscribe',
      jobId
    });
  }

  sendApprovalResponse(jobId: string, approvalId: string, decision: 'approve' | 'reject' | 'always', comment?: string): void {
    this.send({
      type: 'approval_response',
      jobId,
      data: {
        approvalId,
        decision,
        comment
      }
    });
  }

  sendUserResponse(jobId: string, inputId: string, response: string): void {
    this.send({
      type: 'user_response',
      jobId,
      data: {
        inputId,
        response
      }
    });
  }

  cancelJob(jobId: string): void {
    this.send({
      type: 'cancel_job',
      jobId
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    // Immediately notify of current connection state
    handler(this.isConnected());
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log('WebSocket sending message:', messageStr);
      this.ws.send(messageStr);
    } else {
      console.warn('WebSocket is not connected, cannot send message:', message);
    }
  }

  private handleMessage(message: ServerMessage): void {
    console.log(`[WebSocket Client] Handling message, notifying ${this.messageHandlers.size} handlers`);
    this.messageHandlers.forEach((handler, index) => {
      try {
        console.log(`[WebSocket Client] Calling handler ${index + 1}/${this.messageHandlers.size}`);
        handler(message);
      } catch (error) {
        console.error('[WebSocket Client] Error in message handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Create singleton instance
export const wsClient = new WebSocketClient();