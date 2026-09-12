import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { LiveActivityFeed } from '../components/activity/LiveActivityFeed';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  Layers,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { onlineCount } = useSocket();

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.success && res.data) {
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Admin Overview</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Global client projects, team performance, and real-time operational activity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/projects" className="btn btn-secondary btn-sm">
            <FolderKanban size={14} />
            <span>Manage Projects</span>
          </Link>
          <Link to="/tasks" className="btn btn-primary btn-sm">
            <CheckCircle2 size={14} />
            <span>All Tasks</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Total Projects */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Projects</span>
            <FolderKanban size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>
            {stats?.totalProjects ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats?.totalClients ?? 0} active clients
          </div>
        </div>

        {/* Total Tasks */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Total Tasks</span>
            <Layers size={18} color="var(--secondary)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#ffffff' }}>
            {stats?.totalTasks ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>
            {stats?.tasksByStatus?.DONE ?? 0} completed
          </div>
        </div>

        {/* Overdue Tasks */}
        <div
          className="glass-card"
          style={{
            padding: '20px',
            border: stats?.overdueTaskCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Overdue Tasks</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#ef4444' }}>
            {stats?.overdueTaskCount ?? 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Flagged via background cron
          </div>
        </div>

        {/* Active Online Presence */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Online Now</span>
            <Users size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
            {onlineCount}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Live WebSocket presence
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tasks by Status & Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Status Distribution Breakdown */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            Tasks by Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                label: 'To Do',
                count: stats?.tasksByStatus?.TODO ?? 0,
                color: 'var(--status-todo)',
                bg: 'rgba(148, 163, 184, 0.2)',
              },
              {
                label: 'In Progress',
                count: stats?.tasksByStatus?.IN_PROGRESS ?? 0,
                color: 'var(--status-in-progress)',
                bg: 'rgba(56, 189, 248, 0.2)',
              },
              {
                label: 'In Review',
                count: stats?.tasksByStatus?.IN_REVIEW ?? 0,
                color: 'var(--status-in-review)',
                bg: 'rgba(251, 191, 36, 0.2)',
              },
              {
                label: 'Done',
                count: stats?.tasksByStatus?.DONE ?? 0,
                color: 'var(--status-done)',
                bg: 'rgba(52, 211, 153, 0.2)',
              },
            ].map((st) => {
              const total = stats?.totalTasks || 1;
              const pct = Math.round((st.count / total) * 100);

              return (
                <div key={st.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {st.label}
                    </span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {st.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: st.color,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#c7d2fe' }}>
                Full Task Explorer
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Filter tasks by priority, status, and timeline with shareable URLs.
              </p>
            </div>
            <Link to="/tasks" className="btn btn-primary btn-sm">
              Explore
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Real-time Global Activity Feed */}
        <div>
          <LiveActivityFeed title="Global Activity Feed" maxHeight="450px" />
        </div>
      </div>
    </div>
  );
};
