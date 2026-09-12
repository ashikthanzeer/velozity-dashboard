import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Project, Client } from '../types';
import { Modal } from '../components/common/Modal';
import {
  FolderKanban,
  Plus,
  Briefcase,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user, isAdmin, isPM } = useAuth();
  const { joinProjectRoom, leaveProjectRoom } = useSocket();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const res = await api.get('projects');
      if (res.success && res.data) {
        setProjects(res.data.projects);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    if (!isAdmin && !isPM) return;
    try {
      const res = await api.get('clients');
      if (res.success && res.data) {
        setClients(res.data.clients);
      }
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  };

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !clientId) {
      setError('Please provide project name and select a client.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('projects', {
        name: projectName,
        description: description || undefined,
        clientId,
      });
      setIsModalOpen(false);
      setProjectName('');
      setDescription('');
      setClientId('');
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Client Projects</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isAdmin
              ? 'All active agency projects across all client portfolios.'
              : isPM
              ? 'Projects you own and manage with your developer squads.'
              : 'Projects containing tasks assigned to you.'}
          </p>
        </div>

        {(isAdmin || isPM) && (
          <button
            id="create-project-btn"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
        >
          <FolderKanban size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>No projects available</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>
            {(isAdmin || isPM)
              ? 'Get started by creating your first client project.'
              : 'No tasks have been assigned to you in any project yet.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {projects.map((project) => {
            const stats = project.stats || {
              totalTasks: 0,
              completedTasks: 0,
              overdueTasks: 0,
              progress: 0,
            };

            return (
              <div
                key={project.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Top Info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#ffffff' }}>
                      {project.name}
                    </h3>
                    {project.client && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: 'var(--secondary)',
                          marginTop: '4px',
                        }}
                      >
                        <Briefcase size={13} />
                        <span>{project.client.company} ({project.client.name})</span>
                      </div>
                    )}
                  </div>

                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(52, 211, 153, 0.12)',
                      color: '#34d399',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
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
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Completion Progress</span>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{stats.progress}%</span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stats.progress}%`,
                        background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} color="#34d399" />
                    <span>{stats.completedTasks} / {stats.totalTasks} Tasks</span>
                  </div>

                  {stats.overdueTasks > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 600 }}>
                      <AlertTriangle size={14} />
                      <span>{stats.overdueTasks} Overdue</span>
                    </div>
                  )}
                </div>

                {/* Footer: PM info */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '14px',
                    marginTop: 'auto',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {project.pm && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(6, 182, 212, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: 'var(--secondary)' }}>
                          {project.pm.name.charAt(0)}
                        </span>
                      </div>
                      <span>PM: {project.pm.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Client Project"
      >
        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Project Name *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. AI Fraud Detection Telemetry"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Client *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              style={{ width: '100%' }}
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope, architectural objectives, and high-level milestones..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '12px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
