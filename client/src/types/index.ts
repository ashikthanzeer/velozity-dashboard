export type Role = 'ADMIN' | 'PM' | 'DEVELOPER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  pm?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  stats?: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    progress: number;
  };
  tasks?: Task[];
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  projectId: string;
  project?: {
    id: string;
    name: string;
    pmId?: string;
    client?: {
      name: string;
      company: string;
    };
  };
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  activityLogs?: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  taskId: string;
  taskNumber: number;
  taskTitle: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  action: string;
  details: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  role: Role;
}
