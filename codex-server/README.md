# Codex Server

Backend API server for the Codex AI Agent system.

## Database Persistence

The SQLite database is stored in the `data/` directory to ensure persistence across application restarts. The database file location is:

```
data/codex.db
```

### Database Migration

If you have an existing database in the old location (`database/codex.db`), you can migrate it to the new location by running:

```bash
npm run db:migrate
```

### Manual Database Initialization

To manually initialize a new database:

```bash
npm run db:init
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Environment Variables

Create a `.env` file in the server root:

```env
PORT=4133
FRONTEND_URL=http://localhost:4123
NODE_ENV=development
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/jobs` - Create new job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/cancel` - Cancel job
- `GET /api/jobs/:id/events` - Get job events

## WebSocket

WebSocket endpoint is available at `ws://localhost:4133/ws`

### WebSocket Messages

Client can send:
- `subscribe` - Subscribe to job events
- `unsubscribe` - Unsubscribe from job events
- `approval_response` - Respond to approval requests
- `cancel_job` - Cancel a running job
- `ping` - Keep connection alive

Server sends:
- `event` - Job execution events
- `approval_request` - Request user approval
- `connection_ack` - Connection acknowledged
- `error` - Error messages
- `pong` - Response to ping