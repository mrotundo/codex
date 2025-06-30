import { create } from 'zustand';
import { Job, Event, ApprovalRequest, UserInputRequest } from '../types';
import { jobsApi } from '../services/api';
import { wsClient } from '../services/websocket';

interface JobState {
  // Current job
  currentJob: Job | null;
  events: Event[];
  pendingApproval: ApprovalRequest | null;
  pendingUserInput: UserInputRequest | null;
  
  // Job list
  jobs: Job[];
  totalJobs: number;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions
  createJob: (prompt: string, projectId?: string, parameters?: any) => Promise<string>;
  loadJob: (jobId: string) => Promise<void>;
  loadJobs: (limit?: number, offset?: number) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  
  // WebSocket actions
  connectToJob: (jobId: string) => void;
  disconnectFromJob: () => void;
  handleApproval: (decision: 'approve' | 'reject' | 'always', comment?: string) => void;
  handleUserResponse: (response: string) => void;
  
  // Event handlers
  addEvent: (event: Event) => void;
  setPendingApproval: (approval: ApprovalRequest | null) => void;
  setPendingUserInput: (input: UserInputRequest | null) => void;
  setConnected: (connected: boolean) => void;
  clearError: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  // Initial state
  currentJob: null,
  events: [],
  pendingApproval: null,
  pendingUserInput: null,
  jobs: [],
  totalJobs: 0,
  isLoading: false,
  error: null,
  isConnected: false,

  // Create a new job
  createJob: async (prompt: string, projectId?: string, parameters?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobsApi.create({ prompt, projectId, parameters });
      return response.jobId;
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Load a specific job
  loadJob: async (jobId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobsApi.get(jobId);
      set({ 
        currentJob: response.job, 
        events: response.events,
        pendingApproval: null 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Load job list
  loadJobs: async (limit = 20, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await jobsApi.list(limit, offset);
      set({ 
        jobs: response.jobs, 
        totalJobs: response.total 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Cancel a job
  cancelJob: async (jobId: string) => {
    try {
      await jobsApi.cancel(jobId);
      wsClient.cancelJob(jobId);
      
      // Update local state
      set(state => ({
        currentJob: state.currentJob?.id === jobId 
          ? { ...state.currentJob, status: 'cancelled' }
          : state.currentJob,
        jobs: state.jobs.map(job => 
          job.id === jobId ? { ...job, status: 'cancelled' as const } : job
        )
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || error.message });
      throw error;
    }
  },

  // Connect to job via WebSocket
  connectToJob: (jobId: string) => {
    console.log(`[JobStore] Connecting to job ${jobId}`);
    
    // Setup WebSocket message handler
    const unsubscribeMessage = wsClient.onMessage((message) => {
      console.log(`[JobStore] Received message:`, {
        type: message.type,
        jobId: message.jobId,
        hasData: !!message.data
      });
      
      switch (message.type) {
        case 'event':
          if (message.data) {
            console.log(`[JobStore] Processing event:`, {
              eventType: message.data.type,
              eventId: message.data.id,
              jobId: message.data.jobId
            });
            get().addEvent(message.data);
            
            // Update job status based on events
            if (message.data.type === 'job.completed' || 
                message.data.type === 'job.failed' ||
                message.data.type === 'job.cancelled') {
              const status = message.data.type.split('.')[1] as Job['status'];
              console.log(`[JobStore] Updating job status to: ${status}`);
              set(state => ({
                currentJob: state.currentJob 
                  ? { ...state.currentJob, status, completedAt: new Date() }
                  : null
              }));
            } else if (message.data.type === 'job.started') {
              console.log(`[JobStore] Updating job status to: running`);
              set(state => ({
                currentJob: state.currentJob 
                  ? { ...state.currentJob, status: 'running', startedAt: new Date() }
                  : null
              }));
            }
          }
          break;
          
        case 'approval_request':
          console.log(`[JobStore] Received approval request`);
          set({ pendingApproval: message.data });
          break;
          
        case 'user_input_request':
          console.log(`[JobStore] Received user input request`);
          set({ pendingUserInput: message.data });
          break;
          
        case 'connection_ack':
          console.log('[JobStore] Connected to job:', message.data);
          break;
          
        case 'error':
          console.error('[JobStore] Error:', message.data.error);
          set({ error: message.data.error });
          break;
          
        default:
          console.warn(`[JobStore] Unknown message type: ${message.type}`);
      }
    });

    // Setup connection status handler
    const unsubscribeConnection = wsClient.onConnectionChange((connected) => {
      set({ isConnected: connected });
    });

    // Connect and subscribe
    console.log(`[JobStore] Calling wsClient.connect with jobId: ${jobId}`);
    wsClient.connect(jobId);

    // Store unsubscribe functions for cleanup
    (window as any).__wsUnsubscribe = () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  },

  // Disconnect from job
  disconnectFromJob: () => {
    if (get().currentJob) {
      wsClient.unsubscribe(get().currentJob!.id);
    }
    
    // Cleanup subscriptions
    if ((window as any).__wsUnsubscribe) {
      (window as any).__wsUnsubscribe();
      delete (window as any).__wsUnsubscribe;
    }
    
    set({ isConnected: false });
  },

  // Handle approval response
  handleApproval: (decision: 'approve' | 'reject' | 'always', comment?: string) => {
    const { currentJob, pendingApproval } = get();
    
    if (!currentJob || !pendingApproval) {
      console.error('Cannot handle approval: currentJob or pendingApproval is missing');
      return;
    }
    
    console.log(`Sending approval response: jobId=${currentJob.id}, approvalId=${pendingApproval.approvalId}, decision=${decision}`);
    
    wsClient.sendApprovalResponse(
      currentJob.id,
      pendingApproval.approvalId,
      decision,
      comment
    );
    
    // Clear pending approval
    set({ pendingApproval: null });
  },

  // Handle user response
  handleUserResponse: (response: string) => {
    const { currentJob, pendingUserInput } = get();
    
    if (!currentJob || !pendingUserInput) {
      console.error('Cannot handle user response: currentJob or pendingUserInput is missing');
      return;
    }
    
    console.log(`Sending user response: jobId=${currentJob.id}, inputId=${pendingUserInput.inputId}`);
    
    wsClient.sendUserResponse(
      currentJob.id,
      pendingUserInput.inputId,
      response
    );
    
    // Clear pending user input
    set({ pendingUserInput: null });
  },

  // Add event to the list
  addEvent: (event: Event) => {
    console.log(`[JobStore] Adding event to state:`, {
      eventType: event.type,
      eventId: event.id,
      currentEventCount: get().events.length
    });
    set(state => ({
      events: [...state.events, event]
    }));
    console.log(`[JobStore] Event added, total events: ${get().events.length}`);
  },

  // Set pending approval
  setPendingApproval: (approval: ApprovalRequest | null) => {
    set({ pendingApproval: approval });
  },

  // Set pending user input
  setPendingUserInput: (input: UserInputRequest | null) => {
    set({ pendingUserInput: input });
  },

  // Set connection status
  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));