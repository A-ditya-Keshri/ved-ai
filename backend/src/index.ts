import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { env } from './config/env';
import { connectDB } from './config/database';
import { initSocketServer } from './websocket/socketServer';
import { startWorker } from './workers/generationWorker';
import assignmentRoutes from './routes/assignment.routes';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/assignments', assignmentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize everything
const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize WebSocket server
    initSocketServer(httpServer);

    // Start BullMQ worker
    startWorker();

    // Start HTTP server
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🔧 Worker listening for jobs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
