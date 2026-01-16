import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  RoadmapData,
  RoadmapItem,
  Swimlane,
  UIState,
  FilterState,
  Stage,
  ExternalLink,
  CheckIn,
  SubItem,
  SubStage,
  SubSwimlane,
  SubViewType,
  ViewType,
  ChangeLogEntry,
  ChangeType,
} from './types';
import { DEFAULT_SUB_STAGES, DEFAULT_STATUS_TAGS } from './types';

// Helper to add a change log entry to an item (keeps last 2)
function addChangeLog<T extends RoadmapItem>(
  item: T,
  type: ChangeType,
  description: string,
  metadata?: ChangeLogEntry['metadata']
): T {
  const entry: ChangeLogEntry = {
    id: nanoid(),
    type,
    timestamp: new Date().toISOString(),
    description,
    metadata,
  };
  const existingLog = item.changeLog || [];
  // Keep only the last 2 entries (including the new one)
  const newLog = [...existingLog, entry].slice(-2);
  return { ...item, changeLog: newLog } as T;
}

// Default filter state
const defaultFilters: FilterState = {
  swimlanes: [],
  stages: [],
  types: [],
  blockerStatus: [],
  showCompleted: true,
  searchQuery: '',
};

// Default UI state
const defaultUIState: UIState = {
  selectedItemId: null,
  isDetailPanelOpen: false,
  isEditMode: true, // Default to edit mode for owner
  filters: defaultFilters,
  hoveredItemId: null,
  expandedItemId: null,
  focusedSwimlaneId: null,
  focusedItemId: null,
  showArchivedBySwimlane: {},
  currentView: 'board',
  showDependencyLines: true,
};

interface RoadmapStore {
  // Data
  data: RoadmapData | null;
  ui: UIState;

  // Data actions
  loadData: (data: RoadmapData) => void;
  setTitle: (title: string) => void;

  // Swimlane actions
  addSwimlane: (name: string, color?: string) => void;
  updateSwimlane: (id: string, updates: Partial<Swimlane>) => void;
  deleteSwimlane: (id: string) => void;
  reorderSwimlanes: (swimlaneIds: string[]) => void;

  // Item actions
  addItem: (item: Omit<RoadmapItem, 'id'>) => string;
  updateItem: (id: string, updates: Partial<RoadmapItem>) => void;
  deleteItem: (id: string) => void;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;

  // Dependency actions
  addDependency: (fromId: string, toId: string) => void;
  removeDependency: (fromId: string, toId: string) => void;

  // Link actions
  addLink: (itemId: string, link: Omit<ExternalLink, 'id'>) => void;
  removeLink: (itemId: string, linkId: string) => void;

  // Check-in actions
  addCheckIn: (itemId: string, label: string) => void;
  toggleCheckIn: (itemId: string, checkInId: string) => void;
  removeCheckIn: (itemId: string, checkInId: string) => void;

  // Sub-item actions
  addSubItem: (itemId: string, title: string) => void;
  updateSubItem: (itemId: string, subItemId: string, updates: Partial<SubItem>) => void;
  deleteSubItem: (itemId: string, subItemId: string) => void;
  toggleSubItem: (itemId: string, subItemId: string) => void;
  reorderSubItems: (itemId: string, subItemIds: string[]) => void;

  // Sub-item config actions
  setSubViewType: (itemId: string, viewType: SubViewType) => void;
  addSubStage: (itemId: string, label: string) => void;
  updateSubStage: (itemId: string, stageId: string, updates: Partial<SubStage>) => void;
  deleteSubStage: (itemId: string, stageId: string) => void;
  reorderSubStages: (itemId: string, stageIds: string[]) => void;
  addSubSwimlane: (itemId: string, name: string, color?: string) => void;
  updateSubSwimlane: (itemId: string, swimlaneId: string, updates: Partial<SubSwimlane>) => void;
  deleteSubSwimlane: (itemId: string, swimlaneId: string) => void;

  // UI actions
  selectItem: (id: string | null) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setEditMode: (edit: boolean) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setHoveredItem: (id: string | null) => void;
  setExpandedItem: (id: string | null) => void;
  setFocusedSwimlane: (id: string | null) => void;
  setFocusedItem: (id: string | null) => void;
  toggleShowArchived: (swimlaneId: string) => void;
  setCurrentView: (view: ViewType) => void;
  toggleDependencyLines: () => void;

  // Computed / helpers
  getItem: (id: string) => RoadmapItem | undefined;
  getSwimlane: (id: string) => Swimlane | undefined;
  getItemsBySwimlane: (swimlaneId: string) => RoadmapItem[];
  getItemsByStage: (stage: Stage) => RoadmapItem[];
  getFilteredItems: () => RoadmapItem[];
  getFilteredSwimlanes: () => Swimlane[];
  isItemCrossSwimlane: (itemId: string) => boolean;
  getDependencies: (itemId: string) => RoadmapItem[];
  getDependents: (itemId: string) => RoadmapItem[];
  getSubStages: (itemId: string) => SubStage[];
  getSubSwimlanes: (itemId: string) => SubSwimlane[];
  getSubItemCount: (itemId: string) => { total: number; completed: number };
  getArchivedCount: (swimlaneId: string) => number;
  getArchivedItems: (swimlaneId: string) => RoadmapItem[];

  // Export
  exportData: () => string;
  exportSwimlane: (swimlaneId: string) => string;
  exportItem: (itemId: string) => string;
}

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set, get) => ({
      data: null,
      ui: defaultUIState,

      // Data actions
      loadData: (data) => {
        set({ data: { ...data, lastUpdated: new Date().toISOString() } });
      },

      setTitle: (title) => {
        const { data } = get();
        if (data) {
          set({ data: { ...data, title, lastUpdated: new Date().toISOString() } });
        }
      },

      // Swimlane actions
      addSwimlane: (name, color = '#3B82F6') => {
        const { data } = get();
        if (data) {
          const newSwimlane: Swimlane = {
            id: nanoid(),
            name,
            color,
            order: data.swimlanes.length,
          };
          set({
            data: {
              ...data,
              swimlanes: [...data.swimlanes, newSwimlane],
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      updateSwimlane: (id, updates) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              swimlanes: data.swimlanes.map((s) =>
                s.id === id ? { ...s, ...updates } : s
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      deleteSwimlane: (id) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              swimlanes: data.swimlanes.filter((s) => s.id !== id),
              items: data.items.filter((i) => i.swimlaneId !== id),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      reorderSwimlanes: (swimlaneIds) => {
        const { data } = get();
        if (data) {
          const reordered = swimlaneIds.map((id, index) => {
            const swimlane = data.swimlanes.find((s) => s.id === id);
            return swimlane ? { ...swimlane, order: index } : null;
          }).filter(Boolean) as Swimlane[];
          set({
            data: {
              ...data,
              swimlanes: reordered,
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      // Item actions
      addItem: (item) => {
        const { data } = get();
        const id = nanoid();
        const now = new Date().toISOString();
        if (data) {
          let newItem: RoadmapItem = { ...item, id, itemLastUpdated: now };
          newItem = addChangeLog(newItem, 'created', 'Item created');
          set({
            data: {
              ...data,
              items: [...data.items, newItem],
              lastUpdated: now,
            },
          });
        }
        return id;
      },

      updateItem: (id, updates) => {
        const { data } = get();
        const now = new Date().toISOString();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== id) return i;

                let updated = { ...i, ...updates, itemLastUpdated: now };

                // Track completion
                if (updates.completed !== undefined && updates.completed !== i.completed) {
                  if (updates.completed) {
                    updated = addChangeLog(updated, 'completed', 'Marked as completed');
                  }
                }

                // Track marking as win
                if (updates.isWin !== undefined && updates.isWin && !i.isWin) {
                  updated = addChangeLog(updated, 'marked_win', 'Highlighted as a win');
                }

                // Track stage changes
                if (updates.stage && updates.stage !== i.stage) {
                  const stageLabels: Record<Stage, string> = {
                    old: 'Past',
                    recent: 'Recent',
                    'short-term': 'Short-term',
                    'long-term': 'Long-term',
                  };
                  updated = addChangeLog(
                    updated,
                    'stage_changed',
                    `Moved to ${stageLabels[updates.stage]}`,
                    { fromValue: stageLabels[i.stage], toValue: stageLabels[updates.stage] }
                  );
                }

                // Track blocker status changes
                if (updates.blockerStatus && updates.blockerStatus !== i.blockerStatus) {
                  updated = addChangeLog(
                    updated,
                    'status_changed',
                    `Status changed to ${updates.blockerStatus}`,
                    { fromValue: i.blockerStatus, toValue: updates.blockerStatus }
                  );
                }

                return updated;
              }),
              lastUpdated: now,
            },
          });
        }
      },

      deleteItem: (id) => {
        const { data } = get();
        if (data) {
          // Also remove this item from any dependencies
          const updatedItems = data.items
            .filter((i) => i.id !== id)
            .map((i) => ({
              ...i,
              dependsOn: i.dependsOn?.filter((d) => d !== id),
              enables: i.enables?.filter((e) => e !== id),
              outputIds: i.outputIds?.filter((o) => o !== id),
            }));
          set({
            data: {
              ...data,
              items: updatedItems,
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      archiveItem: (id) => {
        const { data } = get();
        const now = new Date().toISOString();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== id) return i;
                let updated = { ...i, archived: true, completed: true, itemLastUpdated: now };
                updated = addChangeLog(updated, 'archived', 'Archived');
                return updated;
              }),
              lastUpdated: now,
            },
          });
        }
      },

      unarchiveItem: (id) => {
        const { data } = get();
        const now = new Date().toISOString();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== id) return i;
                let updated = { ...i, archived: false, itemLastUpdated: now };
                updated = addChangeLog(updated, 'unarchived', 'Restored from archive');
                return updated;
              }),
              lastUpdated: now,
            },
          });
        }
      },

      // Dependency actions
      addDependency: (fromId, toId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id === fromId) {
                  const dependsOn = i.dependsOn || [];
                  if (!dependsOn.includes(toId)) {
                    return { ...i, dependsOn: [...dependsOn, toId] };
                  }
                }
                if (i.id === toId) {
                  const enables = i.enables || [];
                  if (!enables.includes(fromId)) {
                    return { ...i, enables: [...enables, fromId] };
                  }
                }
                return i;
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      removeDependency: (fromId, toId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id === fromId) {
                  return {
                    ...i,
                    dependsOn: i.dependsOn?.filter((d) => d !== toId),
                  };
                }
                if (i.id === toId) {
                  return {
                    ...i,
                    enables: i.enables?.filter((e) => e !== fromId),
                  };
                }
                return i;
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      // Link actions
      addLink: (itemId, link) => {
        const { data } = get();
        const now = new Date().toISOString();
        if (data) {
          const newLink: ExternalLink = { ...link, id: nanoid() };
          // Determine if this is a notable output (publication, presentation, data)
          const isOutput = link.type === 'publication' || link.type === 'presentation' || link.type === 'data';
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                let updated = { ...i, links: [...(i.links || []), newLink], itemLastUpdated: now };
                if (isOutput) {
                  updated = addChangeLog(
                    updated,
                    'output_added',
                    `Output added: ${link.label}`,
                    { linkLabel: link.label }
                  );
                } else {
                  updated = addChangeLog(
                    updated,
                    'link_added',
                    `Link added: ${link.label}`,
                    { linkLabel: link.label }
                  );
                }
                return updated;
              }),
              lastUpdated: now,
            },
          });
        }
      },

      removeLink: (itemId, linkId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) =>
                i.id === itemId
                  ? { ...i, links: i.links?.filter((l) => l.id !== linkId) }
                  : i
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      // Check-in actions
      addCheckIn: (itemId, label) => {
        const { data } = get();
        if (data) {
          const newCheckIn: CheckIn = { id: nanoid(), label, completed: false };
          set({
            data: {
              ...data,
              items: data.items.map((i) =>
                i.id === itemId
                  ? { ...i, checkIns: [...(i.checkIns || []), newCheckIn] }
                  : i
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      toggleCheckIn: (itemId, checkInId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      checkIns: i.checkIns?.map((c) =>
                        c.id === checkInId ? { ...c, completed: !c.completed } : c
                      ),
                    }
                  : i
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      removeCheckIn: (itemId, checkInId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) =>
                i.id === itemId
                  ? { ...i, checkIns: i.checkIns?.filter((c) => c.id !== checkInId) }
                  : i
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      // Sub-item actions
      addSubItem: (itemId, title) => {
        const { data } = get();
        const now = new Date().toISOString();
        if (data) {
          const item = data.items.find((i) => i.id === itemId);
          const existingSubItems = item?.subItems || [];
          const newSubItem: SubItem = {
            id: nanoid(),
            title,
            completed: false,
            order: existingSubItems.length,
            subStageId: 'backlog', // Default to backlog stage
          };

          // Initialize subItemConfig if not present
          const subItemConfig = item?.subItemConfig || {
            viewType: 'tasks' as SubViewType,
            customStages: [...DEFAULT_SUB_STAGES],
            customStatusTags: [...DEFAULT_STATUS_TAGS],
          };

          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                let updated = {
                  ...i,
                  subItems: [...existingSubItems, newSubItem],
                  subItemConfig,
                  itemLastUpdated: now,
                };
                updated = addChangeLog(
                  updated,
                  'subitem_added',
                  `Sub-item added: ${title}`,
                  { subItemTitle: title }
                );
                return updated;
              }),
              lastUpdated: now,
            },
          });
        }
      },

      updateSubItem: (itemId, subItemId, updates) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      subItems: i.subItems?.map((s) =>
                        s.id === subItemId ? { ...s, ...updates } : s
                      ),
                    }
                  : i
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      deleteSubItem: (itemId, subItemId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      subItems: i.subItems?.filter((s) => s.id !== subItemId),
                    }
                  : i
              ),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      toggleSubItem: (itemId, subItemId) => {
        const { data } = get();
        const now = new Date().toISOString();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                const subItem = i.subItems?.find((s) => s.id === subItemId);
                const newCompleted = subItem ? !subItem.completed : false;
                let updated = {
                  ...i,
                  subItems: i.subItems?.map((s) =>
                    s.id === subItemId ? { ...s, completed: newCompleted } : s
                  ),
                  itemLastUpdated: now,
                };
                // Only log when completing, not when uncompleting
                if (newCompleted && subItem) {
                  updated = addChangeLog(
                    updated,
                    'subitem_completed',
                    `Sub-item completed: ${subItem.title}`,
                    { subItemTitle: subItem.title }
                  );
                }
                return updated;
              }),
              lastUpdated: now,
            },
          });
        }
      },

      reorderSubItems: (itemId, subItemIds) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                const reordered = subItemIds.map((id, index) => {
                  const subItem = i.subItems?.find((s) => s.id === id);
                  return subItem ? { ...subItem, order: index } : null;
                }).filter(Boolean) as SubItem[];
                return { ...i, subItems: reordered };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      // Sub-item config actions
      setSubViewType: (itemId, viewType) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                const config = i.subItemConfig || {
                  viewType,
                  customStages: [...DEFAULT_SUB_STAGES],
                  customStatusTags: [...DEFAULT_STATUS_TAGS],
                };
                return { ...i, subItemConfig: { ...config, viewType } };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      addSubStage: (itemId, label) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                const config = i.subItemConfig || {
                  viewType: 'tasks' as SubViewType,
                  customStages: [...DEFAULT_SUB_STAGES],
                  customStatusTags: [...DEFAULT_STATUS_TAGS],
                };
                const stages = config.customStages || [];
                const newStage: SubStage = {
                  id: nanoid(),
                  label,
                  order: stages.length,
                };
                return {
                  ...i,
                  subItemConfig: {
                    ...config,
                    customStages: [...stages, newStage],
                  },
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      updateSubStage: (itemId, stageId, updates) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId || !i.subItemConfig?.customStages) return i;
                return {
                  ...i,
                  subItemConfig: {
                    ...i.subItemConfig,
                    customStages: i.subItemConfig.customStages.map((s) =>
                      s.id === stageId ? { ...s, ...updates } : s
                    ),
                  },
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      deleteSubStage: (itemId, stageId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId || !i.subItemConfig?.customStages) return i;
                return {
                  ...i,
                  subItemConfig: {
                    ...i.subItemConfig,
                    customStages: i.subItemConfig.customStages.filter(
                      (s) => s.id !== stageId
                    ),
                  },
                  // Move any sub-items in this stage to first available stage
                  subItems: i.subItems?.map((sub) =>
                    sub.subStageId === stageId
                      ? { ...sub, subStageId: i.subItemConfig?.customStages?.[0]?.id }
                      : sub
                  ),
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      reorderSubStages: (itemId, stageIds) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId || !i.subItemConfig?.customStages) return i;
                const reordered = stageIds.map((id, index) => {
                  const stage = i.subItemConfig?.customStages?.find((s) => s.id === id);
                  return stage ? { ...stage, order: index } : null;
                }).filter(Boolean) as SubStage[];
                return {
                  ...i,
                  subItemConfig: { ...i.subItemConfig, customStages: reordered },
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      addSubSwimlane: (itemId, name, color = '#6366F1') => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId) return i;
                const config = i.subItemConfig || {
                  viewType: 'roadmap' as SubViewType,
                  customStages: [...DEFAULT_SUB_STAGES],
                  customStatusTags: [...DEFAULT_STATUS_TAGS],
                };
                const swimlanes = config.customSwimlanes || [];
                const newSwimlane: SubSwimlane = {
                  id: nanoid(),
                  name,
                  color,
                  order: swimlanes.length,
                };
                return {
                  ...i,
                  subItemConfig: {
                    ...config,
                    customSwimlanes: [...swimlanes, newSwimlane],
                  },
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      updateSubSwimlane: (itemId, swimlaneId, updates) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId || !i.subItemConfig?.customSwimlanes) return i;
                return {
                  ...i,
                  subItemConfig: {
                    ...i.subItemConfig,
                    customSwimlanes: i.subItemConfig.customSwimlanes.map((s) =>
                      s.id === swimlaneId ? { ...s, ...updates } : s
                    ),
                  },
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      deleteSubSwimlane: (itemId, swimlaneId) => {
        const { data } = get();
        if (data) {
          set({
            data: {
              ...data,
              items: data.items.map((i) => {
                if (i.id !== itemId || !i.subItemConfig?.customSwimlanes) return i;
                return {
                  ...i,
                  subItemConfig: {
                    ...i.subItemConfig,
                    customSwimlanes: i.subItemConfig.customSwimlanes.filter(
                      (s) => s.id !== swimlaneId
                    ),
                  },
                  // Remove swimlane assignment from sub-items
                  subItems: i.subItems?.map((sub) =>
                    sub.subSwimlaneId === swimlaneId
                      ? { ...sub, subSwimlaneId: undefined }
                      : sub
                  ),
                };
              }),
              lastUpdated: new Date().toISOString(),
            },
          });
        }
      },

      // UI actions
      selectItem: (id) => {
        set((state) => ({
          ui: {
            ...state.ui,
            selectedItemId: id,
            isDetailPanelOpen: id !== null,
          },
        }));
      },

      setDetailPanelOpen: (open) => {
        set((state) => ({
          ui: {
            ...state.ui,
            isDetailPanelOpen: open,
            selectedItemId: open ? state.ui.selectedItemId : null,
          },
        }));
      },

      setEditMode: (edit) => {
        set((state) => ({
          ui: { ...state.ui, isEditMode: edit },
        }));
      },

      setFilters: (filters) => {
        set((state) => ({
          ui: {
            ...state.ui,
            filters: { ...state.ui.filters, ...filters },
          },
        }));
      },

      resetFilters: () => {
        set((state) => ({
          ui: { ...state.ui, filters: defaultFilters },
        }));
      },

      setHoveredItem: (id) => {
        set((state) => ({
          ui: { ...state.ui, hoveredItemId: id },
        }));
      },

      setExpandedItem: (id) => {
        set((state) => ({
          ui: {
            ...state.ui,
            expandedItemId: id,
            // Close detail panel when expanding inline
            isDetailPanelOpen: false,
            selectedItemId: id,
          },
        }));
      },

      setFocusedSwimlane: (id) => {
        set((state) => ({
          ui: { ...state.ui, focusedSwimlaneId: id },
        }));
      },

      setFocusedItem: (id) => {
        set((state) => ({
          ui: { ...state.ui, focusedItemId: id },
        }));
      },

      toggleShowArchived: (swimlaneId) => {
        set((state) => ({
          ui: {
            ...state.ui,
            showArchivedBySwimlane: {
              ...state.ui.showArchivedBySwimlane,
              [swimlaneId]: !state.ui.showArchivedBySwimlane[swimlaneId],
            },
          },
        }));
      },

      setCurrentView: (view) => {
        set((state) => ({
          ui: {
            ...state.ui,
            currentView: view,
          },
        }));
      },

      toggleDependencyLines: () => {
        set((state) => ({
          ui: {
            ...state.ui,
            showDependencyLines: !state.ui.showDependencyLines,
          },
        }));
      },

      // Computed / helpers
      getItem: (id) => {
        const { data } = get();
        return data?.items.find((i) => i.id === id);
      },

      getSwimlane: (id) => {
        const { data } = get();
        return data?.swimlanes.find((s) => s.id === id);
      },

      getItemsBySwimlane: (swimlaneId) => {
        const { data } = get();
        return data?.items.filter((i) => i.swimlaneId === swimlaneId) || [];
      },

      getItemsByStage: (stage) => {
        const { data } = get();
        return data?.items.filter((i) => i.stage === stage) || [];
      },

      getFilteredItems: () => {
        const { data, ui } = get();
        if (!data) return [];

        // Always exclude archived items from the main filtered view
        const nonArchivedItems = data.items.filter((i) => !i.archived);
        const { filters } = ui;

        // Start with base filtered items
        let items = [...nonArchivedItems];

        // Filter by swimlanes - but also include dependency-connected items
        if (filters.swimlanes.length > 0) {
          // Get items in filtered swimlanes
          const primaryItems = nonArchivedItems.filter((i) =>
            filters.swimlanes.includes(i.swimlaneId)
          );
          const primaryIds = new Set(primaryItems.map((i) => i.id));

          // Find all items that have dependency connections to primary items
          const connectedIds = new Set<string>();
          primaryItems.forEach((item) => {
            // Items this one depends on
            item.dependsOn?.forEach((depId) => {
              if (!primaryIds.has(depId)) connectedIds.add(depId);
            });
            // Items that depend on this one (enables)
            item.enables?.forEach((enId) => {
              if (!primaryIds.has(enId)) connectedIds.add(enId);
            });
          });

          // Also check reverse: items from other swimlanes that depend on primary items
          nonArchivedItems.forEach((item) => {
            if (!primaryIds.has(item.id) && !connectedIds.has(item.id)) {
              const dependsOnPrimary = item.dependsOn?.some((id) => primaryIds.has(id));
              const enablesPrimary = item.enables?.some((id) => primaryIds.has(id));
              if (dependsOnPrimary || enablesPrimary) {
                connectedIds.add(item.id);
              }
            }
          });

          // Include primary items + connected items
          items = nonArchivedItems.filter(
            (i) => primaryIds.has(i.id) || connectedIds.has(i.id)
          );
        }

        // Filter by stages
        if (filters.stages.length > 0) {
          items = items.filter((i) => filters.stages.includes(i.stage));
        }

        // Filter by types
        if (filters.types.length > 0) {
          items = items.filter((i) => filters.types.includes(i.type));
        }

        // Filter by blocker status
        if (filters.blockerStatus.length > 0) {
          items = items.filter(
            (i) =>
              i.type !== 'blocker' ||
              (i.blockerStatus && filters.blockerStatus.includes(i.blockerStatus))
          );
        }

        // Filter completed
        if (!filters.showCompleted) {
          items = items.filter((i) => !i.completed);
        }

        // Search query
        if (filters.searchQuery.trim()) {
          const query = filters.searchQuery.toLowerCase();
          items = items.filter(
            (i) =>
              i.title.toLowerCase().includes(query) ||
              i.description?.toLowerCase().includes(query)
          );
        }

        return items;
      },

      getFilteredSwimlanes: () => {
        const { data, ui } = get();
        if (!data) return [];

        const { filters } = ui;

        // If no swimlane filter, return all swimlanes
        if (filters.swimlanes.length === 0) {
          return [...data.swimlanes].sort((a, b) => a.order - b.order);
        }

        // Get filtered items to determine which swimlanes have content
        const filteredItems = get().getFilteredItems();
        const swimlanesWithContent = new Set(filteredItems.map((i) => i.swimlaneId));

        // Return swimlanes that either:
        // 1. Are explicitly in the filter, OR
        // 2. Have dependency-connected items
        return data.swimlanes
          .filter((s) => swimlanesWithContent.has(s.id))
          .sort((a, b) => a.order - b.order);
      },

      isItemCrossSwimlane: (itemId) => {
        const { data, ui } = get();
        if (!data) return false;

        const { filters } = ui;
        if (filters.swimlanes.length === 0) return false;

        const item = data.items.find((i) => i.id === itemId);
        if (!item) return false;

        // Item is cross-swimlane if it's not in the filtered swimlanes
        return !filters.swimlanes.includes(item.swimlaneId);
      },

      getDependencies: (itemId) => {
        const { data } = get();
        const item = data?.items.find((i) => i.id === itemId);
        if (!item?.dependsOn) return [];
        return data?.items.filter((i) => item.dependsOn?.includes(i.id)) || [];
      },

      getDependents: (itemId) => {
        const { data } = get();
        const item = data?.items.find((i) => i.id === itemId);
        if (!item?.enables) return [];
        return data?.items.filter((i) => item.enables?.includes(i.id)) || [];
      },

      getSubStages: (itemId) => {
        const { data } = get();
        const item = data?.items.find((i) => i.id === itemId);
        if (!item?.subItemConfig?.customStages) {
          return [...DEFAULT_SUB_STAGES];
        }
        return [...item.subItemConfig.customStages].sort((a, b) => a.order - b.order);
      },

      getSubSwimlanes: (itemId) => {
        const { data } = get();
        const item = data?.items.find((i) => i.id === itemId);
        if (!item?.subItemConfig?.customSwimlanes) {
          return [];
        }
        return [...item.subItemConfig.customSwimlanes].sort((a, b) => a.order - b.order);
      },

      getSubItemCount: (itemId) => {
        const { data } = get();
        const item = data?.items.find((i) => i.id === itemId);
        const subItems = item?.subItems || [];
        return {
          total: subItems.length,
          completed: subItems.filter((s) => s.completed).length,
        };
      },

      getArchivedCount: (swimlaneId) => {
        const { data } = get();
        if (!data) return 0;
        return data.items.filter(
          (i) => i.swimlaneId === swimlaneId && i.archived
        ).length;
      },

      getArchivedItems: (swimlaneId) => {
        const { data } = get();
        if (!data) return [];
        return data.items.filter(
          (i) => i.swimlaneId === swimlaneId && i.archived
        );
      },

      // Export
      exportData: () => {
        const { data } = get();
        return JSON.stringify(data, null, 2);
      },

      exportSwimlane: (swimlaneId) => {
        const { data } = get();
        if (!data) return '{}';
        const swimlane = data.swimlanes.find((s) => s.id === swimlaneId);
        const items = data.items.filter((i) => i.swimlaneId === swimlaneId);
        const exportData = {
          title: `${data.title} - ${swimlane?.name || 'Unknown'}`,
          lastUpdated: new Date().toISOString(),
          swimlanes: swimlane ? [swimlane] : [],
          items,
        };
        return JSON.stringify(exportData, null, 2);
      },

      exportItem: (itemId) => {
        const { data } = get();
        if (!data) return '{}';
        const item = data.items.find((i) => i.id === itemId);
        if (!item) return '{}';
        const swimlane = data.swimlanes.find((s) => s.id === item.swimlaneId);
        const exportData = {
          title: `${data.title} - ${item.title}`,
          lastUpdated: new Date().toISOString(),
          swimlanes: swimlane ? [swimlane] : [],
          items: [item],
        };
        return JSON.stringify(exportData, null, 2);
      },
    }),
    {
      name: 'roadmap-storage',
      partialize: (state) => ({ data: state.data }),
    }
  )
);
