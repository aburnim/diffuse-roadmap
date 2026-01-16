import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoadmapStore } from '../store';
import type { Stage, BlockerStatus, ExternalLink, ItemType } from '../types';
import { SubItemTaskList } from './SubItemTaskList';
import { SubItemKanban } from './SubItemKanban';
import { SubItemRoadmap } from './SubItemRoadmap';
import { DependencyPicker } from './DependencyPicker';
import clsx from 'clsx';

interface ExpandedItemViewProps {
  itemId: string;
}

export function ExpandedItemView({ itemId }: ExpandedItemViewProps) {
  const {
    data,
    ui,
    getItem,
    setExpandedItem,
    updateItem,
    deleteItem,
    archiveItem,
    addLink,
    removeLink,
    addDependency,
    removeDependency,
    setSubViewType,
    getSubItemCount,
    exportItem,
  } = useRoadmapStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showDependencyPicker, setShowDependencyPicker] = useState(false);

  const item = getItem(itemId);
  if (!item) return null;

  const swimlane = data?.swimlanes.find((s) => s.id === item.swimlaneId);
  const subItemCount = getSubItemCount(itemId);
  const currentViewType = item.subItemConfig?.viewType || 'tasks';

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

  const handleExport = () => {
    const jsonData = exportItem(itemId);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('item', itemId);
    navigator.clipboard.writeText(url.toString());
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

  const renderSubView = () => {
    switch (currentViewType) {
      case 'kanban':
        return <SubItemKanban itemId={itemId} />;
      case 'roadmap':
        return <SubItemRoadmap itemId={itemId} />;
      case 'tasks':
      default:
        return <SubItemTaskList itemId={itemId} />;
    }
  };

  return (
    <div className="expanded-item-view">
      {/* Header with badges and close button */}
      <div className="expanded-header">
        <div className="expanded-header-left">
          <span
            className="expanded-swimlane-badge"
            style={{ backgroundColor: swimlane?.color }}
          >
            {swimlane?.name}
          </span>
          <span className={clsx('expanded-type-badge', `type-${item.type}`)}>
            {item.type}
          </span>
          {item.type === 'blocker' && item.blockerStatus && (
            <span className={clsx('expanded-status-badge', `status-${item.blockerStatus}`)}>
              {item.blockerStatus}
            </span>
          )}
          {subItemCount.total > 0 && (
            <span className="expanded-subitem-badge">
              {subItemCount.completed}/{subItemCount.total} sub-items
            </span>
          )}
        </div>
        <div className="expanded-header-right">
          <button
            className="btn-icon"
            onClick={handleCopyShareLink}
            title="Copy share link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </button>
          <button
            className="btn-icon"
            onClick={handleExport}
            title="Export item"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
          <button
            className="btn-icon btn-close"
            onClick={() => setExpandedItem(null)}
            title="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area - two columns */}
      <div className="expanded-content">
        {/* Left column: Item details */}
        <div className="expanded-details">
          {/* Title */}
          <div className="expanded-title-section">
            {isEditing ? (
              <input
                type="text"
                className="expanded-title-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <h2 className={clsx('expanded-title', { 'title-completed': item.completed })}>
                {item.isWin && <span className="win-star">★</span>}
                {item.title}
              </h2>
            )}
          </div>

          {/* Metadata row */}
          <div className="expanded-meta-row">
            {item.reportedDate && (
              <div className="meta-item">
                <span className="meta-label">Reported:</span>
                <span className="meta-value">{item.reportedDate}</span>
              </div>
            )}
            {ui.isEditMode && (
              <>
                <div className="meta-item">
                  <label className="meta-label">Type:</label>
                  <select
                    className="meta-select"
                    value={item.type}
                    onChange={(e) => {
                      const newType = e.target.value as ItemType;
                      const updates: Partial<typeof item> = { type: newType };
                      // Set default blocker status when changing to blocker
                      if (newType === 'blocker' && !item.blockerStatus) {
                        updates.blockerStatus = 'open';
                      }
                      updateItem(item.id, updates);
                    }}
                  >
                    <option value="milestone">Milestone</option>
                    <option value="blocker">Blocker</option>
                    <option value="goal">Goal</option>
                    <option value="output">Output</option>
                  </select>
                </div>
                <div className="meta-item">
                  <label className="meta-label">Stage:</label>
                  <select
                    className="meta-select"
                    value={item.stage}
                    onChange={(e) => updateItem(item.id, { stage: e.target.value as Stage })}
                  >
                    <option value="recent">Recent</option>
                    <option value="short-term">Short-term</option>
                    <option value="long-term">Long-term</option>
                  </select>
                </div>
                {item.type === 'blocker' && (
                  <div className="meta-item">
                    <label className="meta-label">Status:</label>
                    <select
                      className="meta-select"
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
              </>
            )}
          </div>

          {/* Description */}
          <div className="expanded-section">
            <h3 className="section-title">Description</h3>
            {isEditing ? (
              <textarea
                className="expanded-description-input"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add description (Markdown supported)"
                rows={4}
              />
            ) : item.description ? (
              <div className="expanded-description markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.description}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="empty-text">No description</p>
            )}

            {ui.isEditMode && !isEditing && (
              <button className="btn-text" onClick={handleStartEdit}>
                Edit
              </button>
            )}

            {isEditing && (
              <div className="edit-actions">
                <button className="btn-primary btn-sm" onClick={handleSaveEdit}>
                  Save
                </button>
                <button className="btn-secondary btn-sm" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="expanded-section">
            <h3 className="section-title">Links</h3>
            {item.links && item.links.length > 0 ? (
              <ul className="link-list compact">
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
              <p className="empty-text">No links</p>
            )}

            {ui.isEditMode && (
              <>
                {showLinkForm ? (
                  <div className="add-form inline">
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
                    <button className="btn-primary btn-sm" onClick={handleAddLink}>
                      Add
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setShowLinkForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn-text" onClick={() => setShowLinkForm(true)}>
                    + Add link
                  </button>
                )}
              </>
            )}
          </div>

          {/* Dependencies */}
          <div className="expanded-section">
            <h3 className="section-title">Dependencies</h3>
            <div className="dependencies-grid">
              <div className="dep-column">
                <h4 className="dep-header">Depends On</h4>
                {item.dependsOn && item.dependsOn.length > 0 ? (
                  <ul className="dep-list">
                    {item.dependsOn.map((depId) => {
                      const dep = data?.items.find((i) => i.id === depId);
                      if (!dep) return null;
                      return (
                        <li key={depId} className="dep-item">
                          <span className={clsx('dep-type-badge', `type-${dep.type}`)}>
                            {dep.type.slice(0, 1).toUpperCase()}
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
                  <p className="empty-text">None</p>
                )}
                {ui.isEditMode && (
                  <button
                    className="btn-text"
                    onClick={() => setShowDependencyPicker(true)}
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="dep-column">
                <h4 className="dep-header">Enables</h4>
                {item.enables && item.enables.length > 0 ? (
                  <ul className="dep-list">
                    {item.enables.map((enablesId) => {
                      const dep = data?.items.find((i) => i.id === enablesId);
                      if (!dep) return null;
                      return (
                        <li key={enablesId} className="dep-item">
                          <span className={clsx('dep-type-badge', `type-${dep.type}`)}>
                            {dep.type.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="dep-title">{dep.title}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="empty-text">None</p>
                )}
              </div>
            </div>
          </div>

          {/* Toggles */}
          {ui.isEditMode && item.type !== 'blocker' && (
            <div className="expanded-section expanded-toggles">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={item.completed || false}
                  onChange={() => updateItem(item.id, { completed: !item.completed })}
                />
                <span>Completed</span>
              </label>
              <label className="toggle-label win">
                <input
                  type="checkbox"
                  checked={item.isWin || false}
                  onChange={() => updateItem(item.id, { isWin: !item.isWin })}
                />
                <span>Highlight as win</span>
              </label>
            </div>
          )}

          {/* Archive & Delete */}
          {ui.isEditMode && (
            <div className="expanded-section expanded-danger">
              <button
                className="btn-archive-expanded btn-sm"
                onClick={() => {
                  archiveItem(item.id);
                  setExpandedItem(null);
                }}
              >
                Archive Item
              </button>
              <button
                className="btn-danger btn-sm"
                onClick={() => {
                  if (confirm('Delete this item?')) {
                    deleteItem(item.id);
                    setExpandedItem(null);
                  }
                }}
              >
                Delete Item
              </button>
            </div>
          )}
        </div>

        {/* Right column: Sub-items */}
        <div className="expanded-subitems">
          <div className="subitems-header">
            <h3 className="section-title">Sub-items</h3>
            <div className="view-switcher">
              <button
                className={clsx('view-btn', { active: currentViewType === 'tasks' })}
                onClick={() => setSubViewType(itemId, 'tasks')}
                title="Task List"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </button>
              <button
                className={clsx('view-btn', { active: currentViewType === 'kanban' })}
                onClick={() => setSubViewType(itemId, 'kanban')}
                title="Kanban Board"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="5" height="18" rx="1" />
                  <rect x="10" y="3" width="5" height="12" rx="1" />
                  <rect x="17" y="3" width="5" height="8" rx="1" />
                </svg>
              </button>
              <button
                className={clsx('view-btn', { active: currentViewType === 'roadmap' })}
                onClick={() => setSubViewType(itemId, 'roadmap')}
                title="Mini Roadmap"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="4" rx="1" />
                  <rect x="3" y="10" width="18" height="4" rx="1" />
                  <rect x="3" y="17" width="18" height="4" rx="1" />
                </svg>
              </button>
            </div>
          </div>
          <div className="subitems-content">
            {renderSubView()}
          </div>
        </div>
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
