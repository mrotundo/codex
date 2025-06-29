import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './services/database';
import { setupWebSocket } from './api/websocket';
import jobRoutes from './api/routes/jobs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4133;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4123',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', jobRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await db.initialize();
    console.log('Database initialized');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
  });
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
  });
  await db.close();
  process.exit(0);
});

// Start the server
startServer();