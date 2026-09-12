import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, Share2, RotateCcw, Check } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../../types';

export const TaskFilterBar: React.FC<{ onFilterChange?: () => void }> = ({ onFilterChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const currentStatus = searchParams.get('status') || '';
  const currentPriority = searchParams.get('priority') || '';
  const currentTimeRange = searchParams.get('timeRange') || 'all';
  const currentSearch = searchParams.get('search') || '';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    if (onFilterChange) onFilterChange();
  };

  const handleReset = () => {
    setSearchParams(new URLSearchParams());
    if (onFilterChange) onFilterChange();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasActiveFilters = currentStatus || currentPriority || (currentTimeRange && currentTimeRange !== 'all') || currentSearch;

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1 }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 200px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks by title or details..."
            value={currentSearch}
            onChange={(e) => updateParam('search', e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</label>
          <select
            id="filter-status-select"
            value={currentStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            style={{ minWidth: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Priority:</label>
          <select
            id="filter-priority-select"
            value={currentPriority}
            onChange={(e) => updateParam('priority', e.target.value)}
            style={{ minWidth: '130px' }}
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Timeline:</label>
          <select
            id="filter-timerange-select"
            value={currentTimeRange}
            onChange={(e) => updateParam('timeRange', e.target.value)}
            style={{ minWidth: '130px' }}
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue Only</option>
            <option value="this_week">Due This Week</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              padding: '6px 10px',
              borderRadius: '6px',
            }}
            title="Reset Filters"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Shareable URL Copy Button */}
      <button
        id="copy-shareable-filter-url-btn"
        className="btn btn-secondary btn-sm"
        onClick={handleCopyLink}
        title="Copy filtered view URL to share with team"
      >
        {copied ? <Check size={14} color="#34d399" /> : <Share2 size={14} />}
        <span>{copied ? 'URL Copied!' : 'Share Filter URL'}</span>
      </button>
    </div>
  );
};
