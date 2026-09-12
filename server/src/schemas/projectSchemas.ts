import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

export const createProjectSchema = {
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    description: z.string().optional(),
    clientId: z.string().uuid('Valid client ID is required'),
    status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.ACTIVE),
  }),
};

export const updateProjectSchema = {
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    clientId: z.string().uuid().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
};
