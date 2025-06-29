-- Migration to add project_id to jobs table
ALTER TABLE jobs ADD COLUMN project_id TEXT;

-- Create index for project_id
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);

-- Create projects table to track project metadata
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for project lookups
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);