import { useState, useMemo } from 'react';
import { useRoadmapStore } from '../store';
import type { RoadmapItem } from '../types';
import clsx from 'clsx';

interface DependencyPickerProps {
  currentItemId: string;
  excludeIds: string[];
  onSelect: (itemId: string) => void;
  onClose: () => void;
}

export function DependencyPicker({
  currentItemId,
  excludeIds,
  onSelect,
  onClose,
}: DependencyPickerProps) {
  const { data } = useRoadmapStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Get potential dependencies grouped by swimlane
  const groupedItems = useMemo(() => {
    if (!data) return [];

    const potentialDeps = data.items.filter(
      (i) =>
        i.id !== currentItemId &&
        !excludeIds.includes(i.id) &&
        !i.archived
    );

    // Filter by search query
    const filtered = searchQuery.trim()
      ? potentialDeps.filter(
          (i) =>
            i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : potentialDeps;

    // Group by swimlane
    const sortedSwimlanes = [...data.swimlanes].sort((a, b) => a.order - b.order);

    return sortedSwimlanes
      .map((swimlane) => ({
        swimlane,
        items: filtered
          .filter((i) => i.swimlaneId === swimlane.id)
          .sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .filter((group) => group.items.length > 0);
  }, [data, currentItemId, excludeIds, searchQuery]);

  const totalCount = groupedItems.reduce((sum, g) => sum + g.items.length, 0);

  const getTypeIcon = (item: RoadmapItem) => {
    switch (item.type) {
      case 'milestone':
        return '◆';
      case 'blocker':
        return '⚠';
      case 'goal':
        return '◎';
      case 'output':
        return '📄';
      default:
        return '•';
    }
  };

  return (
    <div className="dependency-picker-overlay" onClick={onClose}>
      <div className="dependency-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dependency-picker-header">
          <h3>Select Dependency</h3>
          <button className="btn-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="dependency-picker-search">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        <div className="dependency-picker-content">
          {groupedItems.length === 0 ? (
            <div className="dependency-picker-empty">
              {searchQuery ? 'No items match your search' : 'No available items to link'}
            </div>
          ) : (
            groupedItems.map(({ swimlane, items }) => (
              <div key={swimlane.id} className="dependency-picker-group">
                <div
                  className="dependency-picker-group-header"
                  style={{ borderLeftColor: swimlane.color }}
                >
                  <span
                    className="swimlane-dot"
                    style={{ backgroundColor: swimlane.color }}
                  />
                  {swimlane.name}
                  <span className="item-count">({items.length})</span>
                </div>
                <div className="dependency-picker-items">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      className={clsx('dependency-picker-card', `type-${item.type}`)}
                      onClick={() => onSelect(item.id)}
                    >
                      <span className="card-icon">{getTypeIcon(item)}</span>
                      <span className="card-title">{item.title}</span>
                      <span className={clsx('card-type', `type-${item.type}`)}>
                        {item.type}
                      </span>
                      {item.type === 'blocker' && item.blockerStatus && (
                        <span className={clsx('card-status', `status-${item.blockerStatus}`)}>
                          {item.blockerStatus}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="dependency-picker-footer">
          <span className="total-count">{totalCount} items available</span>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
