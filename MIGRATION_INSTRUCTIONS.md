# Database Migration Instructions

If you encounter the error `SQLITE_ERROR: no such column: project_id`, follow these steps:

## Automatic Migration (Recommended)

The server now automatically runs migrations on startup. Simply restart the server:

```bash
./start-servers.sh
```

## Manual Migration

If you need to run the migration manually:

```bash
cd codex-server
npm run db:migrate
```

This will:
1. Add the `project_id` column to the `jobs` table
2. Create the `projects` table
3. Create necessary indexes

## What Changed

The database schema was updated to support project management:

### Jobs Table
- Added `project_id` column (TEXT, nullable)

### Projects Table (new)
- `id` - Project ID (primary key)
- `name` - Project display name
- `path` - Filesystem path
- `created_at` - Creation timestamp
- `last_accessed` - Last access timestamp

## Verification

After migration, you can verify the schema:

```bash
cd codex-server
sqlite3 data/codex.db ".schema"
```

You should see the `project_id` column in the jobs table and the new projects table.