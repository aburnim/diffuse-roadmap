import { useMemo } from 'react';
import { useRoadmapStore } from '../store';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import type { ChangeType } from '../types';
import clsx from 'clsx';

// Get human-readable label for change type
function getChangeLabel(type: ChangeType): string {
  switch (type) {
    case 'created':
      return 'Created';
    case 'completed':
      return 'Completed';
    case 'archived':
      return 'Archived';
    case 'unarchived':
      return 'Restored';
    case 'status_changed':
      return 'Status changed';
    case 'stage_changed':
      return 'Moved';
    case 'link_added':
      return 'Link added';
    case 'subitem_added':
      return 'Task added';
    case 'subitem_completed':
      return 'Task completed';
    case 'marked_win':
      return 'Marked as win';
    case 'output_added':
      return 'Output published';
    default:
      return 'Updated';
  }
}

// Check if this is a "big" change (wins, outputs) that should be highlighted
function isBigChange(type: ChangeType): boolean {
  return type === 'marked_win' || type === 'output_added' || type === 'completed';
}

export function RecentUpdatesTimeline() {
  const { data, ui, getSwimlane, selectItem, setDetailPanelOpen } = useRoadmapStore();

  const recentItems = useMemo(() => {
    if (!data) return [];

    // Get non-archived items with lastUpdated timestamps
    const itemsWithDates = data.items
      .filter((item) => !item.archived && item.itemLastUpdated)
      .map((item) => ({
        ...item,
        updatedAt: new Date(item.itemLastUpdated!).getTime(),
        // Get the most recent change from the log
        latestChange: item.changeLog?.length
          ? item.changeLog[item.changeLog.length - 1]
          : undefined,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);

    return itemsWithDates;
  }, [data]);

  if (!data || recentItems.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No recently updated items</p>
        <p className="timeline-empty-hint">
          Items will appear here when they are edited
        </p>
      </div>
    );
  }

  // Get the icon for item type
  const getIcon = (item: (typeof recentItems)[0]) => {
    if (item.isWin) {
      return (
        <svg className="timeline-icon timeline-icon-win" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    switch (item.type) {
      case 'blocker':
        return (
          <svg className="timeline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'output':
        return (
          <svg className="timeline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
      case 'goal':
        return (
          <svg className="timeline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="timeline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12h6m-3-3v6" />
          </svg>
        );
    }
  };

  const getTypeClass = (item: (typeof recentItems)[0]) => {
    switch (item.type) {
      case 'blocker':
        return 'timeline-item-blocker';
      case 'output':
        return 'timeline-item-output';
      case 'goal':
        return 'timeline-item-goal';
      default:
        return 'timeline-item-milestone';
    }
  };

  return (
    <div className="timeline-container">
      <div className="timeline">
        {recentItems.map((item, index) => {
          const swimlane = getSwimlane(item.swimlaneId);
          const isSelected = ui.selectedItemId === item.id && ui.isDetailPanelOpen;
          const isCompleted = item.completed || item.blockerStatus === 'resolved';
          const latestChange = item.latestChange;
          const isBig = latestChange && isBigChange(latestChange.type);

          const handleClick = () => {
            selectItem(item.id);
            setDetailPanelOpen(true);
          };

          return (
            <div
              key={item.id}
              className={clsx('timeline-item', getTypeClass(item), {
                'timeline-item-expanded': isSelected,
                'timeline-item-completed': isCompleted,
                'timeline-item-win': item.isWin,
                'timeline-item-big-change': isBig,
              })}
              onClick={handleClick}
            >
              {/* Swimlane badge - positioned over top of card */}
              {swimlane && (
                <div
                  className="timeline-swimlane-badge"
                  style={{ '--badge-color': swimlane.color } as React.CSSProperties}
                >
                  {swimlane.name}
                </div>
              )}

              {/* Card content */}
              <div
                className="timeline-card"
                style={{ '--card-accent': swimlane?.color || '#58a6ff' } as React.CSSProperties}
              >
                <div className="timeline-card-header">
                  {getIcon(item)}
                  <span className="timeline-card-title">{item.title}</span>
                </div>

                {!latestChange && item.description && (
                  <div className="timeline-card-description">
                    {item.description.slice(0, 100)}
                    {item.description.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>

              {/* Footer with change label and timestamp */}
              <div className="timeline-footer">
                {latestChange ? (
                  <div className={clsx('timeline-change', {
                    'timeline-change-big': isBig,
                    'timeline-change-win': latestChange.type === 'marked_win',
                    'timeline-change-output': latestChange.type === 'output_added',
                    'timeline-change-completed': latestChange.type === 'completed',
                  })}>
                    <span className="timeline-change-label">
                      {getChangeLabel(latestChange.type)}
                    </span>
                  </div>
                ) : (
                  <div className="timeline-change">
                    <span className="timeline-change-label">Updated</span>
                  </div>
                )}
                <span className="timeline-footer-timestamp">
                  {formatRelativeTime(item.itemLastUpdated!)}
                </span>
              </div>

              {/* Connector line to next item */}
              {index < recentItems.length - 1 && (
                <div className="timeline-connector" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
