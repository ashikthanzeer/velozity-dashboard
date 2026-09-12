import { Response, NextFunction } from 'express';
import { Role, TaskStatus, TaskPriority, ProjectStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { getOnlineUsersCount } from '../socket';

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();

    if (user.role === Role.ADMIN) {
      // 1. Admin Dashboard Stats
      const [
        totalProjects,
        totalClients,
        totalUsers,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        overdueCount,
      ] = await Promise.all([
        prisma.project.count(),
        prisma.client.count(),
        prisma.user.count(),
        prisma.task.count({ where: { status: TaskStatus.TODO } }),
        prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
        prisma.task.count({ where: { status: TaskStatus.IN_REVIEW } }),
        prisma.task.count({ where: { status: TaskStatus.DONE } }),
        prisma.task.count({
          where: {
            OR: [
              { isOverdue: true },
              { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
            ],
          },
        }),
      ]);

      const onlineCount = getOnlineUsersCount();

      res.status(200).json({
        success: true,
        data: {
          role: Role.ADMIN,
          stats: {
            totalProjects,
            totalClients,
            totalUsers,
            onlineUsers: onlineCount,
            overdueTaskCount: overdueCount,
            totalTasks: todoTasks + inProgressTasks + inReviewTasks + doneTasks,
            tasksByStatus: {
              TODO: todoTasks,
              IN_PROGRESS: inProgressTasks,
              IN_REVIEW: inReviewTasks,
              DONE: doneTasks,
            },
          },
        },
      });
      return;
    }

    if (user.role === Role.PM) {
      // 2. PM Dashboard Stats (strictly for projects they created)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      const [
        totalProjects,
        activeProjects,
        completedProjects,
        lowPriority,
        mediumPriority,
        highPriority,
        criticalPriority,
        upcomingDueThisWeek,
        overdueCount,
      ] = await Promise.all([
        prisma.project.count({ where: { pmId: user.id } }),
        prisma.project.count({ where: { pmId: user.id, status: ProjectStatus.ACTIVE } }),
        prisma.project.count({ where: { pmId: user.id, status: ProjectStatus.COMPLETED } }),
        prisma.task.count({ where: { project: { pmId: user.id }, priority: TaskPriority.LOW } }),
        prisma.task.count({ where: { project: { pmId: user.id }, priority: TaskPriority.MEDIUM } }),
        prisma.task.count({ where: { project: { pmId: user.id }, priority: TaskPriority.HIGH } }),
        prisma.task.count({ where: { project: { pmId: user.id }, priority: TaskPriority.CRITICAL } }),
        prisma.task.findMany({
          where: {
            project: { pmId: user.id },
            dueDate: { gte: startOfWeek, lte: endOfWeek },
            status: { not: TaskStatus.DONE },
          },
          select: {
            id: true,
            taskNumber: true,
            title: true,
            dueDate: true,
            priority: true,
            status: true,
            assignedTo: { select: { name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        }),
        prisma.task.count({
          where: {
            project: { pmId: user.id },
            OR: [
              { isOverdue: true },
              { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
            ],
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          role: Role.PM,
          stats: {
            projectsSummary: {
              total: totalProjects,
              active: activeProjects,
              completed: completedProjects,
            },
            tasksByPriority: {
              LOW: lowPriority,
              MEDIUM: mediumPriority,
              HIGH: highPriority,
              CRITICAL: criticalPriority,
            },
            upcomingDueThisWeek,
            upcomingDueCount: upcomingDueThisWeek.length,
            overdueTaskCount: overdueCount,
          },
        },
      });
      return;
    }

    if (user.role === Role.DEVELOPER) {
      // 3. Developer Dashboard Stats (assigned tasks only)
      const [
        totalAssigned,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        overdueCount,
        criticalCount,
        highCount,
      ] = await Promise.all([
        prisma.task.count({ where: { assignedToId: user.id } }),
        prisma.task.count({ where: { assignedToId: user.id, status: TaskStatus.TODO } }),
        prisma.task.count({ where: { assignedToId: user.id, status: TaskStatus.IN_PROGRESS } }),
        prisma.task.count({ where: { assignedToId: user.id, status: TaskStatus.IN_REVIEW } }),
        prisma.task.count({ where: { assignedToId: user.id, status: TaskStatus.DONE } }),
        prisma.task.count({
          where: {
            assignedToId: user.id,
            OR: [
              { isOverdue: true },
              { dueDate: { lt: now }, status: { not: TaskStatus.DONE } },
            ],
          },
        }),
        prisma.task.count({ where: { assignedToId: user.id, priority: TaskPriority.CRITICAL } }),
        prisma.task.count({ where: { assignedToId: user.id, priority: TaskPriority.HIGH } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          role: Role.DEVELOPER,
          stats: {
            totalAssigned,
            completedTasks: doneTasks,
            overdueCount,
            criticalCount,
            highCount,
            tasksByStatus: {
              TODO: todoTasks,
              IN_PROGRESS: inProgressTasks,
              IN_REVIEW: inReviewTasks,
              DONE: doneTasks,
            },
          },
        },
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};
