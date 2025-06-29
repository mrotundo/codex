#!/usr/bin/env node

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs').promises;

async function migrate() {
  console.log('Running database migrations...');
  
  const dbPath = path.join(__dirname, 'data', 'codex.db');
  
  // Ensure data directory exists
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  try {
    // Check if project_id column exists
    const columns = await db.all(`PRAGMA table_info(jobs)`);
    const hasProjectId = columns.some(col => col.name === 'project_id');
    
    if (!hasProjectId) {
      console.log('Adding project_id column to jobs table...');
      await db.exec(`ALTER TABLE jobs ADD COLUMN project_id TEXT`);
      console.log('✓ Added project_id column');
    }
    
    // Check if projects table exists
    const tables = await db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`);
    const hasProjectsTable = tables.length > 0;
    
    if (!hasProjectsTable) {
      console.log('Creating projects table...');
      await db.exec(`
        CREATE TABLE projects (
          id TEXT PRIMARY KEY,
          name TEXT,
          path TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created projects table');
    }
    
    // Create indexes if they don't exist
    const indexes = await db.all(`SELECT name FROM sqlite_master WHERE type='index'`);
    const indexNames = indexes.map(idx => idx.name);
    
    if (!indexNames.includes('idx_jobs_project_id')) {
      console.log('Creating project_id index...');
      await db.exec(`CREATE INDEX idx_jobs_project_id ON jobs(project_id)`);
      console.log('✓ Created project_id index');
    }
    
    if (!indexNames.includes('idx_projects_name')) {
      console.log('Creating projects name index...');
      await db.exec(`CREATE INDEX idx_projects_name ON projects(name)`);
      console.log('✓ Created projects name index');
    }
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  });
}

module.exports = { migrate };