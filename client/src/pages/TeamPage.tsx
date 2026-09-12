import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RoleBadge } from '../components/common/Badge';
import { Users, Mail, CheckSquare, FolderKanban } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('users').then((res) => {
      if (res.success && res.data) {
        setUsers(res.data.users);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Team Directory</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Internal agency roster, assigned project managers, and engineering squads.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {users.map((u) => (
          <div
            key={u.id}
            className="glass-card"
            style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)' }}>
                  {u.name.charAt(0)}
                </span>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                  {u.name}
                </h3>
                <RoleBadge role={u.role} />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                <Mail size={13} />
                <span>{u.email}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}
              >
                {u.role === 'PM' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FolderKanban size={13} color="var(--secondary)" />
                    <span>{u._count?.projects ?? 0} Projects</span>
                  </div>
                )}
                {u.role === 'DEVELOPER' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckSquare size={13} color="#34d399" />
                    <span>{u._count?.tasks ?? 0} Tasks Assigned</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
