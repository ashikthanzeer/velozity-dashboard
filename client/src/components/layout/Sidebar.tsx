import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  Briefcase,
  Users,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAdmin, isPM } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/tasks', label: 'Tasks Board', icon: CheckSquare },
    { to: '/activity', label: 'Live Feed', icon: Activity },
    ...((isAdmin || isPM) ? [{ to: '/clients', label: 'Clients', icon: Briefcase }] : []),
    ...(isAdmin ? [{ to: '/team', label: 'Team Directory', icon: Users }] : []),
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'rgba(15, 20, 34, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        gap: '8px',
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px 8px' }}>
        Navigation
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Velozity Agency v1.0<br />
          PostgreSQL · Socket.io · RBAC
        </p>
      </div>
    </aside>
  );
};
