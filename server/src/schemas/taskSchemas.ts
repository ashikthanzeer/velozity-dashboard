import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = {
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    projectId: z.string().uuid('Valid project ID is required'),
    assignedToId: z.string().uuid('Valid user ID for developer is required').optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
    priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
    dueDate: z.string().datetime('Valid ISO dueDate string is required'),
  }),
};

export const updateTaskStatusSchema = {
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    status: z.nativeEnum(TaskStatus, {
      errorMap: () => ({ message: 'Status must be one of: TODO, IN_PROGRESS, IN_REVIEW, DONE' }),
    }),
  }),
};

export const updateTaskSchema = {
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    assignedToId: z.string().uuid().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional(),
  }),
};

export const getTasksQuerySchema = {
  query: z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    projectId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    timeRange: z.enum(['all', 'overdue', 'this_week', 'upcoming']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(),
  }),
};
