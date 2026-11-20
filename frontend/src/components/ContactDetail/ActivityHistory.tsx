import React from 'react';
import { History, RefreshCw, UserCheck, Tag, MinusCircle, AlertCircle } from 'lucide-react';
import type { Activity, ActivityType } from '../../types/contact';

interface ActivityHistoryProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return isoString;

    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays}d ago`;

    return new Date(isoString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function formatFullDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; colorClass: string }
> = {
  CONTACT_UPDATED: {
    label: 'Contact updated',
    icon: UserCheck,
    colorClass: 'timeline-type-update',
  },
  TAG_ADDED: {
    label: 'Tag added',
    icon: Tag,
    colorClass: 'timeline-type-add',
  },
  TAG_REMOVED: {
    label: 'Tag removed',
    icon: MinusCircle,
    colorClass: 'timeline-type-remove',
  },
};

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  activities,
  loading,
  error,
  onRetry,
}) => {
  return (
    <div className="card activity-history-card">
      <div className="card-header">
        <div className="flex-header">
          <History size={18} />
          <h3>Activity History</h3>
          <span className="activity-count-badge">{activities.length}</span>
        </div>
      </div>

      <div className="activity-content-body">
        {loading && activities.length === 0 ? (
          <div className="activity-skeleton-list">
            <div className="skeleton-cell w-full mb-3" style={{ height: '36px' }} />
            <div className="skeleton-cell w-full mb-3" style={{ height: '36px' }} />
            <div className="skeleton-cell w-full" style={{ height: '36px' }} />
          </div>
        ) : error ? (
          <div className="activity-error-state">
            <AlertCircle size={20} className="error-icon" />
            <p className="error-msg">{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="activity-empty-state">
            <History size={28} className="empty-icon" />
            <p className="empty-title">No activity recorded yet</p>
            <p className="empty-subtitle">Updates and tag assignments will appear here automatically.</p>
          </div>
        ) : (
          <div className="timeline-container">
            {activities.map((activity, index) => {
              const config = ACTIVITY_CONFIG[activity.type] || {
                label: activity.type,
                icon: History,
                colorClass: 'timeline-type-default',
              };
              const IconComponent = config.icon;

              return (
                <div key={activity.id || index} className="timeline-item">
                  <div className={`timeline-marker ${config.colorClass}`}>
                    <IconComponent size={14} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-main-row">
                      <span className="timeline-label">{config.label}</span>
                      <time
                        className="timeline-relative-time"
                        dateTime={activity.timestamp}
                        title={formatFullDate(activity.timestamp)}
                      >
                        {formatRelativeTime(activity.timestamp)}
                      </time>
                    </div>
                    <span className="timeline-full-date">{formatFullDate(activity.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
