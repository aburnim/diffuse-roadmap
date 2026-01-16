import { useState } from 'react';
import { useRoadmapStore } from '../store';
import type { Priority, SubItem } from '../types';
import { DEFAULT_STATUS_TAGS } from '../types';
import clsx from 'clsx';

interface SubItemRoadmapProps {
  itemId: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#6B7280',
};

export function SubItemRoadmap({ itemId }: SubItemRoadmapProps) {
  const {
    getItem,
    getSubStages,
    getSubSwimlanes,
    ui,
    addSubItem,
    updateSubItem,
    deleteSubItem,
    toggleSubItem,
    addSubStage,
    updateSubStage,
    deleteSubStage,
    addSubSwimlane,
    deleteSubSwimlane,
  } = useRoadmapStore();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showAddSwimlane, setShowAddSwimlane] = useState(false);
  const [newSwimlaneName, setNewSwimlaneName] = useState('');
  const [newSwimlaneColor, setNewSwimlaneColor] = useState('#6366F1');
  const [addingToCell, setAddingToCell] = useState<{ stageId: string; swimlaneId?: string } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState('');

  const item = getItem(itemId);
  if (!item) return null;

  const stages = getSubStages(itemId);
  const swimlanes = getSubSwimlanes(itemId);
  const subItems = item.subItems || [];
  const statusTags = item.subItemConfig?.customStatusTags || DEFAULT_STATUS_TAGS;

  const getItemsForCell = (stageId: string, swimlaneId?: string): SubItem[] => {
    return subItems
      .filter((s) => {
        const stageMatch = s.subStageId === stageId || (!s.subStageId && stageId === stages[0]?.id);
        const swimlaneMatch = swimlaneId
          ? s.subSwimlaneId === swimlaneId
          : !s.subSwimlaneId || swimlanes.length === 0;
        return stageMatch && swimlaneMatch;
      })
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (subItemId: string) => {
    setDraggedItem(subItemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string, swimlaneId?: string) => {
    e.preventDefault();
    if (draggedItem) {
      updateSubItem(itemId, draggedItem, {
        subStageId: stageId,
        subSwimlaneId: swimlaneId,
      });
      setDraggedItem(null);
    }
  };

  const handleAddSwimlane = () => {
    if (newSwimlaneName.trim()) {
      addSubSwimlane(itemId, newSwimlaneName.trim(), newSwimlaneColor);
      setNewSwimlaneName('');
      setNewSwimlaneColor('#6366F1');
      setShowAddSwimlane(false);
    }
  };

  const handleAddTask = () => {
    if (addingToCell && newTaskTitle.trim()) {
      addSubItem(itemId, newTaskTitle.trim());
      // Get the newly added item and update its position
      setTimeout(() => {
        const updatedItem = getItem(itemId);
        const newSubItem = updatedItem?.subItems?.[updatedItem.subItems.length - 1];
        if (newSubItem) {
          updateSubItem(itemId, newSubItem.id, {
            subStageId: addingToCell.stageId,
            subSwimlaneId: addingToCell.swimlaneId,
          });
        }
      }, 0);
      setNewTaskTitle('');
      setAddingToCell(null);
    }
  };

  const handleEditStage = (stageId: string, currentName: string) => {
    setEditingStageId(stageId);
    setEditStageName(currentName);
  };

  const handleSaveStageEdit = () => {
    if (editingStageId && editStageName.trim()) {
      updateSubStage(itemId, editingStageId, { label: editStageName.trim() });
    }
    setEditingStageId(null);
    setEditStageName('');
  };

  const renderCell = (stageId: string, swimlaneId?: string, swimlaneColor?: string) => {
    const cellItems = getItemsForCell(stageId, swimlaneId);

    return (
      <div
        className={clsx('roadmap-cell', { 'drag-over': draggedItem })}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, stageId, swimlaneId)}
      >
        {cellItems.map((subItem) => {
          const statusTag = statusTags.find((t) => t.id === subItem.statusTagId);
          const priorityColor = subItem.priority ? PRIORITY_COLORS[subItem.priority] : null;

          return (
            <div
              key={subItem.id}
              className={clsx('roadmap-item', {
                completed: subItem.completed,
                dragging: draggedItem === subItem.id,
              })}
              style={{
                borderLeftColor: priorityColor || swimlaneColor || '#6B7280',
              }}
              draggable={ui.isEditMode}
              onDragStart={() => handleDragStart(subItem.id)}
            >
              <div className="item-header">
                <label className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={subItem.completed}
                    onChange={() => toggleSubItem(itemId, subItem.id)}
                    disabled={!ui.isEditMode}
                  />
                </label>
                <span className="item-title">{subItem.title}</span>
              </div>
              <div className="item-meta">
                {statusTag && (
                  <span
                    className="item-status"
                    style={{ backgroundColor: statusTag.color }}
                  >
                    {statusTag.label}
                  </span>
                )}
                {ui.isEditMode && (
                  <button
                    className="btn-remove-tiny"
                    onClick={() => deleteSubItem(itemId, subItem.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add task button */}
        {ui.isEditMode && (
          <>
            {addingToCell?.stageId === stageId && addingToCell?.swimlaneId === swimlaneId ? (
              <div className="add-item-form">
                <input
                  type="text"
                  className="add-item-input"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask();
                    if (e.key === 'Escape') {
                      setAddingToCell(null);
                      setNewTaskTitle('');
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <button
                className="add-item-btn"
                onClick={() => setAddingToCell({ stageId, swimlaneId })}
              >
                +
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="sub-roadmap">
      {/* Stage headers */}
      <div className="roadmap-header">
        <div className="swimlane-label-cell" />
        {stages.map((stage) => (
          <div key={stage.id} className="stage-header-cell">
            {editingStageId === stage.id ? (
              <input
                type="text"
                className="stage-name-input"
                value={editStageName}
                onChange={(e) => setEditStageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveStageEdit();
                  if (e.key === 'Escape') {
                    setEditingStageId(null);
                    setEditStageName('');
                  }
                }}
                onBlur={handleSaveStageEdit}
                autoFocus
              />
            ) : (
              <span
                className="stage-name"
                onDoubleClick={() =>
                  ui.isEditMode && handleEditStage(stage.id, stage.label)
                }
              >
                {stage.label}
              </span>
            )}
            {ui.isEditMode && stages.length > 1 && (
              <button
                className="btn-remove-tiny"
                onClick={() => deleteSubStage(itemId, stage.id)}
                title="Delete column"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {ui.isEditMode && (
          <div className="stage-header-cell add-stage">
            <button
              className="btn-text-small"
              onClick={() => addSubStage(itemId, 'New Stage')}
            >
              + Add
            </button>
          </div>
        )}
      </div>

      {/* Grid body */}
      <div className="roadmap-body">
        {/* If no swimlanes, show a single row */}
        {swimlanes.length === 0 ? (
          <div className="roadmap-row">
            <div className="swimlane-label-cell">
              <span className="swimlane-label-text">Tasks</span>
            </div>
            {stages.map((stage) => (
              <div key={stage.id} className="stage-cell">
                {renderCell(stage.id)}
              </div>
            ))}
            {ui.isEditMode && <div className="stage-cell spacer" />}
          </div>
        ) : (
          /* Show swimlane rows */
          swimlanes.map((swimlane) => (
            <div key={swimlane.id} className="roadmap-row">
              <div className="swimlane-label-cell">
                <div
                  className="swimlane-color-indicator"
                  style={{ backgroundColor: swimlane.color }}
                />
                <span className="swimlane-label-text">{swimlane.name}</span>
                {ui.isEditMode && (
                  <button
                    className="btn-remove-tiny"
                    onClick={() => deleteSubSwimlane(itemId, swimlane.id)}
                    title="Delete swimlane"
                  >
                    ×
                  </button>
                )}
              </div>
              {stages.map((stage) => (
                <div key={stage.id} className="stage-cell">
                  {renderCell(stage.id, swimlane.id, swimlane.color)}
                </div>
              ))}
              {ui.isEditMode && <div className="stage-cell spacer" />}
            </div>
          ))
        )}

        {/* Add swimlane row */}
        {ui.isEditMode && (
          <div className="roadmap-row add-swimlane-row">
            {showAddSwimlane ? (
              <div className="add-swimlane-form">
                <input
                  type="color"
                  className="swimlane-color-picker"
                  value={newSwimlaneColor}
                  onChange={(e) => setNewSwimlaneColor(e.target.value)}
                />
                <input
                  type="text"
                  className="swimlane-name-input"
                  placeholder="Swimlane name..."
                  value={newSwimlaneName}
                  onChange={(e) => setNewSwimlaneName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSwimlane();
                    if (e.key === 'Escape') {
                      setShowAddSwimlane(false);
                      setNewSwimlaneName('');
                    }
                  }}
                  autoFocus
                />
                <button className="btn-primary btn-xs" onClick={handleAddSwimlane}>
                  Add
                </button>
                <button
                  className="btn-secondary btn-xs"
                  onClick={() => {
                    setShowAddSwimlane(false);
                    setNewSwimlaneName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="add-swimlane-btn"
                onClick={() => setShowAddSwimlane(true)}
              >
                + Add swimlane
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
