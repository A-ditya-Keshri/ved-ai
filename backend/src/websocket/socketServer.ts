import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';

let io: Server;

export const initSocketServer = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join:assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
      console.log(`📋 Client ${socket.id} joined room: assignment:${assignmentId}`);
    });

    socket.on('leave:assignment', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export const emitToAssignment = (assignmentId: string, event: string, data: any): void => {
  if (io) {
    io.to(`assignment:${assignmentId}`).emit(event, data);
  }
};
