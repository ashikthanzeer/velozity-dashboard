import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Calendar, User, ArrowRight, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onStatusUpdated?: (updatedTask: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusUpdated,
  onEditTask,
  onDeleteTask,
}) => {
  const { user, isAdmin, isPM, isDeveloper } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  // Can the current user update this task's status?
  // Developer: can only update their OWN assigned task
  // PM: can update tasks in their projects
  // Admin: can update any task
  const canUpdateStatus =
    isAdmin ||
    (isPM && (!task.project?.pmId || task.project?.pmId === user?.id)) ||
    (isDeveloper && task.assignedToId === user?.id);

  const canManage = isAdmin || (isPM && (!task.project?.pmId || task.project?.pmId === user?.id));

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await api.patch(`tasks/${task.id}/status`, { status: newStatus });
      if (res.success && res.data) {
        if (onStatusUpdated) onStatusUpdated(res.data.task);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  let formattedDate = '';
  try {
    formattedDate = format(new Date(task.dueDate), 'MMM d, yyyy');
  } catch (e) {
    formattedDate = task.dueDate;
  }

  const isOverdueNow = task.isOverdue || (task.status !== 'DONE' && isPast(new Date(task.dueDate)));

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: isOverdueNow
          ? '4px solid #ef4444'
          : task.status === 'DONE'
          ? '4px solid #34d399'
          : '4px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
      }}
    >
      {/* Top row: Task number, priority, and badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            #{task.taskNumber}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={task.status} isOverdue={isOverdueNow} />
          {canManage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onEditTask && (
                <button
                  onClick={() => onEditTask(task)}
                  style={{ color: 'var(--text-muted)', padding: '4px' }}
                  title="Edit Task"
                >
                  <Edit size={14} />
                </button>
              )}
              {onDeleteTask && (
                <button
                  onClick={() => onDeleteTask(task.id)}
                  style={{ color: 'var(--text-muted)', padding: '4px' }}
                  title="Delete Task"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Title & Description */}
      <div>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
          {task.title}
        </h4>
        {task.description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Project info */}
      {task.project && (
        <div style={{ fontSize: '12px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Project: {task.project.name}</span>
        </div>
      )}

      {/* Footer: Due date & Assignee */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          marginTop: '4px',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        {/* Due date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: isOverdueNow ? '#f87171' : 'var(--text-muted)',
            fontWeight: isOverdueNow ? 600 : 400,
          }}
        >
          <Calendar size={13} />
          <span>{formattedDate}</span>
          {isOverdueNow && <AlertTriangle size={13} color="#f87171" />}
        </div>

        {/* Assigned developer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assignedTo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                {task.assignedTo.avatarUrl ? (
                  <img
                    src={task.assignedTo.avatarUrl}
                    alt={task.assignedTo.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '10px', color: 'var(--primary)' }}>
                    {task.assignedTo.name.charAt(0)}
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>{task.assignedTo.name}</span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
          )}
        </div>
      </div>

      {/* Quick Status Transition Buttons for Authorized Users */}
      {canUpdateStatus && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '2px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={task.status}
            disabled={isUpdating}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      )}
    </div>
  );
};
