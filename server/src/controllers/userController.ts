import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';

export const getTeamMembers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const developers = await prisma.user.findMany({
      where: { role: Role.DEVELOPER },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: { developers },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            projects: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const getClients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: { clients },
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, company, email, phone } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        company,
        email,
        phone,
      },
    });

    res.status(201).json({
      success: true,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};
