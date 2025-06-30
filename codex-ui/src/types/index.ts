// Mirror of backend types for frontend use

export interface JobParameters {
  model?: string;
  approvalMode?: 'suggest' | 'auto-edit' | 'full-auto' | 'auto' | 'manual';
  workingDirectory?: string;
  projectId?: string;
  reasoningEffort?: 'low' | 'medium' | 'high';
  context?: {
    projectType?: string;
    additionalInstructions?: string;
  };
  lastResponseId?: string;
}

export interface Job {
  id: string;
  prompt: string;
  parameters: JobParameters;
  projectId?: string;
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
  AGENT_INPUT_REQUIRED = 'agent.input_required',
  
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
  approvalId: string;
  tool: string;
  command?: string;
  operation?: string;
  context: string;
}

export interface UserInputRequest {
  inputId: string;
  prompt: string;
  context?: string;
}

// WebSocket message types
export interface ClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'approval_response' | 'cancel_job' | 'ping' | 'user_response';
  jobId?: string;
  data?: any;
}

export interface ServerMessage {
  type: 'event' | 'approval_request' | 'user_input_request' | 'connection_ack' | 'error' | 'pong';
  jobId?: string;
  data: any;
}

// API types
export interface CreateJobRequest {
  prompt: string;
  projectId?: string;
  parameters?: JobParameters;
}

export interface CreateJobResponse {
  jobId: string;
  projectId: string;
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