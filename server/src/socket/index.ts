import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { UserJWTPayload } from '../types';
import { Role } from '@prisma/client';
import { config } from '../config/env';

interface AuthenticatedSocket extends Socket {
  user?: UserJWTPayload;
}

let io: SocketIOServer | null = null;
const onlineUsers = new Map<string, { socketCount: number; user: UserJWTPayload }>();

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication Middleware for Handshake
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        return next(new Error('Authentication token required for WebSocket connection'));
      }

      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch (err: any) {
      next(new Error(`WebSocket auth failed: ${err.message}`));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`[Socket] User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    // Join personal user room
    socket.join(`user:${user.id}`);

    // Join global role room
    socket.join(`role:${user.role}`);

    // Join specialized PM or Dev room
    if (user.role === Role.PM) {
      socket.join(`pm:${user.id}`);
    } else if (user.role === Role.DEVELOPER) {
      socket.join(`dev:${user.id}`);
    }

    // Update presence
    const current = onlineUsers.get(user.id);
    if (current) {
      current.socketCount += 1;
    } else {
      onlineUsers.set(user.id, { socketCount: 1, user });
    }
    broadcastPresenceUpdate();

    // Client requests to watch a specific project
    socket.on('project:join', (projectId: string) => {
      if (projectId) {
        socket.join(`project:${projectId}`);
        console.log(`[Socket] Socket ${socket.id} joined project room: project:${projectId}`);
      }
    });

    socket.on('project:leave', (projectId: string) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        console.log(`[Socket] Socket ${socket.id} left project room: project:${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${user.name} - Socket ID: ${socket.id}`);
      const entry = onlineUsers.get(user.id);
      if (entry) {
        entry.socketCount -= 1;
        if (entry.socketCount <= 0) {
          onlineUsers.delete(user.id);
        }
      }
      broadcastPresenceUpdate();
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io server has not been initialized');
  }
  return io;
}

export function getOnlineUsersCount(): number {
  return onlineUsers.size;
}

export function broadcastPresenceUpdate(): void {
  if (!io) return;
  const count = onlineUsers.size;
  const activeUserList = Array.from(onlineUsers.values()).map((v) => ({
    id: v.user.id,
    name: v.user.name,
    role: v.user.role,
  }));

  // Emit to all admins
  io.to(`role:${Role.ADMIN}`).emit('presence:update', {
    onlineCount: count,
    users: activeUserList,
  });
}

export interface ActivityBroadcastPayload {
  activity: {
    id: string;
    taskId: string;
    taskNumber: number;
    taskTitle: string;
    projectId: string;
    projectName: string;
    userId: string;
    userName: string;
    userAvatar?: string | null;
    previousStatus: string | null;
    newStatus: string | null;
    action: string;
    details: string;
    timestamp: string;
  };
  task: any;
  pmId: string;
  assignedToId?: string | null;
}

/**
 * Dispatches role-filtered activity events:
 * - Everyone viewing the project receives project:update
 * - Admin receives in global feed (role:ADMIN)
 * - PM receives only for their project (pm:pmId)
 * - Developer receives only for their assigned task (dev:devId)
 */
export function broadcastTaskStatusChange(payload: ActivityBroadcastPayload): void {
  if (!io) return;

  const { activity, task, pmId, assignedToId } = payload;

  // 1. All users currently on this project's page see the update live
  io.to(`project:${task.projectId}`).emit('task:status_updated', {
    activity,
    task,
  });

  // 2. Admin receives in global activity feed
  io.to(`role:${Role.ADMIN}`).emit('activity:new', activity);

  // 3. Project Manager receives in their project activity feed
  io.to(`pm:${pmId}`).emit('activity:new', activity);

  // 4. Assigned Developer receives if assigned
  if (assignedToId) {
    io.to(`dev:${assignedToId}`).emit('activity:new', activity);
  }
}

export function sendNotificationToUser(userId: string, notification: any): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:new', notification);
}

export function broadcastTaskAssigned(task: any, devId: string, pmId: string): void {
  if (!io) return;
  io.to(`project:${task.projectId}`).emit('task:updated', task);
  io.to(`dev:${devId}`).emit('task:assigned', task);
  io.to(`pm:${pmId}`).emit('task:updated', task);
  io.to(`role:${Role.ADMIN}`).emit('task:updated', task);
}

export function broadcastOverdueUpdate(updatedTasks: any[]): void {
  if (!io) return;
  io.emit('tasks:overdue_sweep', {
    count: updatedTasks.length,
    tasks: updatedTasks,
  });
}
