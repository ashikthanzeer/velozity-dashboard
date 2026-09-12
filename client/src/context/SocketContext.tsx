import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getStoredAccessToken } from '../services/api';
import { ActivityItem, NotificationItem, Task } from '../types';
import { api } from '../services/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  activities: ActivityItem[];
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  subscribeToTaskUpdates: (cb: (data: { task: Task; activity: ActivityItem }) => void) => () => void;
  fetchMissedActivities: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const taskUpdateListenersRef = useRef<((data: { task: Task; activity: ActivityItem }) => void)[]>([]);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadNotificationCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  // Fetch missed activities directly from PostgreSQL database (not memory!)
  const fetchMissedActivities = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('activity/recent?limit=20');
      if (res.success && res.data) {
        setActivities(res.data.activities || []);
      }
    } catch (e) {
      console.error('Failed to load missed activities:', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    fetchNotifications();
    fetchMissedActivities();

    const token = getStoredAccessToken();
    const newSocket = io({
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected as', user.name);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    // Presence update
    newSocket.on('presence:update', (data: { onlineCount: number }) => {
      if (data?.onlineCount !== undefined) {
        setOnlineCount(data.onlineCount);
      }
    });

    // Real-time live activity feed event (role-filtered at server level)
    newSocket.on('activity:new', (newActivity: ActivityItem) => {
      setActivities((prev) => {
        // Prevent duplicates
        if (prev.some((a) => a.id === newActivity.id)) return prev;
        return [newActivity, ...prev.slice(0, 49)];
      });
    });

    // Real-time task status update for active project page
    newSocket.on('task:status_updated', (data: { task: Task; activity: ActivityItem }) => {
      taskUpdateListenersRef.current.forEach((cb) => cb(data));
      // Also ensure feed has this activity
      setActivities((prev) => {
        if (prev.some((a) => a.id === data.activity.id)) return prev;
        return [data.activity, ...prev.slice(0, 49)];
      });
    });

    // In-app notifications
    newSocket.on('notification:new', (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadNotificationCount((prev) => prev + 1);
    });

    // Background overdue task sweep
    newSocket.on('tasks:overdue_sweep', () => {
      // Re-sync missed activities
      fetchMissedActivities();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  const joinProjectRoom = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProjectRoom = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('project:leave', projectId);
    }
  };

  const subscribeToTaskUpdates = (cb: (data: { task: Task; activity: ActivityItem }) => void) => {
    taskUpdateListenersRef.current.push(cb);
    return () => {
      taskUpdateListenersRef.current = taskUpdateListenersRef.current.filter((c) => c !== cb);
    };
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await api.patch(`notifications/${id}/read`);
      if (res.success && res.data) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadNotificationCount(res.data.unreadCount);
      }
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const res = await api.post('notifications/read-all');
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadNotificationCount(0);
      }
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineCount,
        notifications,
        unreadNotificationCount,
        activities,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        joinProjectRoom,
        leaveProjectRoom,
        subscribeToTaskUpdates,
        fetchMissedActivities,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
