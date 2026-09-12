import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors';
import { prisma } from '../config/prisma';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Malformed authorization header');
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token expired', { expired: true });
      }
      throw new UnauthorizedError('Invalid access token');
    }
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role "${req.user.role}" is not permitted to access this resource.`
        )
      );
    }

    next();
  };
};

/**
 * Ensures PM only accesses projects they created, Dev only if assigned to tasks in it, Admin full access.
 */
export const verifyProjectAccess = async (
  projectId: string,
  userId: string,
  role: Role,
  action: 'view' | 'modify'
): Promise<boolean> => {
  if (role === Role.ADMIN) return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        select: { assignedToId: true },
      },
    },
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (role === Role.PM) {
    if (project.pmId !== userId) {
      throw new ForbiddenError('You can only view or manage projects you created');
    }
    return true;
  }

  if (role === Role.DEVELOPER) {
    if (action === 'modify') {
      throw new ForbiddenError('Developers cannot modify project settings');
    }
    // For view, only if developer has an assigned task in this project
    const hasAssignedTask = project.tasks.some((t) => t.assignedToId === userId);
    if (!hasAssignedTask) {
      throw new ForbiddenError('Developers can only view projects with tasks assigned to them');
    }
    return true;
  }

  return false;
};
