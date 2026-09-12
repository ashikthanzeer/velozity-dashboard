import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LiveActivityFeed } from '../components/activity/LiveActivityFeed';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { TaskModal } from '../components/tasks/TaskModal';
import {
  FolderKanban,
  Calendar,
  AlertTriangle,
  Plus,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export const PMDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('dashboard/stats');
      if (res.success && res.data) {
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error('Failed to load PM stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Project Manager Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Direct visibility and control over projects you manage and team task delivery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            id="pm-create-task-btn"
            className="btn btn-primary btn-sm"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Your Projects</span>
            <FolderKanban size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>
            {stats?.projectsSummary?.total ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats?.projectsSummary?.active ?? 0} active · {stats?.projectsSummary?.completed ?? 0} completed
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Due This Week</span>
            <Calendar size={18} color="var(--secondary)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#38bdf8' }}>
            {stats?.upcomingDueCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Upcoming task deadlines
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            border: stats?.overdueTaskCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Overdue In Your Projects</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#ef4444' }}>
            {stats?.overdueTaskCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Past due date & not completed
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Critical Priorities</span>
            <ShieldAlert size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#f87171' }}>
            {stats?.tasksByPriority?.CRITICAL ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            High attention required
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming due dates this week & Project Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Priority Breakdown + Upcoming Due Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Priority Breakdown Card */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              Tasks by Priority
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Critical', count: stats?.tasksByPriority?.CRITICAL ?? 0, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
                { label: 'High', count: stats?.tasksByPriority?.HIGH ?? 0, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
                { label: 'Medium', count: stats?.tasksByPriority?.MEDIUM ?? 0, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                { label: 'Low', count: stats?.tasksByPriority?.LOW ?? 0, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
              ].map((p) => (
                <div
                  key={p.label}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: p.bg,
                    textAlign: 'center',
                    border: `1px solid ${p.color}30`,
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 800, color: p.color }}>
                    {p.count}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {p.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Due Dates This Week Card */}
          <div className="glass-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Upcoming Due Dates This Week</h3>
              <Link to="/tasks?timeRange=this_week" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 500 }}>
                View in Task Board →
              </Link>
            </div>

            {(!stats?.upcomingDueThisWeek || stats.upcomingDueThisWeek.length === 0) ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '16px 0' }}>
                No deadlines remaining for this week.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.upcomingDueThisWeek.map((t: any) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          #{t.taskNumber}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                          {t.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Assignee: {t.assignedTo?.name || 'Unassigned'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <PriorityBadge priority={t.priority} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--secondary)' }}>
                        <Clock size={12} />
                        <span>{format(new Date(t.dueDate), 'MMM d')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PM Project Scoped Live Activity Feed */}
        <div>
          <LiveActivityFeed title="Team Activity Feed" maxHeight="480px" />
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => fetchStats()}
      />
    </div>
  );
};
