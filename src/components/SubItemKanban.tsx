import { useState } from 'react';
import { useRoadmapStore } from '../store';
import type { Priority, SubItem } from '../types';
import { DEFAULT_STATUS_TAGS } from '../types';
import clsx from 'clsx';

interface SubItemKanbanProps {
  itemId: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; short: string }> = {
  critical: { label: 'Critical', color: '#EF4444', short: '!!' },
  high: { label: 'High', color: '#F97316', short: '!' },
  medium: { label: 'Medium', color: '#EAB308', short: '-' },
  low: { label: 'Low', color: '#6B7280', short: '·' },
};

export function SubItemKanban({ itemId }: SubItemKanbanProps) {
  const {
    getItem,
    getSubStages,
    ui,
    addSubItem,
    updateSubItem,
    deleteSubItem,
    toggleSubItem,
    addSubStage,
    updateSubStage,
    deleteSubStage,
  } = useRoadmapStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToStage, setAddingToStage] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editStageName, setEditStageName] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  const item = getItem(itemId);
  if (!item) return null;

  const stages = getSubStages(itemId);
  const subItems = item.subItems || [];
  const statusTags = item.subItemConfig?.customStatusTags || DEFAULT_STATUS_TAGS;

  const getItemsByStage = (stageId: string): SubItem[] => {
    return subItems
      .filter((s) => s.subStageId === stageId)
      .sort((a, b) => a.order - b.order);
  };

  // Items without a valid stage go to first column
  const orphanItems = subItems.filter(
    (s) => !s.subStageId || !stages.find((st) => st.id === s.subStageId)
  );

  const handleAddTask = (stageId: string) => {
    if (newTaskTitle.trim()) {
      addSubItem(itemId, newTaskTitle.trim());
      // Update the newly added item to be in this stage
      const newItem = item.subItems?.[item.subItems.length - 1];
      if (newItem) {
        updateSubItem(itemId, newItem.id, { subStageId: stageId });
      }
      setNewTaskTitle('');
      setAddingToStage(null);
    }
  };

  const handleDragStart = (subItemId: string) => {
    setDraggedItem(subItemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedItem) {
      updateSubItem(itemId, draggedItem, { subStageId: stageId });
      setDraggedItem(null);
    }
  };

  const handleAddStage = () => {
    if (newStageName.trim()) {
      addSubStage(itemId, newStageName.trim());
      setNewStageName('');
      setShowAddStage(false);
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

  return (
    <div className="sub-kanban">
      <div className="kanban-columns">
        {stages.map((stage) => {
          const stageItems = stage.id === stages[0]?.id
            ? [...getItemsByStage(stage.id), ...orphanItems]
            : getItemsByStage(stage.id);

          return (
            <div
              key={stage.id}
              className={clsx('kanban-column', { 'drag-over': draggedItem })}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="column-header">
                {editingStageId === stage.id ? (
                  <input
                    type="text"
                    className="column-name-input"
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
                  <h4
                    className="column-name"
                    onDoubleClick={() =>
                      ui.isEditMode && handleEditStage(stage.id, stage.label)
                    }
                  >
                    {stage.label}
                    <span className="column-count">{stageItems.length}</span>
                  </h4>
                )}
                {ui.isEditMode && stages.length > 1 && (
                  <button
                    className="btn-remove-small column-delete"
                    onClick={() => deleteSubStage(itemId, stage.id)}
                    title="Delete column"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="column-items">
                {stageItems.map((subItem) => {
                  const priorityConfig = subItem.priority
                    ? PRIORITY_CONFIG[subItem.priority]
                    : null;
                  const statusTag = statusTags.find((t) => t.id === subItem.statusTagId);

                  return (
                    <div
                      key={subItem.id}
                      className={clsx('kanban-card', {
                        completed: subItem.completed,
                        dragging: draggedItem === subItem.id,
                      })}
                      draggable={ui.isEditMode}
                      onDragStart={() => handleDragStart(subItem.id)}
                    >
                      <div className="card-content">
                        <label className="card-checkbox">
                          <input
                            type="checkbox"
                            checked={subItem.completed}
                            onChange={() => toggleSubItem(itemId, subItem.id)}
                            disabled={!ui.isEditMode}
                          />
                          <span className="checkmark-small" />
                        </label>
                        <span className="card-title">{subItem.title}</span>
                      </div>
                      <div className="card-tags">
                        {priorityConfig && (
                          <span
                            className="card-priority"
                            style={{ color: priorityConfig.color }}
                            title={priorityConfig.label}
                          >
                            {priorityConfig.short}
                          </span>
                        )}
                        {statusTag && (
                          <span
                            className="card-status-dot"
                            style={{ backgroundColor: statusTag.color }}
                            title={statusTag.label}
                          />
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

                {/* Add task to this column */}
                {ui.isEditMode && (
                  <>
                    {addingToStage === stage.id ? (
                      <div className="add-card-form">
                        <input
                          type="text"
                          className="add-card-input"
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask(stage.id);
                            if (e.key === 'Escape') {
                              setAddingToStage(null);
                              setNewTaskTitle('');
                            }
                          }}
                          autoFocus
                        />
                        <div className="add-card-actions">
                          <button
                            className="btn-primary btn-xs"
                            onClick={() => handleAddTask(stage.id)}
                          >
                            Add
                          </button>
                          <button
                            className="btn-secondary btn-xs"
                            onClick={() => {
                              setAddingToStage(null);
                              setNewTaskTitle('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="add-card-btn"
                        onClick={() => setAddingToStage(stage.id)}
                      >
                        + Add task
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Add new column */}
        {ui.isEditMode && (
          <div className="kanban-column add-column">
            {showAddStage ? (
              <div className="add-column-form">
                <input
                  type="text"
                  className="add-column-input"
                  placeholder="Column name..."
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddStage();
                    if (e.key === 'Escape') {
                      setShowAddStage(false);
                      setNewStageName('');
                    }
                  }}
                  autoFocus
                />
                <div className="add-column-actions">
                  <button className="btn-primary btn-xs" onClick={handleAddStage}>
                    Add
                  </button>
                  <button
                    className="btn-secondary btn-xs"
                    onClick={() => {
                      setShowAddStage(false);
                      setNewStageName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="add-column-btn"
                onClick={() => setShowAddStage(true)}
              >
                + Add column
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
