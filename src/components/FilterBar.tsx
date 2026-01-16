import { useState } from 'react';
import { useRoadmapStore } from '../store';
import type { Stage, ItemType, BlockerStatus } from '../types';
import clsx from 'clsx';

export function FilterBar() {
  const { data, ui, setFilters, resetFilters, toggleDependencyLines } = useRoadmapStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  const { filters } = ui;
  const hasActiveFilters =
    filters.swimlanes.length > 0 ||
    filters.stages.length > 0 ||
    filters.types.length > 0 ||
    filters.blockerStatus.length > 0 ||
    !filters.showCompleted ||
    filters.searchQuery.trim() !== '';

  const toggleFilter = <T extends string>(
    current: T[],
    value: T,
    setter: (values: T[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar-main">
        {/* Search */}
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search items..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
          />
          {filters.searchQuery && (
            <button
              className="search-clear"
              onClick={() => setFilters({ searchQuery: '' })}
            >
              ×
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          className={clsx('filter-toggle', { active: isExpanded || hasActiveFilters })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          <span>Filters</span>
          {hasActiveFilters && <span className="filter-count">●</span>}
        </button>

        {/* Reset */}
        {hasActiveFilters && (
          <button className="filter-reset" onClick={resetFilters}>
            Reset
          </button>
        )}

        {/* Dependency lines toggle */}
        <label className="lines-toggle">
          <span className="lines-toggle-label">Lines</span>
          <button
            className={clsx('toggle-switch', { active: ui.showDependencyLines })}
            onClick={toggleDependencyLines}
            role="switch"
            aria-checked={ui.showDependencyLines}
          >
            <span className="toggle-switch-thumb" />
          </button>
        </label>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="filter-bar-expanded">
          {/* Swimlane filter */}
          <div className="filter-group">
            <label className="filter-label">Swimlanes</label>
            <div className="filter-chips">
              {data.swimlanes.map((swimlane) => (
                <button
                  key={swimlane.id}
                  className={clsx('filter-chip', {
                    active: filters.swimlanes.includes(swimlane.id),
                  })}
                  onClick={() =>
                    toggleFilter(filters.swimlanes, swimlane.id, (v) =>
                      setFilters({ swimlanes: v })
                    )
                  }
                  style={{ '--chip-color': swimlane.color } as React.CSSProperties}
                >
                  {swimlane.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stage filter */}
          <div className="filter-group">
            <label className="filter-label">Stage</label>
            <div className="filter-chips">
              {(['recent', 'short-term', 'long-term'] as Stage[]).map(
                (stage) => (
                  <button
                    key={stage}
                    className={clsx('filter-chip', {
                      active: filters.stages.includes(stage),
                    })}
                    onClick={() =>
                      toggleFilter(filters.stages, stage, (v) =>
                        setFilters({ stages: v })
                      )
                    }
                  >
                    {stage === 'short-term' ? 'Short-term' :
                     stage === 'long-term' ? 'Long-term' : 'Recent'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Type filter */}
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <div className="filter-chips">
              {(['milestone', 'blocker', 'goal', 'output'] as ItemType[]).map(
                (type) => (
                  <button
                    key={type}
                    className={clsx('filter-chip', `chip-${type}`, {
                      active: filters.types.includes(type),
                    })}
                    onClick={() =>
                      toggleFilter(filters.types, type, (v) =>
                        setFilters({ types: v })
                      )
                    }
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Blocker status filter */}
          <div className="filter-group">
            <label className="filter-label">Blocker Status</label>
            <div className="filter-chips">
              {(['open', 'mitigated', 'resolved'] as BlockerStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    className={clsx('filter-chip', `chip-status-${status}`, {
                      active: filters.blockerStatus.includes(status),
                    })}
                    onClick={() =>
                      toggleFilter(filters.blockerStatus, status, (v) =>
                        setFilters({ blockerStatus: v })
                      )
                    }
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Show completed toggle */}
          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.showCompleted}
                onChange={(e) => setFilters({ showCompleted: e.target.checked })}
              />
              <span>Show completed items</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
