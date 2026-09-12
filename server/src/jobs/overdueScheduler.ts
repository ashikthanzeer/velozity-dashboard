import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { TaskStatus } from '@prisma/client';
import { broadcastOverdueUpdate } from '../socket';

export async function checkAndFlagOverdueTasks(): Promise<number> {
  try {
    const now = new Date();

    // Query tasks past their due date that are not DONE and not already marked isOverdue
    const tasksToUpdate = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          not: TaskStatus.DONE,
        },
        isOverdue: false,
      },
      include: {
        project: {
          select: { name: true, pmId: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    if (tasksToUpdate.length === 0) {
      return 0;
    }

    const taskIds = tasksToUpdate.map((t) => t.id);

    // Batch update tasks to isOverdue = true
    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
      },
      data: {
        isOverdue: true,
      },
    });

    console.log(`[OverdueScheduler] Flagged ${tasksToUpdate.length} tasks as overdue.`);

    // Broadcast over WebSocket so connected clients see updated overdue count & badges
    broadcastOverdueUpdate(tasksToUpdate);

    return tasksToUpdate.length;
  } catch (error) {
    console.error('[OverdueScheduler] Error checking overdue tasks:', error);
    return 0;
  }
}

export function startOverdueScheduler(): cron.ScheduledTask {
  console.log('[OverdueScheduler] Initializing overdue task background cron job (runs every minute)...');

  // Run immediately on server boot
  checkAndFlagOverdueTasks().catch((err) =>
    console.error('[OverdueScheduler] Initial boot check error:', err)
  );

  // Schedule to run every minute
  const task = cron.schedule('* * * * *', async () => {
    await checkAndFlagOverdueTasks();
  });

  return task;
}
