import { useState, useEffect, type DragEvent } from 'react';
import { useRoadmapStore } from '../store';
import { useDragDrop } from '../contexts';
import type { Swimlane, Stage, RoadmapItem } from '../types';
import { ItemCard } from './ItemCard';
import { ExpandedItemView } from './ExpandedItemView';
import clsx from 'clsx';

interface SwimlaneEditModalProps {
  swimlane: Swimlane;
  onClose: () => void;
}

function SwimlaneEditModal({ swimlane, onClose }: SwimlaneEditModalProps) {
  const { updateSwimlane, deleteSwimlane, data } = useRoadmapStore();
  const [name, setName] = useState(swimlane.name);
  const [color, setColor] = useState(swimlane.color);

  useEffect(() => {
    setName(swimlane.name);
    setColor(swimlane.color);
  }, [swimlane]);

  const handleSave = () => {
    if (name.trim()) {
      updateSwimlane(swimlane.id, { name: name.trim(), color });
      onClose();
    }
  };

  const handleDelete = () => {
    const itemCount = data?.items.filter(i => i.swimlaneId === swimlane.id).length || 0;
    const message = itemCount > 0
      ? `Delete "${swimlane.name}"? This swimlane has ${itemCount} item(s) that will also be deleted.`
      : `Delete "${swimlane.name}"?`;

    if (confirm(message)) {
      deleteSwimlane(swimlane.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Edit Swimlane</h3>

        <div className="modal-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Swimlane name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="modal-field">
          <label>Color</label>
          <div className="color-picker">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <span>{color}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-danger btn-sm" onClick={handleDelete}>
            Delete Swimlane
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface SwimlaneRowProps {
  swimlane: Swimlane;
  stages: { key: Stage; label: string }[];
  isEven: boolean;
  onSwimlaneDragStart?: (e: DragEvent<HTMLDivElement>, swimlaneId: string) => void;
  onSwimlaneDragEnd?: () => void;
  onSwimlaneDragOver?: (e: DragEvent<HTMLDivElement>, swimlaneId: string) => void;
  onSwimlaneDrop?: (e: DragEvent<HTMLDivElement>, targetSwimlaneId: string) => void;
  isSwimlaneDragging?: boolean;
  isDragOverSwimlane?: boolean;
}

export function SwimlaneRow({
  swimlane,
  stages,
  isEven,
  onSwimlaneDragStart,
  onSwimlaneDragEnd,
  onSwimlaneDragOver,
  onSwimlaneDrop,
  isSwimlaneDragging,
  isDragOverSwimlane,
}: SwimlaneRowProps) {
  const {
    data,
    getFilteredItems,
    getArchivedCount,
    getArchivedItems,
    toggleShowArchived,
    unarchiveItem,
    addItem,
    updateItem,
    ui,
  } = useRoadmapStore();

  const { dragData, setDropTarget, isDragging } = useDragDrop();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!data) return null;

  const filteredItems = getFilteredItems();
  const swimlaneItems = filteredItems.filter((i) => i.swimlaneId === swimlane.id);

  // Check if any item in this swimlane is expanded
  const expandedItem = swimlaneItems.find((i) => i.id === ui.expandedItemId);

  // Get archived items info
  const archivedCount = getArchivedCount(swimlane.id);
  const archivedItems = getArchivedItems(swimlane.id);
  const showArchived = ui.showArchivedBySwimlane[swimlane.id] || false;

  // Group items by stage
  const itemsByStage = stages.reduce((acc, stage) => {
    acc[stage.key] = swimlaneItems
      .filter((i) => i.stage === stage.key)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {} as Record<Stage, RoadmapItem[]>);

  const handleAddItem = () => {
    if (newItemTitle.trim()) {
      addItem({
        type: 'milestone',
        title: newItemTitle.trim(),
        stage: 'short-term', // Default to short-term stage
        swimlaneId: swimlane.id,
      });
      setNewItemTitle('');
      setShowAddForm(false);
    }
  };

  // Handle drag over for cells
  const handleCellDragOver = (e: DragEvent<HTMLDivElement>, stage: Stage) => {
    if (!dragData || dragData.type !== 'item') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
    setDropTarget({
      type: 'cell',
      stage,
      swimlaneId: swimlane.id,
    });
  };

  const handleCellDragLeave = () => {
    setDragOverStage(null);
  };

  const handleCellDrop = (e: DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault();
    if (!dragData || dragData.type !== 'item') return;

    const itemId = dragData.id;

    // Update the item's stage and swimlane
    updateItem(itemId, {
      stage,
      swimlaneId: swimlane.id,
    });

    setDragOverStage(null);
  };

  // Handle swimlane row drag for reordering swimlanes
  const handleRowDragStart = (e: DragEvent<HTMLDivElement>) => {
    if (!ui.isEditMode) {
      e.preventDefault();
      return;
    }
    onSwimlaneDragStart?.(e, swimlane.id);
  };

  const handleRowDragOver = (e: DragEvent<HTMLDivElement>) => {
    onSwimlaneDragOver?.(e, swimlane.id);
  };

  const handleRowDrop = (e: DragEvent<HTMLDivElement>) => {
    onSwimlaneDrop?.(e, swimlane.id);
  };

  return (
    <>
      <div
        className={clsx('swimlane-row', {
          'swimlane-even': isEven,
          'swimlane-has-expanded': expandedItem,
          'swimlane-dragging': isSwimlaneDragging,
          'swimlane-drag-over': isDragOverSwimlane,
        })}
        style={{ '--swimlane-color': swimlane.color } as React.CSSProperties}
        onDragOver={handleRowDragOver}
        onDrop={handleRowDrop}
      >
        <div
          className={clsx('swimlane-label', {
            'swimlane-label-draggable': ui.isEditMode,
          })}
          draggable={ui.isEditMode}
          onDragStart={handleRowDragStart}
          onDragEnd={onSwimlaneDragEnd}
        >
          <div
            className="swimlane-color-bar"
            style={{ backgroundColor: swimlane.color }}
          />
          <div className="swimlane-label-content">
            <span className="swimlane-name">
              {ui.isEditMode && (
                <span className="swimlane-drag-handle" title="Drag to reorder">
                  ⋮⋮
                </span>
              )}
              {swimlane.name}
              {ui.isEditMode && (
                <button
                  className="swimlane-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                  title="Edit swimlane"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </span>
            <div className="swimlane-label-actions">
              {archivedCount > 0 && (
                <button
                  className="archived-toggle"
                  onClick={() => toggleShowArchived(swimlane.id)}
                >
                  {archivedCount} completed
                  <span className="archived-toggle-icon">
                    {showArchived ? '▼' : '▶'}
                  </span>
                </button>
              )}
              {ui.isEditMode && (
                <button
                  className="swimlane-add-btn"
                  onClick={() => setShowAddForm(!showAddForm)}
                  title="Add item to this swimlane"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick add form */}
        {showAddForm && ui.isEditMode && (
          <div className="swimlane-add-form">
            <input
              type="text"
              className="swimlane-add-input"
              placeholder="New item title..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
                if (e.key === 'Escape') {
                  setShowAddForm(false);
                  setNewItemTitle('');
                }
              }}
              autoFocus
            />
            <button className="btn-primary btn-sm" onClick={handleAddItem}>
              Add
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => {
                setShowAddForm(false);
                setNewItemTitle('');
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {stages.map((stage) => (
          <div
            key={stage.key}
            className={clsx('swimlane-cell', {
              'cell-drag-over': dragOverStage === stage.key && isDragging && dragData?.type === 'item',
            })}
            onDragOver={(e) => handleCellDragOver(e, stage.key)}
            onDragLeave={handleCellDragLeave}
            onDrop={(e) => handleCellDrop(e, stage.key)}
          >
            {itemsByStage[stage.key].map((item) => (
              <ItemCard key={item.id} item={item} swimlaneColor={swimlane.color} />
            ))}
          </div>
        ))}
      </div>

      {/* Expanded item view - full width below the swimlane row */}
      {expandedItem && (
        <div className="expanded-item-row">
          <ExpandedItemView itemId={expandedItem.id} />
        </div>
      )}

      {/* Archived items section */}
      {showArchived && archivedItems.length > 0 && (
        <div className="archived-items-row">
          <div className="archived-items-header">
            <span className="archived-items-title">
              Completed Items ({archivedCount})
            </span>
          </div>
          <div className="archived-items-list">
            {archivedItems.map((item) => (
              <div key={item.id} className="archived-item">
                <span className="archived-item-title">{item.title}</span>
                <span className="archived-item-stage">{item.stage}</span>
                {ui.isEditMode && (
                  <button
                    className="btn-unarchive"
                    onClick={() => unarchiveItem(item.id)}
                    title="Restore to board"
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit swimlane modal */}
      {showEditModal && (
        <SwimlaneEditModal
          swimlane={swimlane}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
