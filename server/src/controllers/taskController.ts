import { Response, NextFunction } from 'express';
import { Role, TaskStatus, TaskPriority, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import {
  broadcastTaskStatusChange,
  sendNotificationToUser,
  broadcastTaskAssigned,
} from '../socket';

// Priority weight helper for sorting
const priorityOrder: Record<TaskPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Friendly status formatting
const formatStatusLabel = (status: TaskStatus | null): string => {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'In Review';
    case 'DONE':
      return 'Done';
    default:
      return status || '';
  }
};

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const {
      status,
      priority,
      projectId,
      assignedToId,
      timeRange,
      startDate,
      endDate,
      search,
    } = req.query as any;

    const where: Prisma.TaskWhereInput = {};

    // 1. Role-based scoping
    if (user.role === Role.DEVELOPER) {
      // Developer can strictly view ONLY their assigned tasks
      where.assignedToId = user.id;
    } else if (user.role === Role.PM) {
      // PM can strictly view ONLY tasks in projects they created
      where.project = {
        pmId: user.id,
      };
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
    } else if (user.role === Role.ADMIN) {
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
    }

    // 2. Query Filters
    if (projectId) {
      // If PM, ensure this project belongs to them
      if (user.role === Role.PM) {
        const proj = await prisma.project.findUnique({
          where: { id: projectId },
          select: { pmId: true },
        });
        if (!proj || proj.pmId !== user.id) {
          throw new ForbiddenError('You can only view tasks in your own projects');
        }
      }
      where.projectId = projectId;
    }

    if (status) {
      where.status = status as TaskStatus;
    }

    if (priority) {
      where.priority = priority as TaskPriority;
    }

    const now = new Date();

    if (timeRange === 'overdue') {
      where.OR = [
        { isOverdue: true },
        {
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
        },
      ];
    } else if (timeRange === 'this_week') {
      // Current week: from start of week (Sunday/Monday) to end of week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      where.dueDate = {
        gte: startOfWeek,
        lte: endOfWeek,
      };
    } else if (timeRange === 'upcoming') {
      where.dueDate = {
        gte: now,
      };
    }

    if (startDate || endDate) {
      where.dueDate = {
        ...(where.dueDate as any),
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            pmId: true,
            client: { select: { name: true, company: true } },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy:
        user.role === Role.DEVELOPER
          ? [
              // Developer dashboard requires sorting by priority then due date
              { priority: 'desc' },
              { dueDate: 'asc' },
            ]
          : [{ dueDate: 'asc' }, { priority: 'desc' }],
    });

    res.status(200).json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
            pm: { select: { id: true, name: true, email: true } },
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role-based access verification
    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw new ForbiddenError('You can only view your own assigned tasks');
    }

    if (user.role === Role.PM && task.project.pmId !== user.id) {
      throw new ForbiddenError('You can only view tasks in projects you created');
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { title, description, projectId, assignedToId, status, priority, dueDate } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // If PM, ensure they own the project
    if (user.role === Role.PM && project.pmId !== user.id) {
      throw new ForbiddenError('You can only create tasks in projects you created');
    }

    const taskDueDate = new Date(dueDate);
    const isPastDue = taskDueDate < new Date() && status !== TaskStatus.DONE;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assignedToId: assignedToId || null,
        status: status || TaskStatus.TODO,
        priority: priority || TaskPriority.MEDIUM,
        dueDate: taskDueDate,
        isOverdue: isPastDue,
      },
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Create initial activity log entry
    await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        action: 'CREATED',
        details: `${user.name} created Task #${task.taskNumber}: "${task.title}"`,
      },
    });

    // If assigned to a developer, create notification
    if (assignedToId) {
      const notification = await prisma.notification.create({
        data: {
          userId: assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You were assigned to "${task.title}" (Task #${task.taskNumber}) in ${project.name}.`,
          link: `/tasks/${task.id}`,
        },
      });

      sendNotificationToUser(assignedToId, notification);
      broadcastTaskAssigned(task, assignedToId, project.pmId);
    }

    res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status: newStatus } = req.body as { status: TaskStatus };

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role-based authorization for status update
    if (user.role === Role.DEVELOPER) {
      if (task.assignedToId !== user.id) {
        throw new ForbiddenError('You can only update the status of tasks assigned to you');
      }
    } else if (user.role === Role.PM) {
      if (task.project.pmId !== user.id) {
        throw new ForbiddenError('You can only update tasks in projects you created');
      }
    }

    const previousStatus = task.status;
    if (previousStatus === newStatus) {
      res.status(200).json({ success: true, data: { task } });
      return;
    }

    const now = new Date();
    const isOverdueNow = newStatus !== TaskStatus.DONE && task.dueDate < now;

    // 1. Update task status in database
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: newStatus,
        isOverdue: isOverdueNow,
      },
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // 2. Format details string exactly as requested: "Ravi moved Task #12 from In Progress → In Review"
    const details = `${user.name} moved Task #${task.taskNumber} from ${formatStatusLabel(previousStatus)} → ${formatStatusLabel(newStatus)}`;

    // 3. Record status change in database activity log (MUST be stored, not derived)
    const activityLog = await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        previousStatus,
        newStatus,
        action: 'STATUS_CHANGE',
        details,
        timestamp: now,
      },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    // 4. Notification trigger: When task is moved to IN_REVIEW, notify the project PM
    if (newStatus === TaskStatus.IN_REVIEW && task.project.pmId !== user.id) {
      const pmNotification = await prisma.notification.create({
        data: {
          userId: task.project.pmId,
          type: 'TASK_IN_REVIEW',
          title: 'Task Ready for Review',
          message: `${user.name} moved "${task.title}" (Task #${task.taskNumber}) to In Review.`,
          link: `/tasks/${task.id}`,
        },
      });

      sendNotificationToUser(task.project.pmId, pmNotification);
    }

    // 5. Broadcast to WebSocket with role filtering
    const activityPayload = {
      activity: {
        id: activityLog.id,
        taskId: task.id,
        taskNumber: task.taskNumber,
        taskTitle: task.title,
        projectId: task.project.id,
        projectName: task.project.name,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatarUrl || null,
        previousStatus: formatStatusLabel(previousStatus),
        newStatus: formatStatusLabel(newStatus),
        action: 'STATUS_CHANGE',
        details,
        timestamp: activityLog.timestamp.toISOString(),
      },
      task: updatedTask,
      pmId: task.project.pmId,
      assignedToId: task.assignedToId,
    };

    broadcastTaskStatusChange(activityPayload);

    res.status(200).json({
      success: true,
      data: {
        task: updatedTask,
        activity: activityPayload.activity,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, description, assignedToId, status, priority, dueDate } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.PM && task.project.pmId !== user.id) {
      throw new ForbiddenError('You can only edit tasks in projects you created');
    }

    const previousAssignedId = task.assignedToId;
    const isPastDue = dueDate
      ? new Date(dueDate) < new Date() && (status || task.status) !== TaskStatus.DONE
      : task.isOverdue;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        isOverdue: isPastDue,
      },
      include: {
        project: { select: { id: true, name: true, pmId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // If assigned to a new developer, create notification
    if (assignedToId && assignedToId !== previousAssignedId) {
      const notification = await prisma.notification.create({
        data: {
          userId: assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assignment Updated',
          message: `You were assigned to "${updatedTask.title}" in ${task.project.name}.`,
          link: `/tasks/${updatedTask.id}`,
        },
      });

      sendNotificationToUser(assignedToId, notification);
      broadcastTaskAssigned(updatedTask, assignedToId, task.project.pmId);
    }

    res.status(200).json({
      success: true,
      data: { task: updatedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.PM && task.project.pmId !== user.id) {
      throw new ForbiddenError('You can only delete tasks in projects you created');
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
