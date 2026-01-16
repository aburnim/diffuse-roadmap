import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Stage } from '../types';

export type DragType = 'item' | 'swimlane';

interface DragData {
  type: DragType;
  id: string;
  sourceStage?: Stage;
  sourceSwimlaneId?: string;
}

interface DropTarget {
  type: 'cell' | 'swimlane';
  stage?: Stage;
  swimlaneId?: string;
  position?: number;
}

interface DragDropContextValue {
  dragData: DragData | null;
  dropTarget: DropTarget | null;
  isDragging: boolean;
  startDrag: (data: DragData) => void;
  setDropTarget: (target: DropTarget | null) => void;
  endDrag: () => void;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

export function DragDropProvider({ children }: { children: ReactNode }) {
  const [dragData, setDragData] = useState<DragData | null>(null);
  const [dropTarget, setDropTargetState] = useState<DropTarget | null>(null);

  const startDrag = useCallback((data: DragData) => {
    setDragData(data);
  }, []);

  const setDropTarget = useCallback((target: DropTarget | null) => {
    setDropTargetState(target);
  }, []);

  const endDrag = useCallback(() => {
    setDragData(null);
    setDropTargetState(null);
  }, []);

  return (
    <DragDropContext.Provider
      value={{
        dragData,
        dropTarget,
        isDragging: dragData !== null,
        startDrag,
        setDropTarget,
        endDrag,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}
