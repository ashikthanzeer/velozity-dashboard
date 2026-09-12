import { Request } from 'express';
import { Role } from '@prisma/client';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export interface UserJWTPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: UserJWTPayload;
}


export interface ActivityFeedItem {
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
}
