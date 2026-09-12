import React from 'react';
import { TaskStatus, TaskPriority, Role } from '../../types';
import { AlertCircle, CheckCircle2, Clock, PlayCircle, ShieldAlert } from 'lucide-react';

export const StatusBadge: React.FC<{ status: TaskStatus; isOverdue?: boolean }> = ({
  status,
  isOverdue,
}) => {
  if (isOverdue && status !== 'DONE') {
    return (
      <span className="badge badge-overdue" title="Task past its due date">
        <AlertCircle size={12} />
        Overdue
      </span>
    );
  }

  switch (status) {
    case 'TODO':
      return (
        <span className="badge badge-todo">
          <Clock size={12} />
          To Do
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="badge badge-in-progress">
          <PlayCircle size={12} />
          In Progress
        </span>
      );
    case 'IN_REVIEW':
      return (
        <span className="badge badge-in-review">
          <Clock size={12} />
          In Review
        </span>
      );
    case 'DONE':
      return (
        <span className="badge badge-done">
          <CheckCircle2 size={12} />
          Done
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  switch (priority) {
    case 'LOW':
      return <span className="badge badge-low">Low</span>;
    case 'MEDIUM':
      return <span className="badge badge-medium">Medium</span>;
    case 'HIGH':
      return <span className="badge badge-high">High</span>;
    case 'CRITICAL':
      return (
        <span className="badge badge-critical">
          <ShieldAlert size={12} />
          Critical
        </span>
      );
  }
};

export const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const styles: Record<Role, { bg: string; color: string; border: string; label: string }> = {
    ADMIN: {
      bg: 'rgba(139, 92, 246, 0.15)',
      color: '#c4b5fd',
      border: 'rgba(139, 92, 246, 0.3)',
      label: 'Admin',
    },
    PM: {
      bg: 'rgba(6, 182, 212, 0.15)',
      color: '#67e8f9',
      border: 'rgba(6, 182, 212, 0.3)',
      label: 'Project Manager',
    },
    DEVELOPER: {
      bg: 'rgba(99, 102, 241, 0.15)',
      color: '#a5b4fc',
      border: 'rgba(99, 102, 241, 0.3)',
      label: 'Developer',
    },
  };

  const current = styles[role] || styles.DEVELOPER;

  return (
    <span
      className="badge"
      style={{
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        fontWeight: 600,
      }}
    >
      {current.label}
    </span>
  );
};
