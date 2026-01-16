import { useMemo, type DragEvent } from 'react';
import { useRoadmapStore } from '../store';
import { useDragDrop } from '../contexts';
import type { RoadmapItem } from '../types';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { formatTargetDate } from '../utils/formatTargetDate';
import clsx from 'clsx';

interface ItemCardProps {
  item: RoadmapItem;
  swimlaneColor: string;
}

export function ItemCard({ item, swimlaneColor }: ItemCardProps) {
  const { ui, setHoveredItem, data, selectItem, setDetailPanelOpen, getSubItemCount, isItemCrossSwimlane, getSwimlane } = useRoadmapStore();
  const { startDrag, endDrag, isDragging, dragData } = useDragDrop();

  const subItemCount = getSubItemCount(item.id);
  const isBeingDragged = isDragging && dragData?.type === 'item' && dragData.id === item.id;
  const isCrossSwimlane = isItemCrossSwimlane(item.id);
  const itemSwimlane = isCrossSwimlane ? getSwimlane(item.swimlaneId) : null;

  const isSelected = ui.selectedItemId === item.id && ui.isDetailPanelOpen;
  const isHovered = ui.hoveredItemId === item.id;
  const isCompleted = item.completed || item.blockerStatus === 'resolved';

  // Check if this card is connected to the currently hovered item
  const isConnectedToHovered = useMemo(() => {
    if (!ui.hoveredItemId || ui.hoveredItemId === item.id) return false;

    const hoveredItem = data?.items.find(i => i.id === ui.hoveredItemId);
    if (!hoveredItem) return false;

    // Check if hovered item depends on this item
    if (hoveredItem.dependsOn?.includes(item.id)) return true;

    // Check if this item depends on hovered item
    if (item.dependsOn?.includes(ui.hoveredItemId)) return true;

    // Check enables relationships
    if (hoveredItem.enables?.includes(item.id)) return true;
    if (item.enables?.includes(ui.hoveredItemId)) return true;

    return false;
  }, [ui.hoveredItemId, item.id, item.dependsOn, item.enables, data?.items]);

  // Determine card shape/style based on type
  const getTypeClass = () => {
    switch (item.type) {
      case 'blocker':
        return 'card-blocker';
      case 'output':
        return 'card-output';
      case 'goal':
        return 'card-goal';
      default:
        return 'card-milestone';
    }
  };

  // Get status indicator for blockers
  const getBlockerStatusClass = () => {
    if (item.type !== 'blocker') return '';
    switch (item.blockerStatus) {
      case 'resolved':
        return 'blocker-resolved';
      case 'mitigated':
        return 'blocker-mitigated';
      default:
        return 'blocker-open';
    }
  };

  // Icon based on type (or win star)
  const getIcon = () => {
    // Special star icon for wins
    if (item.isWin) {
      return (
        <svg className="card-icon card-icon-win" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    switch (item.type) {
      case 'blocker':
        return (
          <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'output':
        return (
          <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
      case 'goal':
        return (
          <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 12h6m-3-3v6" />
          </svg>
        );
    }
  };

  const hasLinks = item.links && item.links.length > 0;
  const hasDependencies = (item.dependsOn && item.dependsOn.length > 0) ||
                         (item.enables && item.enables.length > 0);
  const hasSubItems = subItemCount.total > 0;

  const handleClick = () => {
    // Open the detail panel for this item
    selectItem(item.id);
    setDetailPanelOpen(true);
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!ui.isEditMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    startDrag({
      type: 'item',
      id: item.id,
      sourceStage: item.stage,
      sourceSwimlaneId: item.swimlaneId,
    });
  };

  const handleDragEnd = () => {
    endDrag();
  };

  return (
    <div
      data-item-id={item.id}
      className={clsx(
        'item-card',
        getTypeClass(),
        getBlockerStatusClass(),
        {
          'card-selected': isSelected,
          'card-hovered': isHovered,
          'card-connected': isConnectedToHovered,
          'card-completed': isCompleted,
          'card-win': item.isWin,
          'card-has-links': hasLinks,
          'card-has-dependencies': hasDependencies,
          'card-has-subitems': hasSubItems,
          'card-dragging': isBeingDragged,
        }
      )}
      draggable={ui.isEditMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onMouseEnter={() => setHoveredItem(item.id)}
      onMouseLeave={() => setHoveredItem(null)}
      style={{
        '--card-accent': isCompleted ? '#6B7280' : swimlaneColor,
      } as React.CSSProperties}
    >
      <div className="card-header">
        {getIcon()}
        <span className="card-title">{item.title}</span>
      </div>

      {/* Target date with countdown */}
      {item.targetDate && (() => {
        const { formattedDate, daysText, isPast, isToday } = formatTargetDate(item.targetDate);
        return (
          <div className={clsx('card-target-date', { 'target-past': isPast, 'target-today': isToday })}>
            <svg className="target-date-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span className="target-date-text">{formattedDate}</span>
            <span className="target-date-separator">|</span>
            <span className="target-date-countdown">{daysText}</span>
          </div>
        );
      })()}

      {item.reportedDate && (
        <div className="card-date">{item.reportedDate}</div>
      )}

      {item.type === 'blocker' && item.blockerStatus && (
        <div className={clsx('card-status', `status-${item.blockerStatus}`)}>
          {item.blockerStatus}
        </div>
      )}

      {/* Indicators */}
      <div className="card-indicators">
        {hasSubItems && (
          <span className="indicator indicator-subitems" title={`${subItemCount.completed}/${subItemCount.total} sub-items`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="indicator-count">{subItemCount.total}</span>
          </span>
        )}
        {hasLinks && (
          <span className="indicator indicator-links" title={`${item.links!.length} link(s)`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </span>
        )}
        {hasDependencies && (
          <span className="indicator indicator-deps" title="Has dependencies">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </span>
        )}
        {isSelected && (
          <span className="indicator indicator-selected" title="Selected">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>

      {/* Cross-swimlane badge */}
      {isCrossSwimlane && itemSwimlane && (
        <div
          className="card-swimlane-badge"
          style={{ '--badge-color': itemSwimlane.color } as React.CSSProperties}
        >
          {itemSwimlane.name}
        </div>
      )}

      {/* Last updated */}
      {item.itemLastUpdated && (
        <div className="card-last-updated" title={new Date(item.itemLastUpdated).toLocaleString()}>
          {formatRelativeTime(item.itemLastUpdated)}
        </div>
      )}
    </div>
  );
}
