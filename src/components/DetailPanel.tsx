import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoadmapStore } from '../store';
import type { Stage, BlockerStatus, ExternalLink, SubViewType, ItemType } from '../types';
import { DependencyPicker } from './DependencyPicker';
import { SubItemTaskList } from './SubItemTaskList';
import { SubItemKanban } from './SubItemKanban';
import { SubItemRoadmap } from './SubItemRoadmap';
import clsx from 'clsx';

export function DetailPanel() {
  const {
    data,
    ui,
    getItem,
    setDetailPanelOpen,
    updateItem,
    deleteItem,
    addLink,
    removeLink,
    addCheckIn,
    toggleCheckIn,
    removeCheckIn,
    addDependency,
    removeDependency,
  } = useRoadmapStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newCheckIn, setNewCheckIn] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showDependencyPicker, setShowDependencyPicker] = useState(false);
  const [subViewType, setSubViewType] = useState<SubViewType>('tasks');

  if (!ui.isDetailPanelOpen || !ui.selectedItemId) return null;

  const item = getItem(ui.selectedItemId);
  if (!item) return null;

  const swimlane = data?.swimlanes.find((s) => s.id === item.swimlaneId);

  const handleStartEdit = () => {
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateItem(item.id, {
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditDescription('');
  };

  const handleAddLink = () => {
    if (newLinkUrl.trim() && newLinkLabel.trim()) {
      const linkType = detectLinkType(newLinkUrl);
      addLink(item.id, { url: newLinkUrl, label: newLinkLabel, type: linkType });
      setNewLinkUrl('');
      setNewLinkLabel('');
      setShowLinkForm(false);
    }
  };

  const handleAddCheckIn = () => {
    if (newCheckIn.trim()) {
      addCheckIn(item.id, newCheckIn);
      setNewCheckIn('');
      setShowCheckInForm(false);
    }
  };

  const detectLinkType = (url: string): ExternalLink['type'] => {
    if (url.includes('docs.google.com')) return 'gdoc';
    if (url.includes('slack.com')) return 'slack';
    if (url.includes('github.com')) return 'github';
    if (url.includes('pubmed') || url.includes('doi.org')) return 'publication';
    return 'other';
  };

  const getLinkIcon = (type?: ExternalLink['type']) => {
    switch (type) {
      case 'gdoc':
        return '📄';
      case 'slack':
        return '💬';
      case 'github':
        return '🔗';
      case 'publication':
        return '📚';
      case 'presentation':
        return '📊';
      case 'data':
        return '📦';
      default:
        return '🔗';
    }
  };

  return (
    <div className={clsx('detail-panel', { 'panel-open': ui.isDetailPanelOpen })}>
      <div className="panel-backdrop" onClick={() => setDetailPanelOpen(false)} />

      <div className="panel-content">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header-left">
            <span
              className="panel-swimlane-badge"
              style={{ backgroundColor: swimlane?.color }}
            >
              {swimlane?.name}
            </span>
            <span className={clsx('panel-type-badge', `type-${item.type}`)}>
              {item.type}
            </span>
            {item.type === 'blocker' && item.blockerStatus && (
              <span className={clsx('panel-status-badge', `status-${item.blockerStatus}`)}>
                {item.blockerStatus}
              </span>
            )}
          </div>
          <button className="panel-close" onClick={() => setDetailPanelOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="panel-title-section">
          {isEditing ? (
            <input
              type="text"
              className="panel-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
          ) : (
            <h2 className="panel-title">{item.title}</h2>
          )}
        </div>

        {/* Metadata */}
        {item.reportedDate && (
          <div className="panel-meta">
            <span className="meta-label">Reported:</span>
            <span className="meta-value">{item.reportedDate}</span>
          </div>
        )}

        {/* Target date display (view mode) */}
        {!ui.isEditMode && item.targetDate && (
          <div className="panel-meta panel-target-date">
            <span className="meta-label">Target:</span>
            <span className="meta-value">
              {new Date(item.targetDate + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Type selector (edit mode) */}
        {ui.isEditMode && (
          <div className="panel-field">
            <label className="field-label">Type</label>
            <select
              className="field-select"
              value={item.type}
              onChange={(e) => updateItem(item.id, { type: e.target.value as ItemType })}
            >
              <option value="milestone">Milestone</option>
              <option value="goal">Goal</option>
              <option value="output">Output</option>
              <option value="blocker">Blocker</option>
            </select>
          </div>
        )}

        {/* Stage selector (edit mode) */}
        {ui.isEditMode && (
          <div className="panel-field">
            <label className="field-label">Stage</label>
            <select
              className="field-select"
              value={item.stage}
              onChange={(e) => updateItem(item.id, { stage: e.target.value as Stage })}
            >
              <option value="recent">Recent</option>
              <option value="short-term">Short-term</option>
              <option value="long-term">Long-term</option>
            </select>
          </div>
        )}

        {/* Blocker status (edit mode) */}
        {ui.isEditMode && item.type === 'blocker' && (
          <div className="panel-field">
            <label className="field-label">Status</label>
            <select
              className="field-select"
              value={item.blockerStatus || 'open'}
              onChange={(e) =>
                updateItem(item.id, { blockerStatus: e.target.value as BlockerStatus })
              }
            >
              <option value="open">Open</option>
              <option value="mitigated">Mitigated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}

        {/* Target date (edit mode) */}
        {ui.isEditMode && (
          <div className="panel-field">
            <label className="field-label">Target Date</label>
            <div className="target-date-input-group">
              <input
                type="date"
                className="field-input"
                value={item.targetDate || ''}
                onChange={(e) => updateItem(item.id, { targetDate: e.target.value || undefined })}
              />
              {item.targetDate && (
                <button
                  className="btn-clear-date"
                  onClick={() => updateItem(item.id, { targetDate: undefined })}
                  title="Clear date"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="field-hint">Optional: Set a deadline or meeting date</p>
          </div>
        )}

        {/* Description */}
        <div className="panel-section">
          <h3 className="section-title">Description</h3>
          {isEditing ? (
            <textarea
              className="panel-description-input"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add description (Markdown supported)"
              rows={6}
            />
          ) : item.description ? (
            <div className="panel-description markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {item.description}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="panel-empty">No description</p>
          )}

          {ui.isEditMode && !isEditing && (
            <button className="btn-edit" onClick={handleStartEdit}>
              Edit
            </button>
          )}

          {isEditing && (
            <div className="edit-actions">
              <button className="btn-save" onClick={handleSaveEdit}>
                Save
              </button>
              <button className="btn-cancel" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Check-ins (for goals) */}
        {item.type === 'goal' && (
          <div className="panel-section">
            <h3 className="section-title">Check-ins</h3>
            {item.checkIns && item.checkIns.length > 0 ? (
              <ul className="check-in-list">
                {item.checkIns.map((checkIn) => (
                  <li key={checkIn.id} className="check-in-item">
                    <label className="check-in-label">
                      <input
                        type="checkbox"
                        checked={checkIn.completed}
                        onChange={() => toggleCheckIn(item.id, checkIn.id)}
                        disabled={!ui.isEditMode}
                      />
                      <span className={clsx({ completed: checkIn.completed })}>
                        {checkIn.label}
                      </span>
                    </label>
                    {ui.isEditMode && (
                      <button
                        className="btn-remove-small"
                        onClick={() => removeCheckIn(item.id, checkIn.id)}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel-empty">No check-ins</p>
            )}

            {ui.isEditMode && (
              <>
                {showCheckInForm ? (
                  <div className="add-form">
                    <input
                      type="text"
                      placeholder="e.g., Modeling meeting February 13"
                      value={newCheckIn}
                      onChange={(e) => setNewCheckIn(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCheckIn()}
                    />
                    <div className="form-actions">
                      <button className="btn-add" onClick={handleAddCheckIn}>
                        Add
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setShowCheckInForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-add-item"
                    onClick={() => setShowCheckInForm(true)}
                  >
                    + Add check-in
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Links */}
        <div className="panel-section">
          <h3 className="section-title">Links</h3>
          {item.links && item.links.length > 0 ? (
            <ul className="link-list">
              {item.links.map((link) => (
                <li key={link.id} className="link-item">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-anchor"
                  >
                    <span className="link-icon">{getLinkIcon(link.type)}</span>
                    <span className="link-label">{link.label}</span>
                    <span className="link-url">{new URL(link.url).hostname}</span>
                  </a>
                  {ui.isEditMode && (
                    <button
                      className="btn-remove-small"
                      onClick={() => removeLink(item.id, link.id)}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-empty">No links</p>
          )}

          {ui.isEditMode && (
            <>
              {showLinkForm ? (
                <div className="add-form">
                  <input
                    type="text"
                    placeholder="Label"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                  />
                  <div className="form-actions">
                    <button className="btn-add" onClick={handleAddLink}>
                      Add
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => setShowLinkForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn-add-item"
                  onClick={() => setShowLinkForm(true)}
                >
                  + Add link
                </button>
              )}
            </>
          )}
        </div>

        {/* Dependencies */}
        <div className="panel-section">
          <h3 className="section-title">Depends On</h3>
          {item.dependsOn && item.dependsOn.length > 0 ? (
            <ul className="dependency-list">
              {item.dependsOn.map((depId) => {
                const dep = data?.items.find((i) => i.id === depId);
                if (!dep) return null;
                return (
                  <li key={depId} className="dependency-item">
                    <span className={clsx('dep-type', `type-${dep.type}`)}>
                      {dep.type}
                    </span>
                    <span className="dep-title">{dep.title}</span>
                    {ui.isEditMode && (
                      <button
                        className="btn-remove-small"
                        onClick={() => removeDependency(item.id, depId)}
                      >
                        ×
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="panel-empty">No dependencies</p>
          )}

          {ui.isEditMode && (
            <button
              className="btn-add-item"
              onClick={() => setShowDependencyPicker(true)}
            >
              + Add dependency
            </button>
          )}
        </div>

        {/* Enables (what depends on this) */}
        {item.enables && item.enables.length > 0 && (
          <div className="panel-section">
            <h3 className="section-title">Enables</h3>
            <ul className="dependency-list">
              {item.enables.map((enablesId) => {
                const dep = data?.items.find((i) => i.id === enablesId);
                if (!dep) return null;
                return (
                  <li key={enablesId} className="dependency-item">
                    <span className={clsx('dep-type', `type-${dep.type}`)}>
                      {dep.type}
                    </span>
                    <span className="dep-title">{dep.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Sub-items section */}
        {(item.type === 'milestone' || item.type === 'goal') && (
          <div className="panel-section">
            <div className="section-header-with-toggle">
              <h3 className="section-title">Sub-items</h3>
              <div className="view-toggle">
                <button
                  className={clsx('view-toggle-btn', { active: subViewType === 'tasks' })}
                  onClick={() => setSubViewType('tasks')}
                >
                  Tasks
                </button>
                <button
                  className={clsx('view-toggle-btn', { active: subViewType === 'kanban' })}
                  onClick={() => setSubViewType('kanban')}
                >
                  Kanban
                </button>
                <button
                  className={clsx('view-toggle-btn', { active: subViewType === 'roadmap' })}
                  onClick={() => setSubViewType('roadmap')}
                >
                  Roadmap
                </button>
              </div>
            </div>
            <div className="sub-items-container">
              {subViewType === 'tasks' && <SubItemTaskList itemId={item.id} />}
              {subViewType === 'kanban' && <SubItemKanban itemId={item.id} />}
              {subViewType === 'roadmap' && <SubItemRoadmap itemId={item.id} />}
            </div>
          </div>
        )}

        {/* Completed and Win toggles */}
        {ui.isEditMode && item.type !== 'blocker' && (
          <div className="panel-section">
            <label className="completed-toggle">
              <input
                type="checkbox"
                checked={item.completed || false}
                onChange={() => updateItem(item.id, { completed: !item.completed })}
              />
              <span>Mark as completed</span>
            </label>
            <label className="completed-toggle win-toggle">
              <input
                type="checkbox"
                checked={item.isWin || false}
                onChange={() => updateItem(item.id, { isWin: !item.isWin })}
              />
              <span>Highlight as win</span>
            </label>
          </div>
        )}

        {/* Delete */}
        {ui.isEditMode && (
          <div className="panel-section panel-danger">
            <button
              className="btn-delete"
              onClick={() => {
                if (confirm('Delete this item?')) {
                  deleteItem(item.id);
                  setDetailPanelOpen(false);
                }
              }}
            >
              Delete Item
            </button>
          </div>
        )}
      </div>

      {/* Dependency picker modal */}
      {showDependencyPicker && (
        <DependencyPicker
          currentItemId={item.id}
          excludeIds={item.dependsOn || []}
          onSelect={(depId) => {
            addDependency(item.id, depId);
            setShowDependencyPicker(false);
          }}
          onClose={() => setShowDependencyPicker(false)}
        />
      )}
    </div>
  );
}
