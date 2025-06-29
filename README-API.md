# Codex API Server & UI

This directory contains the API server wrapper and web UI for Codex, transforming the CLI tool into a service-oriented architecture.

## Architecture

```
codex-server/    # Backend API server (Node.js/TypeScript)
codex-ui/        # Frontend web app (React/TypeScript)
```

## Features

- **REST API** for job management
- **WebSocket** real-time event streaming
- **Modern UI** with dark mode design
- **Live execution view** with approval dialogs
- **Terminal output** streaming
- **Code change** visualization
- **Job history** and management

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite3

### Backend Setup

```bash
cd codex-server
npm install
npm run db:init    # Initialize database
npm run dev        # Start development server
```

The server will start on `http://localhost:4133`

### Frontend Setup

```bash
cd codex-ui
npm install
npm run dev        # Start development server
```

The UI will start on `http://localhost:4123`

## API Documentation

### REST Endpoints

#### Create Job
```http
POST /api/jobs
Content-Type: application/json

{
  "prompt": "Create a React component",
  "parameters": {
    "model": "gpt-4",
    "approvalMode": "suggest"
  }
}
```

#### Get Job
```http
GET /api/jobs/:jobId
```

#### List Jobs
```http
GET /api/jobs?limit=20&offset=0
```

#### Cancel Job
```http
POST /api/jobs/:jobId/cancel
```

### WebSocket Protocol

Connect to `ws://localhost:4133/ws`

#### Client Messages
```json
// Subscribe to job
{ "type": "subscribe", "jobId": "job_123" }

// Approval response
{ 
  "type": "approval_response", 
  "jobId": "job_123",
  "data": {
    "approvalId": "apr_456",
    "decision": "approve",
    "comment": "Looks good"
  }
}
```

#### Server Messages
```json
// Event
{ 
  "type": "event", 
  "jobId": "job_123",
  "data": {
    "type": "agent.message",
    "content": "Starting task..."
  }
}

// Approval request
{
  "type": "approval_request",
  "jobId": "job_123", 
  "data": {
    "approvalId": "apr_456",
    "tool": "shell",
    "command": "npm install",
    "context": "Installing dependencies"
  }
}
```

## Configuration

### Server Configuration

Create `.env` file in `codex-server/`:
```env
PORT=4133
FRONTEND_URL=http://localhost:4123
NODE_ENV=development
```

### Frontend Configuration

The frontend uses Vite proxy to connect to the backend in development.

## Development

### Running Tests
```bash
# Backend
cd codex-server
npm test

# Frontend
cd codex-ui
npm test
```

### Building for Production
```bash
# Backend
cd codex-server
npm run build

# Frontend  
cd codex-ui
npm run build
```

## Deployment

### Using Docker (Coming Soon)
```bash
docker-compose up
```

### Manual Deployment

1. Build both frontend and backend
2. Serve frontend static files
3. Run backend with PM2 or similar
4. Configure reverse proxy (nginx)

## Security Considerations

- All job execution is sandboxed
- Approval required for operations
- No authentication in prototype (add for production)
- WebSocket connections should use WSS in production
- Enable CORS restrictions for production

## Future Enhancements

- [ ] Authentication & authorization
- [ ] Multi-user support
- [ ] Job queuing system
- [ ] Result caching
- [ ] Export functionality
- [ ] Mobile responsive design
- [ ] Docker containerization
- [ ] Kubernetes deployment

## License

Same as Codex project