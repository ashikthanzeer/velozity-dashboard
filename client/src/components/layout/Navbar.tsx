import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { RoleBadge } from '../common/Badge';
import { LogOut, Users, Zap, Shield, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, switchUserRole, isAdmin } = useAuth();
  const { onlineCount, isConnected } = useSocket();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const demoAccounts = [
    { label: 'Alex Mercer (Admin)', email: 'admin@velozity.com', pass: 'AdminPass123!', role: 'ADMIN' },
    { label: 'Priya Sharma (PM 1)', email: 'pm1@velozity.com', pass: 'PMPass123!', role: 'PM' },
    { label: 'Marcus Vance (PM 2)', email: 'pm2@velozity.com', pass: 'PMPass123!', role: 'PM' },
    { label: 'Ravi Patel (Dev 1)', email: 'dev1@velozity.com', pass: 'DevPass123!', role: 'DEVELOPER' },
    { label: 'Elena Rostova (Dev 2)', email: 'dev2@velozity.com', pass: 'DevPass123!', role: 'DEVELOPER' },
  ];

  const handleRoleSwitch = async (email: string, pass: string) => {
    setRoleSwitcherOpen(false);
    await switchUserRole(email, pass);
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'rgba(15, 20, 34, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Zap size={20} color="#ffffff" />
        </div>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(to right, #ffffff, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            VELOZITY
          </span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--secondary)',
              marginLeft: '6px',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            STUDIO
          </span>
        </div>
      </div>

      {/* Center/Right items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Presence Counter (for Admin or global visibility) */}
        {isAdmin && (
          <div
            id="admin-online-presence-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#34d399',
              fontWeight: 600,
            }}
            title="Live WebSocket Presence Count"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#34d399',
                display: 'inline-block',
                animation: 'pulse-border 2s infinite',
              }}
            />
            <Users size={13} />
            <span>{onlineCount} Online</span>
          </div>
        )}

        {/* Quick Role Switcher for Test / Evaluation */}
        <div style={{ position: 'relative' }}>
          <button
            id="quick-role-switcher-btn"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              color: '#c7d2fe',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <Shield size={13} />
            <span>Switch Test Role</span>
            <ChevronDown size={13} />
          </button>

          {roleSwitcherOpen && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                backgroundColor: '#121829',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '6px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                EVALUATION QUICK SWITCH
              </div>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleRoleSwitch(acc.email, acc.pass)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: user?.email === acc.email ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: user?.email === acc.email ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span>{acc.label}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{acc.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown />

        {/* User Info & Role */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>
                  {user.name.charAt(0)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {user.name}
              </span>
              <div style={{ marginTop: '2px' }}>
                <RoleBadge role={user.role} />
              </div>
            </div>

            {/* Logout button */}
            <button
              id="logout-btn"
              onClick={() => logout()}
              style={{
                padding: '8px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
              }}
              title="Sign Out"
              onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
