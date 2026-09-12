import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useSocket();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string, link?: string | null) => {
    await markNotificationAsRead(id);
    if (link) {
      setIsOpen(false);
      navigate(link);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: '8px',
          color: unreadNotificationCount > 0 ? '#f8fafc' : 'var(--text-secondary)',
          backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadNotificationCount > 0 && (
          <span
            id="notification-badge-count"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
              animation: 'pulse-border 2s infinite',
            }}
          >
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown-menu"
          className="glass-card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 10px)',
            width: '360px',
            maxHeight: '480px',
            backgroundColor: '#121829',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideDown 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
              {unreadNotificationCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: 'var(--primary)',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  {unreadNotificationCount} new
                </span>
              )}
            </div>

            {unreadNotificationCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                style={{
                  fontSize: '12px',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 500,
                }}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '6px' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px', fontWeight: 500 }}>No notifications yet</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  You'll be alerted when tasks are assigned or status updates occur.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                let timeStr = 'Just now';
                try {
                  timeStr = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });
                } catch (e) {}

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                      borderLeft: n.isRead
                        ? '3px solid transparent'
                        : '3px solid var(--primary)',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = n.isRead
                        ? 'transparent'
                        : 'rgba(99, 102, 241, 0.08)')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: n.isRead ? 500 : 700,
                          color: n.isRead ? 'var(--text-primary)' : '#ffffff',
                        }}
                      >
                        {n.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Clock size={10} />
                        {timeStr}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {n.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
