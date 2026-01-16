import { useMemo } from 'react';
import { useRoadmapStore } from '../store';
import clsx from 'clsx';

interface ItemPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DependencyLinesProps {
  itemPositions: Map<string, ItemPosition>;
  boardSize: { width: number; height: number };
}

interface Edge {
  id: string;
  fromId: string;
  toId: string;
  fromPos: ItemPosition;
  toPos: ItemPosition;
  type: 'dependency' | 'blocker';
  isHighlighted: boolean;
}

export function DependencyLines({ itemPositions, boardSize }: DependencyLinesProps) {
  const { data, ui, getFilteredItems } = useRoadmapStore();

  const edges = useMemo(() => {
    if (!data || itemPositions.size === 0) return [];

    const filteredItems = getFilteredItems();
    const filteredIds = new Set(filteredItems.map((i) => i.id));

    // Only consider items that are both filtered AND have positions (are actually rendered)
    const visibleIds = new Set(
      Array.from(itemPositions.keys()).filter((id) => filteredIds.has(id))
    );

    const result: Edge[] = [];

    filteredItems.forEach((item) => {
      // Skip if this item isn't visible
      if (!visibleIds.has(item.id)) return;

      // Dependencies (item depends on other items)
      if (item.dependsOn) {
        item.dependsOn.forEach((depId) => {
          // Only draw line if dependency is also visible
          if (!visibleIds.has(depId)) return;

          const fromPos = itemPositions.get(depId);
          const toPos = itemPositions.get(item.id);

          if (fromPos && toPos) {
            const depItem = data.items.find((i) => i.id === depId);
            const isBlocker = depItem?.type === 'blocker';
            const isHighlighted =
              ui.hoveredItemId === item.id ||
              ui.hoveredItemId === depId ||
              ui.selectedItemId === item.id ||
              ui.selectedItemId === depId;

            result.push({
              id: `${depId}-${item.id}`,
              fromId: depId,
              toId: item.id,
              fromPos,
              toPos,
              type: isBlocker ? 'blocker' : 'dependency',
              isHighlighted,
            });
          }
        });
      }
    });

    return result;
  }, [data, itemPositions, ui.hoveredItemId, ui.selectedItemId, getFilteredItems]);

  if (edges.length === 0 || boardSize.width === 0) return null;

  // Calculate path for curved lines connecting right edge of source to left edge of target
  const calculatePath = (edge: Edge) => {
    // Source: right edge center
    const fromX = edge.fromPos.left + edge.fromPos.width;
    const fromY = edge.fromPos.top + edge.fromPos.height / 2;
    // Target: left edge center
    const toX = edge.toPos.left;
    const toY = edge.toPos.top + edge.toPos.height / 2;

    const dx = toX - fromX;
    const dy = toY - fromY;

    let path: string;

    // Control point offset for the bezier curve
    const curveOffset = Math.min(Math.abs(dx) * 0.4, 100);

    if (dx > 0) {
      // Target is to the right of source - simple S-curve
      path = `M ${fromX} ${fromY}
              C ${fromX + curveOffset} ${fromY}, ${toX - curveOffset} ${toY}, ${toX} ${toY}`;
    } else {
      // Target is to the left of source - need to go around
      const verticalOffset = Math.abs(dy) < 50 ? 60 : Math.abs(dy) * 0.5;
      const direction = dy >= 0 ? 1 : -1;

      path = `M ${fromX} ${fromY}
              C ${fromX + 40} ${fromY}, ${fromX + 40} ${fromY + direction * verticalOffset}, ${(fromX + toX) / 2} ${fromY + direction * verticalOffset}
              S ${toX - 40} ${toY}, ${toX} ${toY}`;
    }

    return { path, fromX, fromY, toX, toY };
  };

  return (
    <svg
      className="dependency-lines"
      width={boardSize.width}
      height={boardSize.height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1, // Below cards (cards have default z-index)
      }}
    >
      {/* Definitions for filters */}
      <defs>
        {/* Glow filter for highlighted lines */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render edges */}
      {edges.map((edge) => {
        const { path } = calculatePath(edge);

        const lineColor = edge.type === 'blocker' ? '#F85149' : '#58A6FF';

        return (
          <g key={edge.id}>
            {/* Background glow for highlighted lines */}
            {edge.isHighlighted && (
              <path
                d={path}
                className="dependency-line-glow"
                style={{
                  fill: 'none',
                  stroke: lineColor,
                  strokeWidth: 6,
                  opacity: 0.3,
                  filter: 'url(#glow)',
                }}
              />
            )}

            {/* Main line */}
            <path
              d={path}
              className={clsx('dependency-line', {
                'line-highlighted': edge.isHighlighted,
                'line-blocker': edge.type === 'blocker',
              })}
            />
          </g>
        );
      })}
    </svg>
  );
}
