import { useEffect, useState } from 'react';
import { useRoadmapStore } from './store';
import { Board, Toast } from './components';
import { DragDropProvider } from './contexts';
import { useAutoSave } from './hooks';
import type { RoadmapData } from './types';
import './index.css';

function App() {
  const {
    data,
    loadData,
    setEditMode,
    setFocusedSwimlane,
    setFocusedItem,
    setExpandedItem,
    setFilters,
  } = useRoadmapStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters for various modes
    const params = new URLSearchParams(window.location.search);

    // Readonly mode
    if (params.get('view') === 'readonly') {
      setEditMode(false);
    }

    // Focused swimlane (filter to show only this swimlane)
    const swimlaneParam = params.get('swimlane');
    if (swimlaneParam) {
      setFocusedSwimlane(swimlaneParam);
      setFilters({ swimlanes: [swimlaneParam] });
    }

    // Focused/expanded item
    const itemParam = params.get('item');
    if (itemParam) {
      setFocusedItem(itemParam);
      // Auto-expand the item when loading from URL
      setTimeout(() => {
        setExpandedItem(itemParam);
      }, 100);
    }

    // Load data from localStorage (Zustand persist) or fetch from JSON
    const loadRoadmapData = async () => {
      // If we already have data in the store (from localStorage), use it
      if (data) {
        setIsLoading(false);
        return;
      }

      // Otherwise, try to load from the JSON file
      try {
        const response = await fetch('./data/roadmap.json');
        if (!response.ok) {
          throw new Error('Failed to load roadmap data');
        }
        const jsonData: RoadmapData = await response.json();
        loadData(jsonData);
      } catch (err) {
        console.error('Error loading roadmap:', err);
        // Create empty roadmap if no data exists
        loadData({
          title: 'New Roadmap',
          lastUpdated: new Date().toISOString(),
          swimlanes: [],
          items: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRoadmapData();
  }, []);

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading roadmap...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="loading">{error}</div>
      </div>
    );
  }

  return (
    <DragDropProvider>
      <div className="app">
        <Board />
        <AutoSaveHandler />
      </div>
    </DragDropProvider>
  );
}

// Separate component to handle auto-save and toast
function AutoSaveHandler() {
  const { showToast, dismissToast } = useAutoSave();

  if (!showToast) return null;

  return (
    <Toast
      message={showToast.message}
      type={showToast.type}
      onClose={dismissToast}
    />
  );
}

export default App;
