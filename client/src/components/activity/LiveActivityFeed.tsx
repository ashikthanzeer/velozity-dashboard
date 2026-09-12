import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Radio, RefreshCw, Layers } from 'lucide-react';

export const LiveActivityFeed: React.FC<{ title?: string; maxHeight?: string }> = ({
  title = 'Live Activity Feed',
  maxHeight = '420px',
}) => {
  const { activities, isConnected, fetchMissedActivities } = useSocket();
  const { user } = useAuth();

  const getScopeDescription = () => {
    if (user?.role === 'ADMIN') return 'Global stream across all client projects';
    if (user?.role === 'PM') return 'Filtered stream for projects you manage';
    return 'Personal stream for tasks assigned to you';
  };

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 20, 34, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--secondary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{title}</h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: isConnected
                  ? 'rgba(52, 211, 153, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: isConnected ? '#34d399' : '#f87171',
                border: `1px solid ${
                  isConnected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                }`,
              }}
            >
              <Radio
                size={10}
                style={{
                  animation: isConnected ? 'pulse-border 1.5s infinite' : 'none',
                }}
              />
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {getScopeDescription()}
          </p>
        </div>

        <button
          onClick={() => fetchMissedActivities()}
          title="Catchup Missed Events from Database"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
        >
          <RefreshCw size={12} />
          <span>Catchup</span>
        </button>
      </div>

      {/* Feed List */}
      <div
        id="live-activity-feed-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {activities.length === 0 ? (
          <div
            style={{
              padding: '40px 10px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Layers size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: '13px' }}>No activity recorded yet</p>
          </div>
        ) : (
          activities.map((item, index) => {
            let relativeTime = 'Just now';
            try {
              relativeTime = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
            } catch (e) {}

            return (
              <div
                key={item.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  animation: 'slideDown 0.3s ease',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')
                }
              >
                {/* User Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {item.userAvatar ? (
                    <img
                      src={item.userAvatar}
                      alt={item.userName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                      }}
                    >
                      {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                  >
                    {/* Formatted exactly as requested: "Ravi moved Task #12 from In Progress → In Review · 2 mins ago" */}
                    <strong style={{ color: '#ffffff' }}>{item.details}</strong>
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {item.projectName}
                    </span>
                    <span>·</span>
                    <span>{relativeTime}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
