import { useRef, useEffect, useState, useCallback, type DragEvent } from 'react';
import { useRoadmapStore } from '../store';
import type { Stage, ViewType } from '../types';
import { SwimlaneRow } from './SwimlaneRow';
import { DependencyLines } from './DependencyLines';
import { DetailPanel } from './DetailPanel';
import { FilterBar } from './FilterBar';
import { Header } from './Header';
import { RecentUpdatesTimeline } from './RecentUpdatesTimeline';
import { HowToUse } from './HowToUse';
import clsx from 'clsx';

const STAGES: { key: Stage; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'short-term', label: 'Short-term' },
  { key: 'long-term', label: 'Long-term' },
];

// Position relative to board container
interface ItemPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

const VIEW_TABS: { key: ViewType; label: string }[] = [
  { key: 'board', label: 'Board' },
  { key: 'recent', label: 'Recent Updates' },
  { key: 'guide', label: 'How to Use' },
];

export function Board() {
  const { data, ui, reorderSwimlanes, getFilteredSwimlanes, setCurrentView } = useRoadmapStore();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [itemPositions, setItemPositions] = useState<Map<string, ItemPosition>>(new Map());
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  // Swimlane drag state
  const [draggingSwimlaneId, setDraggingSwimlaneId] = useState<string | null>(null);
  const [dragOverSwimlaneId, setDragOverSwimlaneId] = useState<string | null>(null);

  // Update item positions for dependency lines
  const updatePositions = useCallback(() => {
    if (!boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const positions = new Map<string, ItemPosition>();

    const cards = boardRef.current.querySelectorAll('[data-item-id]');
    cards.forEach((card) => {
      const id = card.getAttribute('data-item-id');
      if (id) {
        const cardRect = card.getBoundingClientRect();
        // Calculate position relative to board
        positions.set(id, {
          left: cardRect.left - boardRect.left,
          top: cardRect.top - boardRect.top,
          width: cardRect.width,
          height: cardRect.height,
        });
      }
    });

    setItemPositions(positions);
    setBoardSize({
      width: boardRef.current.scrollWidth,
      height: boardRef.current.scrollHeight,
    });
  }, []);

  useEffect(() => {
    updatePositions();

    // Listen for resize
    window.addEventListener('resize', updatePositions);

    // Listen for scroll on wrapper
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('scroll', updatePositions);
    }

    return () => {
      window.removeEventListener('resize', updatePositions);
      if (wrapper) {
        wrapper.removeEventListener('scroll', updatePositions);
      }
    };
  }, [updatePositions, data]);

  // Re-calculate positions when data or filters change
  useEffect(() => {
    const timer = setTimeout(updatePositions, 100);
    return () => clearTimeout(timer);
  }, [data?.items, ui.filters, updatePositions]);

  // Swimlane drag handlers
  const handleSwimlaneDragStart = (e: DragEvent<HTMLDivElement>, swimlaneId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `swimlane:${swimlaneId}`);
    setDraggingSwimlaneId(swimlaneId);
  };

  const handleSwimlaneDragEnd = () => {
    setDraggingSwimlaneId(null);
    setDragOverSwimlaneId(null);
  };

  const handleSwimlaneDragOver = (e: DragEvent<HTMLDivElement>, swimlaneId: string) => {
    if (!draggingSwimlaneId || draggingSwimlaneId === swimlaneId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSwimlaneId(swimlaneId);
  };

  const handleSwimlaneDrop = (e: DragEvent<HTMLDivElement>, targetSwimlaneId: string) => {
    e.preventDefault();
    if (!draggingSwimlaneId || !data) return;

    const sortedSwimlanes = [...data.swimlanes].sort((a, b) => a.order - b.order);
    const swimlaneIds = sortedSwimlanes.map((s) => s.id);

    const fromIndex = swimlaneIds.indexOf(draggingSwimlaneId);
    const toIndex = swimlaneIds.indexOf(targetSwimlaneId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      handleSwimlaneDragEnd();
      return;
    }

    // Reorder the array
    const newOrder = [...swimlaneIds];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggingSwimlaneId);

    reorderSwimlanes(newOrder);
    handleSwimlaneDragEnd();
  };

  if (!data) {
    return (
      <div className="board-empty">
        <p>No roadmap data loaded</p>
      </div>
    );
  }

  // Use filtered swimlanes (respects swimlane filter and includes dependency-connected swimlanes)
  const filteredSwimlanes = getFilteredSwimlanes();

  return (
    <div className="board-container">
      <Header />

      {/* View tabs */}
      <div className="view-tabs">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            className={clsx('view-tab', { 'view-tab-active': ui.currentView === tab.key })}
            onClick={() => setCurrentView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Only show FilterBar on board view */}
      {ui.currentView === 'board' && <FilterBar />}

      {/* Render current view */}
      {ui.currentView === 'board' && (
        <div className="board-wrapper" ref={wrapperRef}>
          <div className="board" ref={boardRef}>
            {/* Stage headers */}
            <div className="stage-headers">
              <div className="swimlane-label-spacer" />
              {STAGES.map((stage) => (
                <div key={stage.key} className="stage-header">
                  {stage.label}
                </div>
              ))}
            </div>

            {/* Swimlanes */}
            <div className="swimlanes">
              {filteredSwimlanes.map((swimlane, index) => (
                <SwimlaneRow
                  key={swimlane.id}
                  swimlane={swimlane}
                  stages={STAGES}
                  isEven={index % 2 === 0}
                  onSwimlaneDragStart={handleSwimlaneDragStart}
                  onSwimlaneDragEnd={handleSwimlaneDragEnd}
                  onSwimlaneDragOver={handleSwimlaneDragOver}
                  onSwimlaneDrop={handleSwimlaneDrop}
                  isSwimlaneDragging={draggingSwimlaneId === swimlane.id}
                  isDragOverSwimlane={dragOverSwimlaneId === swimlane.id}
                />
              ))}
            </div>

            {/* Dependency lines overlay */}
            {ui.showDependencyLines && (
              <DependencyLines
                itemPositions={itemPositions}
                boardSize={boardSize}
              />
            )}
          </div>
        </div>
      )}

      {ui.currentView === 'recent' && <RecentUpdatesTimeline />}

      {ui.currentView === 'guide' && <HowToUse />}

      {/* Detail panel */}
      <DetailPanel />
    </div>
  );
}
