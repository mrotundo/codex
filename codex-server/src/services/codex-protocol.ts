// Codex Protocol Types based on protocol_v1.md

export interface Submission {
  sub_id: string;
  op: Op;
}

export interface Event {
  sub_id: string;
  msg: EventMsg;
}

// Op variants (UI -> Codex)
export type Op = 
  | { type: 'ConfigureSession'; config: SessionConfig }
  | { type: 'UserInput'; input: string; last_response_id?: string }
  | { type: 'Interrupt' }
  | { type: 'ExecApproval'; approval: ExecApprovalDecision }
  | { type: 'PatchApproval'; approval: PatchApprovalDecision };

export interface SessionConfig {
  model?: string;
  approval_mode?: 'auto' | 'manual' | 'review';
  working_directory?: string;
  instructions_filepath?: string;
}

export type ExecApprovalDecision = 
  | { type: 'Allow' }
  | { type: 'Deny' }
  | { type: 'AlwaysAllow' };

export type PatchApprovalDecision = 
  | { type: 'Allow' }
  | { type: 'Deny' };

// EventMsg variants (Codex -> UI)
export type EventMsg =
  | { type: 'SessionConfigured' }
  | { type: 'TaskStarted' }
  | { type: 'TaskComplete'; response_id: string }
  | { type: 'TurnComplete'; response_id: string }
  | { type: 'Error'; error: string }
  | { type: 'AgentMessage'; content: string }
  | { type: 'AgentThinking'; thinking: string }
  | { type: 'ExecApprovalRequest'; id: string; command: string; context?: string }
  | { type: 'PatchApprovalRequest'; id: string; patch: string; path: string }
  | { type: 'ExecStart'; command: string }
  | { type: 'ExecStop'; exit_code: number }
  | { type: 'ExecOutput'; output: string; stream: 'stdout' | 'stderr' }
  | { type: 'PatchApplied'; path: string }
  | { type: 'FileChanged'; path: string; action: 'created' | 'modified' | 'deleted' };

// Helper functions
export function createSubmission(sub_id: string, op: Op): Submission {
  return { sub_id, op };
}

export function parseEvent(line: string): Event | null {
  try {
    return JSON.parse(line) as Event;
  } catch {
    return null;
  }
}

export function stringifySubmission(submission: Submission): string {
  return JSON.stringify(submission) + '\n';
}