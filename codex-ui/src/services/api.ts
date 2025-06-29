import axios from 'axios';
import { 
  CreateJobRequest, 
  CreateJobResponse, 
  GetJobResponse, 
  ListJobsResponse,
  Job,
  Event 
} from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth (if needed in future)
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);

export const jobsApi = {
  // Create a new job
  create: async (request: CreateJobRequest): Promise<CreateJobResponse> => {
    const { data } = await api.post<CreateJobResponse>('/jobs', request);
    return data;
  },

  // Get a specific job with events
  get: async (jobId: string): Promise<GetJobResponse> => {
    const { data } = await api.get<GetJobResponse>(`/jobs/${jobId}`);
    // Convert date strings to Date objects
    return {
      job: {
        ...data.job,
        createdAt: new Date(data.job.createdAt),
        startedAt: data.job.startedAt ? new Date(data.job.startedAt) : undefined,
        completedAt: data.job.completedAt ? new Date(data.job.completedAt) : undefined,
      },
      events: data.events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp),
      })),
    };
  },

  // List all jobs
  list: async (limit = 20, offset = 0): Promise<ListJobsResponse> => {
    const { data } = await api.get<ListJobsResponse>('/jobs', {
      params: { limit, offset }
    });
    // Convert date strings to Date objects
    return {
      ...data,
      jobs: data.jobs.map(job => ({
        ...job,
        createdAt: new Date(job.createdAt),
        startedAt: job.startedAt ? new Date(job.startedAt) : undefined,
        completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      })),
    };
  },

  // Cancel a job
  cancel: async (jobId: string): Promise<void> => {
    await api.post(`/jobs/${jobId}/cancel`);
  },

  // Get job events
  getEvents: async (jobId: string): Promise<Event[]> => {
    const { data } = await api.get<{ events: Event[] }>(`/jobs/${jobId}/events`);
    return data.events.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }));
  },
};

export default api;