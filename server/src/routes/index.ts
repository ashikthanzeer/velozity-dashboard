import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

// Schemas
import { loginSchema } from '../schemas/authSchemas';
import { createProjectSchema, updateProjectSchema } from '../schemas/projectSchemas';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  getTasksQuerySchema,
} from '../schemas/taskSchemas';

// Controllers
import * as authController from '../controllers/authController';
import * as projectController from '../controllers/projectController';
import * as taskController from '../controllers/taskController';
import * as activityController from '../controllers/activityController';
import * as notificationController from '../controllers/notificationController';
import * as userController from '../controllers/userController';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

// ==========================================
// 1. AUTH ROUTES
// ==========================================
router.post('/auth/login', validateRequest(loginSchema), authController.login);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// ==========================================
// 2. DASHBOARD ROUTES (Role-tailored stats)
// ==========================================
router.get('/dashboard/stats', authenticateToken, dashboardController.getDashboardStats);

// ==========================================
// 3. PROJECT ROUTES
// ==========================================
router.get('/projects', authenticateToken, projectController.getProjects);
router.get('/projects/:id', authenticateToken, projectController.getProjectById);
router.post(
  '/projects',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  validateRequest(createProjectSchema),
  projectController.createProject
);
router.put(
  '/projects/:id',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  validateRequest(updateProjectSchema),
  projectController.updateProject
);
router.delete(
  '/projects/:id',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  projectController.deleteProject
);

// ==========================================
// 4. TASK ROUTES
// ==========================================
router.get(
  '/tasks',
  authenticateToken,
  validateRequest(getTasksQuerySchema),
  taskController.getTasks
);
router.get('/tasks/:id', authenticateToken, taskController.getTaskById);
router.post(
  '/tasks',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  validateRequest(createTaskSchema),
  taskController.createTask
);
router.patch(
  '/tasks/:id/status',
  authenticateToken,
  validateRequest(updateTaskStatusSchema),
  taskController.updateTaskStatus
);
router.put(
  '/tasks/:id',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  validateRequest(updateTaskSchema),
  taskController.updateTask
);
router.delete(
  '/tasks/:id',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  taskController.deleteTask
);

// ==========================================
// 5. ACTIVITY FEED ROUTES (Missed event catchup)
// ==========================================
router.get('/activity/recent', authenticateToken, activityController.getRecentActivity);

// ==========================================
// 6. NOTIFICATION ROUTES
// ==========================================
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.patch('/notifications/:id/read', authenticateToken, notificationController.markNotificationAsRead);
router.post('/notifications/read-all', authenticateToken, notificationController.markAllNotificationsAsRead);

// ==========================================
// 7. USER & CLIENT ROUTES
// ==========================================
router.get('/users/developers', authenticateToken, userController.getTeamMembers);
router.get(
  '/users',
  authenticateToken,
  requireRole(Role.ADMIN),
  userController.getAllUsers
);
router.get(
  '/clients',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  userController.getClients
);
router.post(
  '/clients',
  authenticateToken,
  requireRole(Role.ADMIN, Role.PM),
  userController.createClient
);

export default router;
