import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { db } from '../../services/database';
import { executor } from '../../services/executor';
import { CreateJobRequest, CreateJobResponse, GetJobResponse, ListJobsResponse } from '../../types';

const router = Router();

// Validation schemas
const createJobSchema = z.object({
  prompt: z.string().min(1).max(10000),
  projectId: z.string().optional(),
  parameters: z.object({
    model: z.string().optional(),
    approvalMode: z.enum(['suggest', 'auto-edit', 'full-auto']).optional(),
    workingDirectory: z.string().optional(),
    reasoningEffort: z.enum(['low', 'medium', 'high']).optional(),
    context: z.object({
      projectType: z.string().optional(),
      additionalInstructions: z.string().optional()
    }).optional()
  }).optional()
});

// Create a new job
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = createJobSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: result.error.flatten() 
      });
    }

    const { prompt, projectId: userProjectId, parameters = {} } = result.data;

    // Create job
    const jobId = uuidv4();
    
    // Use provided project ID or generate one
    const projectId = userProjectId || `project-${jobId.substring(0, 8)}`;
    
    const job = await db.createJob({
      id: jobId,
      prompt,
      parameters: { ...parameters, projectId },
      projectId,
      status: 'queued'
    });

    // Start execution asynchronously
    executor.execute(jobId, prompt, { ...parameters, projectId }).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
    });

    const response: CreateJobResponse = {
      jobId: job.id,
      projectId: projectId,
      status: job.status,
      createdAt: job.createdAt.toISOString()
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific job
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    
    const job = await db.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const events = await db.getEvents(jobId);

    const response: GetJobResponse = {
      job,
      events
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all jobs
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { jobs, total } = await db.listJobs(limit, offset);

    const response: ListJobsResponse = {
      jobs,
      total
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a job
router.post('/jobs/:id/cancel', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    
    const job = await db.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'running') {
      return res.status(400).json({ error: 'Job is not running' });
    }

    // Cancel execution
    executor.cancel();
    await db.updateJobStatus(jobId, 'cancelled');

    res.json({ message: 'Job cancelled' });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get job events
router.get('/jobs/:id/events', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    
    const job = await db.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const events = await db.getEvents(jobId);
    res.json({ events });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List projects
router.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await db.listProjects();
    res.json({ projects });
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;