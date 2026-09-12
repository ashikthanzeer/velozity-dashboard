import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { verifyProjectAccess } from '../middlewares/auth';

export const getProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    let whereClause: any = {};

    if (user.role === Role.ADMIN) {
      whereClause = {};
    } else if (user.role === Role.PM) {
      whereClause = { pmId: user.id };
    } else if (user.role === Role.DEVELOPER) {
      // Dev only sees projects where they have tasks assigned
      whereClause = {
        tasks: {
          some: {
            assignedToId: user.id,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: true,
        pm: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: {
          select: { tasks: true },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            isOverdue: true,
            assignedToId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format summary metrics per project
    const formattedProjects = projects.map((p) => {
      // If dev, only count their own tasks
      const relevantTasks = user.role === Role.DEVELOPER
        ? p.tasks.filter((t) => t.assignedToId === user.id)
        : p.tasks;

      const totalTasks = relevantTasks.length;
      const completedTasks = relevantTasks.filter((t) => t.status === 'DONE').length;
      const overdueTasks = relevantTasks.filter((t) => t.isOverdue).length;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        client: p.client,
        pm: p.pm,
        stats: {
          totalTasks,
          completedTasks,
          overdueTasks,
          progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: { projects: formattedProjects },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Verify access
    await verifyProjectAccess(id, user.id, user.role, 'view');

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        pm: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        tasks: {
          where: user.role === Role.DEVELOPER ? { assignedToId: user.id } : undefined,
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { name, description, clientId, status, pmId } = req.body;

    // Verify client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // PM can only create projects owned by themselves
    let assignedPmId = user.id;
    if (user.role === Role.ADMIN && pmId) {
      assignedPmId = pmId;
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        status: status || 'ACTIVE',
        pmId: assignedPmId,
      },
      include: {
        client: true,
        pm: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { name, description, clientId, status } = req.body;

    // Check project modification permission (PM must own it, or Admin)
    await verifyProjectAccess(id, user.id, user.role, 'modify');

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(clientId && { clientId }),
        ...(status && { status }),
      },
      include: {
        client: true,
        pm: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    await verifyProjectAccess(id, user.id, user.role, 'modify');

    await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
