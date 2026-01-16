import { useState } from 'react';
import { useRoadmapStore } from '../store';
import type { Priority } from '../types';
import { DEFAULT_STATUS_TAGS } from '../types';
import clsx from 'clsx';

interface SubItemTaskListProps {
  itemId: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#EF4444' },
  high: { label: 'High', color: '#F97316' },
  medium: { label: 'Medium', color: '#EAB308' },
  low: { label: 'Low', color: '#6B7280' },
};

export function SubItemTaskList({ itemId }: SubItemTaskListProps) {
  const {
    getItem,
    ui,
    addSubItem,
    updateSubItem,
    deleteSubItem,
    toggleSubItem,
  } = useRoadmapStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const item = getItem(itemId);
  if (!item) return null;

  const subItems = [...(item.subItems || [])].sort((a, b) => {
    // Sort by completed (incomplete first), then by order
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.order - b.order;
  });

  const statusTags = item.subItemConfig?.customStatusTags || DEFAULT_STATUS_TAGS;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addSubItem(itemId, newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const handleStartEdit = (subItemId: string, title: string) => {
    setEditingId(subItemId);
    setEditTitle(title);
  };

  const handleSaveEdit = (subItemId: string) => {
    if (editTitle.trim()) {
      updateSubItem(itemId, subItemId, { title: editTitle.trim() });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const getStatusTag = (statusTagId?: string) => {
    return statusTags.find((t) => t.id === statusTagId);
  };

  const completedCount = subItems.filter((s) => s.completed).length;
  const progressPercent = subItems.length > 0
    ? Math.round((completedCount / subItems.length) * 100)
    : 0;

  return (
    <div className="sub-task-list">
      {/* Progress bar */}
      {subItems.length > 0 && (
        <div className="task-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-text">
            {completedCount}/{subItems.length} complete ({progressPercent}%)
          </span>
        </div>
      )}

      {/* Task list */}
      <ul className="task-items">
        {subItems.map((subItem) => {
          const statusTag = getStatusTag(subItem.statusTagId);
          const priorityConfig = subItem.priority ? PRIORITY_CONFIG[subItem.priority] : null;

          return (
            <li
              key={subItem.id}
              className={clsx('task-item', { completed: subItem.completed })}
            >
              <div className="task-main">
                <label className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={subItem.completed}
                    onChange={() => toggleSubItem(itemId, subItem.id)}
                    disabled={!ui.isEditMode}
                  />
                  <span className="checkmark" />
                </label>

                {editingId === subItem.id ? (
                  <input
                    type="text"
                    className="task-edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(subItem.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    onBlur={() => handleSaveEdit(subItem.id)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="task-title"
                    onDoubleClick={() =>
                      ui.isEditMode && handleStartEdit(subItem.id, subItem.title)
                    }
                  >
                    {subItem.title}
                  </span>
                )}
              </div>

              <div className="task-meta">
                {priorityConfig && (
                  <span
                    className="task-priority"
                    style={{ backgroundColor: priorityConfig.color }}
                  >
                    {priorityConfig.label}
                  </span>
                )}
                {statusTag && (
                  <span
                    className="task-status"
                    style={{ backgroundColor: statusTag.color }}
                  >
                    {statusTag.label}
                  </span>
                )}
                {ui.isEditMode && (
                  <div className="task-actions">
                    {/* Priority selector */}
                    <select
                      className="task-select"
                      value={subItem.priority || ''}
                      onChange={(e) =>
                        updateSubItem(itemId, subItem.id, {
                          priority: (e.target.value as Priority) || undefined,
                        })
                      }
                      title="Set priority"
                    >
                      <option value="">No priority</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

                    {/* Status selector */}
                    <select
                      className="task-select"
                      value={subItem.statusTagId || ''}
                      onChange={(e) =>
                        updateSubItem(itemId, subItem.id, {
                          statusTagId: e.target.value || undefined,
                        })
                      }
                      title="Set status"
                    >
                      <option value="">No status</option>
                      {statusTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.label}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn-remove-small"
                      onClick={() => deleteSubItem(itemId, subItem.id)}
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add new task */}
      {ui.isEditMode && (
        <div className="add-task-form">
          <input
            type="text"
            className="add-task-input"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <button
            className="btn-primary btn-sm"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
          >
            Add
          </button>
        </div>
      )}

      {/* Empty state */}
      {subItems.length === 0 && !ui.isEditMode && (
        <div className="empty-state">
          <p>No sub-items yet</p>
        </div>
      )}
    </div>
  );
}
