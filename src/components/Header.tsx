import { useState, useRef } from 'react';
import { useRoadmapStore } from '../store';
import type { ItemType, Stage } from '../types';
import clsx from 'clsx';

export function Header() {
  const {
    data,
    ui,
    setEditMode,
    setTitle,
    addItem,
    addSwimlane,
    exportData,
    loadData,
  } = useRoadmapStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showAddSwimlaneForm, setShowAddSwimlaneForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<ItemType>('milestone');
  const [newItemStage, setNewItemStage] = useState<Stage>('recent');
  const [newItemSwimlane, setNewItemSwimlane] = useState('');
  const [newSwimlaneName, setNewSwimlaneName] = useState('');
  const [newSwimlaneColor, setNewSwimlaneColor] = useState('#3B82F6');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!data) return null;

  const handleAddItem = () => {
    if (newItemTitle.trim() && newItemSwimlane) {
      addItem({
        type: newItemType,
        title: newItemTitle,
        stage: newItemStage,
        swimlaneId: newItemSwimlane,
        blockerStatus: newItemType === 'blocker' ? 'open' : undefined,
      });
      setNewItemTitle('');
      setShowAddItemForm(false);
      setShowAddMenu(false);
    }
  };

  const handleAddSwimlane = () => {
    if (newSwimlaneName.trim()) {
      addSwimlane(newSwimlaneName, newSwimlaneColor);
      setNewSwimlaneName('');
      setShowAddSwimlaneForm(false);
      setShowAddMenu(false);
    }
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          loadData(data);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveTitle = () => {
    if (editTitleValue.trim()) {
      setTitle(editTitleValue);
    }
    setIsEditingTitle(false);
  };

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'readonly');
    navigator.clipboard.writeText(url.toString());
    alert('Read-only link copied to clipboard!');
  };

  return (
    <header className="header">
      <div className="header-left">
        {isEditingTitle ? (
          <input
            type="text"
            className="header-title-input"
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            autoFocus
          />
        ) : (
          <h1
            className="header-title"
            onClick={() => {
              if (ui.isEditMode) {
                setEditTitleValue(data.title);
                setIsEditingTitle(true);
              }
            }}
          >
            {data.title}
          </h1>
        )}
        <span className="header-updated">
          Updated: {new Date(data.lastUpdated).toLocaleDateString()}
        </span>
      </div>

      <div className="header-right">
        {/* View/Edit mode toggle */}
        <div className="mode-toggle">
          <button
            className={clsx('mode-btn', { active: !ui.isEditMode })}
            onClick={() => setEditMode(false)}
          >
            View
          </button>
          <button
            className={clsx('mode-btn', { active: ui.isEditMode })}
            onClick={() => setEditMode(true)}
          >
            Edit
          </button>
        </div>

        {/* Add button (edit mode only) */}
        {ui.isEditMode && (
          <div className="add-menu-container">
            <button
              className="btn-add-primary"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Add
            </button>

            {showAddMenu && (
              <div className="add-menu">
                <button
                  className="add-menu-item"
                  onClick={() => {
                    setShowAddItemForm(true);
                    setNewItemSwimlane(data.swimlanes[0]?.id || '');
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 12h6m-3-3v6" />
                  </svg>
                  New Item
                </button>
                <button
                  className="add-menu-item"
                  onClick={() => setShowAddSwimlaneForm(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  New Swimlane
                </button>
              </div>
            )}
          </div>
        )}

        {/* Import/Export */}
        <button className="btn-icon" onClick={handleExport} title="Export JSON">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
        <button
          className="btn-icon"
          onClick={() => fileInputRef.current?.click()}
          title="Import JSON"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        {/* Share button */}
        <button className="btn-share" onClick={handleShare}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Share
        </button>
      </div>

      {/* Add Item Form Modal */}
      {showAddItemForm && (
        <div className="modal-overlay" onClick={() => setShowAddItemForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add New Item</h3>

            <div className="modal-field">
              <label>Title</label>
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Item title"
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Type</label>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as ItemType)}
              >
                <option value="milestone">Milestone</option>
                <option value="blocker">Blocker</option>
                <option value="goal">Goal</option>
                <option value="output">Output</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Stage</label>
              <select
                value={newItemStage}
                onChange={(e) => setNewItemStage(e.target.value as Stage)}
              >
                <option value="recent">Recent</option>
                <option value="short-term">Short-term</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Swimlane</label>
              <select
                value={newItemSwimlane}
                onChange={(e) => setNewItemSwimlane(e.target.value)}
              >
                {data.swimlanes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddItemForm(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddItem}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Swimlane Form Modal */}
      {showAddSwimlaneForm && (
        <div className="modal-overlay" onClick={() => setShowAddSwimlaneForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add New Swimlane</h3>

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                value={newSwimlaneName}
                onChange={(e) => setNewSwimlaneName(e.target.value)}
                placeholder="Swimlane name"
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Color</label>
              <div className="color-picker">
                <input
                  type="color"
                  value={newSwimlaneColor}
                  onChange={(e) => setNewSwimlaneColor(e.target.value)}
                />
                <span>{newSwimlaneColor}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowAddSwimlaneForm(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddSwimlane}>
                Add Swimlane
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
