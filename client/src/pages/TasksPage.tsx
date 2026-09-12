import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Task } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { TaskModal } from '../components/tasks/TaskModal';
import { Plus, CheckSquare, Sparkles } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user, isAdmin, isPM } = useAuth();
  const { subscribeToTaskUpdates } = useSocket();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const queryString = searchParams.toString();
      const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setTasks(res.data.tasks);
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [searchParams.toString()]);

  useEffect(() => {
    // Real-time listener for task updates
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

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e: any) {
      alert(e.message || 'Failed to delete task');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Task Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Filterable and real-time synchronized task pipeline with URL shareability.
          </p>
        </div>

        {(isAdmin || isPM) && (
          <button
            id="create-task-main-btn"
            className="btn btn-primary"
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {/* URL Shareable Filter Bar */}
      <TaskFilterBar onFilterChange={() => loadTasks()} />

      {/* Task List / Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}
        >
          <Sparkles size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>No matching tasks found</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            Try adjusting your status, priority, or date filters.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusUpdated={handleStatusUpdated}
              onEditTask={handleEdit}
              onDeleteTask={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSuccess={() => loadTasks()}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
