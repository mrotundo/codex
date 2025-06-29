// Shared types for the Codex server

export interface JobParameters {
  model?: string;
  approvalMode?: 'suggest' | 'auto-edit' | 'full-auto';
  workingDirectory?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  context?: {
    projectType?: string;
    additionalInstructions?: string;
  };
}

export interface Job {
  id: string;
  prompt: string;
  parameters: JobParameters;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export enum EventType {
  // Lifecycle events
  JOB_STARTED = 'job.started',
  JOB_COMPLETED = 'job.completed',
  JOB_FAILED = 'job.failed',
  JOB_CANCELLED = 'job.cancelled',
  
  // Agent events
  AGENT_THINKING = 'agent.thinking',
  AGENT_MESSAGE = 'agent.message',
  
  // Tool events
  TOOL_EXECUTING = 'tool.executing',
  TOOL_COMPLETED = 'tool.completed',
  TOOL_FAILED = 'tool.failed',
  
  // Approval events
  APPROVAL_REQUIRED = 'approval.required',
  APPROVAL_RECEIVED = 'approval.received',
  
  // Output events
  STDOUT = 'output.stdout',
  STDERR = 'output.stderr',
  FILE_CHANGED = 'file.changed',
  
  // Progress events
  PROGRESS_UPDATE = 'progress.update'
}

export interface Event {
  id: string;
  jobId: string;
  type: EventType;
  data: any;
  timestamp: Date;
}

export interface ApprovalRequest {
  id: string;
  jobId: string;
  tool: string;
  command?: string;
  operation?: string;
  context: string;
  createdAt: Date;
}

export interface ApprovalResponse {
  approvalId: string;
  decision: 'approve' | 'reject' | 'always';
  comment?: string;
  respondedAt: Date;
}

// WebSocket message types
export interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'approval_response' | 'cancel_job' | 'ping';
  jobId?: string;
  data?: any;
}

export interface ServerMessage {
  type: 'event' | 'approval_request' | 'connection_ack' | 'error' | 'pong';
  jobId?: string;
  data: any;
}

// API request/response types
export interface CreateJobRequest {
  prompt: string;
  parameters?: JobParameters;
}

export interface CreateJobResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

export interface GetJobResponse {
  job: Job;
  events: Event[];
}

export interface ListJobsResponse {
  jobs: Job[];
  total: number;
}