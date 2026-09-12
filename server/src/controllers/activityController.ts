import { Response, NextFunction } from 'express';
import { Role, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';

export const getRecentActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const where: Prisma.TaskActivityLogWhereInput = {};

    // Role-filtered query directly against PostgreSQL database
    if (user.role === Role.DEVELOPER) {
      // Developer sees activity only on tasks assigned to them
      where.task = {
        assignedToId: user.id,
      };
    } else if (user.role === Role.PM) {
      // PM sees activity only from their own projects
      where.task = {
        project: {
          pmId: user.id,
        },
      };
    }
    // Admin has no filter — sees activity across all projects in single global feed

    const logs = await prisma.taskActivityLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
        task: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            projectId: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: Math.min(limit, 50),
    });

    const formattedEvents = logs.map((log) => ({
      id: log.id,
      taskId: log.taskId,
      taskNumber: log.task.taskNumber,
      taskTitle: log.task.title,
      projectId: log.task.projectId,
      projectName: log.task.project.name,
      userId: log.userId,
      userName: log.user.name,
      userAvatar: log.user.avatarUrl,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      action: log.action,
      details: log.details,
      timestamp: log.timestamp.toISOString(),
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: formattedEvents,
        count: formattedEvents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
