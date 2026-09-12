import React from 'react';
import { LiveActivityFeed } from '../components/activity/LiveActivityFeed';

export const ActivityPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 700 }}>Real-Time Activity Feed</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Live WebSocket broadcast of task status changes, team assignments, and delivery milestones.
        </p>
      </div>

      <div style={{ flex: 1, minHeight: '600px' }}>
        <LiveActivityFeed maxHeight="700px" />
      </div>
    </div>
  );
};
