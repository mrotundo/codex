#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const oldDbPath = path.join(__dirname, 'database/codex.db');
const newDataDir = path.join(__dirname, 'data');
const newDbPath = path.join(newDataDir, 'codex.db');

async function migrateDatabase() {
  console.log('Database Migration Tool');
  console.log('======================');
  
  // Check if old database exists
  if (!fs.existsSync(oldDbPath)) {
    console.log('No existing database found at old location. Nothing to migrate.');
    return;
  }

  // Check if new database already exists
  if (fs.existsSync(newDbPath)) {
    console.log(`Database already exists at new location: ${newDbPath}`);
    console.log('Migration skipped to avoid overwriting existing data.');
    return;
  }

  // Create data directory if it doesn't exist
  if (!fs.existsSync(newDataDir)) {
    fs.mkdirSync(newDataDir, { recursive: true });
    console.log(`Created data directory: ${newDataDir}`);
  }

  // Copy database to new location
  try {
    fs.copyFileSync(oldDbPath, newDbPath);
    console.log(`Successfully migrated database from:`);
    console.log(`  ${oldDbPath}`);
    console.log(`to:`);
    console.log(`  ${newDbPath}`);
    
    console.log('\nYou can now safely delete the old database directory if desired.');
  } catch (error) {
    console.error('Error migrating database:', error.message);
    process.exit(1);
  }
}

migrateDatabase();