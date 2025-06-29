import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';
import { Job, Event, ApprovalRequest, ApprovalResponse, EventType } from '../types';

export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    // Use a data directory for persistent storage
    const dataDir = path.join(__dirname, '../../data');
    this.dbPath = path.join(dataDir, 'codex.db');
  }

  async initialize(): Promise<void> {
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    await fs.mkdir(dataDir, { recursive: true });

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    await this.createTables();
    console.log(`Database initialized at: ${this.dbPath}`);
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Jobs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        parameters TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        started_at DATETIME,
        completed_at DATETIME,
        error TEXT
      )
    `);

    // Events table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id)
      )
    `);

    // Approvals table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        command TEXT,
        operation TEXT,
        context TEXT NOT NULL,
        decision TEXT,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME,
        FOREIGN KEY (job_id) REFERENCES jobs(id)
      )
    `);

    // Create indexes
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_job_id ON events(job_id);
      CREATE INDEX IF NOT EXISTS idx_approvals_job_id ON approvals(job_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    `);
  }

  // Job methods
  async createJob(job: Omit<Job, 'createdAt'>): Promise<Job> {
    if (!this.db) throw new Error('Database not initialized');

    const { id, prompt, parameters, status } = job;
    await this.db.run(
      `INSERT INTO jobs (id, prompt, parameters, status) VALUES (?, ?, ?, ?)`,
      [id, prompt, JSON.stringify(parameters), status]
    );

    return this.getJob(id) as Promise<Job>;
  }

  async getJob(id: string): Promise<Job | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get(
      `SELECT * FROM jobs WHERE id = ?`,
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      prompt: row.prompt,
      parameters: JSON.parse(row.parameters || '{}'),
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error
    };
  }

  async updateJobStatus(
    id: string, 
    status: Job['status'], 
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    let query = `UPDATE jobs SET status = ?`;
    const params: any[] = [status];

    if (status === 'running') {
      query += `, started_at = ?`;
      params.push(now);
    } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      query += `, completed_at = ?`;
      params.push(now);
    }

    if (error) {
      query += `, error = ?`;
      params.push(error);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    await this.db.run(query, params);
  }

  async listJobs(limit = 20, offset = 0): Promise<{ jobs: Job[], total: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const countResult = await this.db.get(`SELECT COUNT(*) as total FROM jobs`);
    const total = countResult.total;

    const rows = await this.db.all(
      `SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const jobs = rows.map(row => ({
      id: row.id,
      prompt: row.prompt,
      parameters: JSON.parse(row.parameters || '{}'),
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error
    }));

    return { jobs, total };
  }

  // Event methods
  async createEvent(event: Omit<Event, 'timestamp'>): Promise<Event> {
    if (!this.db) throw new Error('Database not initialized');

    const { id, jobId, type, data } = event;
    const timestamp = new Date();

    await this.db.run(
      `INSERT INTO events (id, job_id, type, data, timestamp) VALUES (?, ?, ?, ?, ?)`,
      [id, jobId, type, JSON.stringify(data), timestamp.toISOString()]
    );

    return { id, jobId, type, data, timestamp };
  }

  async getEvents(jobId: string): Promise<Event[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(
      `SELECT * FROM events WHERE job_id = ? ORDER BY timestamp ASC`,
      [jobId]
    );

    return rows.map(row => ({
      id: row.id,
      jobId: row.job_id,
      type: row.type as EventType,
      data: JSON.parse(row.data || '{}'),
      timestamp: new Date(row.timestamp)
    }));
  }

  // Approval methods
  async createApproval(approval: ApprovalRequest): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const { id, jobId, tool, command, operation, context } = approval;

    await this.db.run(
      `INSERT INTO approvals (id, job_id, tool, command, operation, context) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, jobId, tool, command, operation, context]
    );
  }

  async updateApproval(
    id: string, 
    decision: 'approve' | 'reject' | 'always',
    comment?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`Database: Updating approval ${id} with decision ${decision}`);
    
    const result = await this.db.run(
      `UPDATE approvals SET decision = ?, comment = ?, responded_at = ? WHERE id = ?`,
      [decision, comment, new Date().toISOString(), id]
    );
    
    console.log(`Database: Approval update result - changes: ${result.changes}`);
    
    if (result.changes === 0) {
      console.warn(`Database: No approval found with id ${id}`);
    }
  }

  async getApproval(id: string): Promise<ApprovalRequest | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get(
      `SELECT * FROM approvals WHERE id = ?`,
      [id]
    );

    if (!row) return null;

    return {
      id: row.id,
      jobId: row.job_id,
      tool: row.tool,
      command: row.command,
      operation: row.operation,
      context: row.context,
      createdAt: new Date(row.created_at)
    };
  }

  async getPendingApproval(jobId: string): Promise<ApprovalRequest | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.get(
      `SELECT * FROM approvals WHERE job_id = ? AND decision IS NULL ORDER BY created_at DESC LIMIT 1`,
      [jobId]
    );

    if (!row) return null;

    return {
      id: row.id,
      jobId: row.job_id,
      tool: row.tool,
      command: row.command,
      operation: row.operation,
      context: row.context,
      createdAt: new Date(row.created_at)
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
export const db = new DatabaseService();

// Initialize database if run directly
if (require.main === module) {
  (async () => {
    const command = process.argv[2];
    if (command === 'init') {
      console.log('Initializing database...');
      await db.initialize();
      console.log('Database initialized successfully');
      await db.close();
    }
  })();
}