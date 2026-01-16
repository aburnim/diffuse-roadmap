// Core types for Executive Roadmap

export type Stage = 'old' | 'recent' | 'short-term' | 'long-term';

export type ItemType = 'milestone' | 'blocker' | 'goal' | 'output';

export type BlockerStatus = 'open' | 'mitigated' | 'resolved';

// Sub-item view types for drill-down
export type SubViewType = 'tasks' | 'kanban' | 'roadmap';

// Priority levels for sub-items
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// Status tags for sub-items (customizable per item)
export interface StatusTag {
  id: string;
  label: string;
  color: string;
}

// Default status tags
export const DEFAULT_STATUS_TAGS: StatusTag[] = [
  { id: 'not-started', label: 'Not Started', color: '#6B7280' },
  { id: 'in-progress', label: 'In Progress', color: '#3B82F6' },
  { id: 'blocked', label: 'Blocked', color: '#EF4444' },
  { id: 'in-review', label: 'In Review', color: '#F59E0B' },
  { id: 'done', label: 'Done', color: '#10B981' },
];

// Sub-stage for mini-roadmap view (customizable per item)
export interface SubStage {
  id: string;
  label: string;
  order: number;
}

// Default sub-stages (smart defaults)
export const DEFAULT_SUB_STAGES: SubStage[] = [
  { id: 'done', label: 'Done', order: 0 },
  { id: 'in-progress', label: 'In Progress', order: 1 },
  { id: 'up-next', label: 'Up Next', order: 2 },
  { id: 'backlog', label: 'Backlog', order: 3 },
];

// Sub-swimlane for mini-roadmap view (optional)
export interface SubSwimlane {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Sub-item (task within a milestone/goal)
export interface SubItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: Priority;
  statusTagId?: string;
  // For kanban/roadmap views
  subStageId?: string;
  subSwimlaneId?: string;
  order: number;
  // Optional links for sub-items
  links?: ExternalLink[];
}

// Sub-item configuration for a parent item
export interface SubItemConfig {
  viewType: SubViewType;
  customStages?: SubStage[];
  customSwimlanes?: SubSwimlane[];
  customStatusTags?: StatusTag[];
}

export interface ExternalLink {
  id: string;
  url: string;
  label: string;
  type?: 'gdoc' | 'slack' | 'github' | 'publication' | 'presentation' | 'data' | 'other';
}

export interface CheckIn {
  id: string;
  label: string; // e.g., "Modeling meeting February 13"
  completed: boolean;
}

// Change log entry types
export type ChangeType =
  | 'created'
  | 'completed'
  | 'archived'
  | 'unarchived'
  | 'status_changed'
  | 'stage_changed'
  | 'link_added'
  | 'subitem_added'
  | 'subitem_completed'
  | 'marked_win'
  | 'output_added';

export interface ChangeLogEntry {
  id: string;
  type: ChangeType;
  timestamp: string; // ISO string
  description: string; // Human-readable description
  // Optional metadata for richer display
  metadata?: {
    fromValue?: string;
    toValue?: string;
    linkLabel?: string;
    subItemTitle?: string;
  };
}

export interface RoadmapItem {
  id: string;
  type: ItemType;
  title: string;
  description?: string; // Markdown supported
  stage: Stage;
  swimlaneId: string;

  // For milestones - when it was reported
  reportedDate?: string; // e.g., "Modeling meeting January 12"

  // Target date for meetings/deadlines (ISO date string, e.g., "2025-01-22")
  targetDate?: string;

  // For goals - check-in dates
  checkIns?: CheckIn[];

  // For blockers
  blockerStatus?: BlockerStatus;

  // Dependencies - IDs of items this depends on
  dependsOn?: string[];

  // What this enables - IDs of items that depend on this
  enables?: string[];

  // External links
  links?: ExternalLink[];

  // Linked outputs (for milestones)
  outputIds?: string[];

  // Completion status for milestones/goals
  completed?: boolean;

  // Position within stage for ordering (0-indexed)
  order?: number;

  // Highlight as a "win" or important achievement
  isWin?: boolean;

  // Archived (completed and hidden from main view)
  archived?: boolean;

  // Sub-items for drill-down (tasks, mini-roadmap, kanban)
  subItems?: SubItem[];

  // Sub-item view configuration
  subItemConfig?: SubItemConfig;

  // Last updated timestamp (ISO string)
  itemLastUpdated?: string;

  // Change history (last 2 changes kept)
  changeLog?: ChangeLogEntry[];
}

export interface Swimlane {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface RoadmapData {
  title: string;
  lastUpdated: string;
  swimlanes: Swimlane[];
  items: RoadmapItem[];
}

// UI State types
export interface FilterState {
  swimlanes: string[]; // empty = all
  stages: Stage[]; // empty = all
  types: ItemType[]; // empty = all
  blockerStatus: BlockerStatus[]; // empty = all
  showCompleted: boolean;
  searchQuery: string;
}

export type ViewType = 'board' | 'recent' | 'guide';

export interface UIState {
  selectedItemId: string | null;
  isDetailPanelOpen: boolean;
  isEditMode: boolean;
  filters: FilterState;
  hoveredItemId: string | null;
  // New: expanded items (for inline expansion instead of side panel)
  expandedItemId: string | null;
  // URL-based filtering for shareable views
  focusedSwimlaneId: string | null;
  focusedItemId: string | null;
  // Track which swimlanes show archived items
  showArchivedBySwimlane: Record<string, boolean>;
  // Current view type (board or recent updates timeline)
  currentView: ViewType;
  // Show/hide dependency lines
  showDependencyLines: boolean;
}

// Dependency edge for rendering
export interface DependencyEdge {
  id: string;
  fromId: string;
  toId: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  type: 'depends' | 'enables' | 'blocker';
}
