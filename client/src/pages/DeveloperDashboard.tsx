import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Task } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { LiveActivityFeed } from '../components/activity/LiveActivityFeed';
import {
  CheckSquare,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { subscribeToTaskUpdates } = useSocket();

  const loadDeveloperData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        api.get('tasks'),
        api.get('dashboard/stats'),
      ]);

      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data.tasks);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats);
      }
    } catch (e) {
      console.error('Failed to load developer data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeveloperData();

    // Subscribe to live WebSocket updates
    const unsubscribe = subscribeToTaskUpdates((data) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === data.task.id ? { ...t, ...data.task } : t))
      );
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Developer Workspace</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Your assigned tasks, prioritized automatically by critical level and due date.
        </p>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Assigned to You</span>
            <CheckSquare size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#ffffff' }}>
            {tasks.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Active workload
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>In Progress</span>
            <PlayCircle size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#38bdf8' }}>
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Currently underway
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>In Review</span>
            <Clock size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#fbbf24' }}>
            {tasks.filter((t) => t.status === 'IN_REVIEW').length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Awaiting PM signoff
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '18px 20px',
            border: tasks.filter((t) => t.isOverdue).length > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Overdue</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#ef4444' }}>
            {tasks.filter((t) => t.isOverdue).length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Flagged via background job
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Sorted Tasks + Personal Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Left Column: Assigned Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
              Your Tasks (Sorted by Priority & Due Date)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {tasks.length} items
            </span>
          </div>

          {tasks.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Sparkles size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>All caught up!</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>
                You have no active tasks assigned at this moment.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdated={handleStatusUpdated}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Personal Activity Feed */}
        <div>
          <LiveActivityFeed title="Your Task Activity" maxHeight="600px" />
        </div>
      </div>
    </div>
  );
};
