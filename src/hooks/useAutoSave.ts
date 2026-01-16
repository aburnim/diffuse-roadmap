import { useEffect, useRef, useCallback, useState } from 'react';
import { useRoadmapStore } from '../store';
import type { RoadmapData } from '../types';

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

// Debounce delay in ms
const SAVE_DELAY = 2000;

export function useAutoSave() {
  const { data } = useRoadmapStore();
  const [saveState, setSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const saveToFile = useCallback(async (dataToSave: RoadmapData) => {
    setSaveState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const response = await fetch('/api/save-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const result = await response.json();

      if (result.success) {
        setSaveState({
          isSaving: false,
          lastSaved: new Date(),
          error: null,
        });
        setShowToast({ message: 'Saved', type: 'success' });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save';
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
      // Only show error toast if it's not a network error (server might not be running)
      if (!errorMessage.includes('fetch')) {
        setShowToast({ message: `Save failed: ${errorMessage}`, type: 'error' });
      }
    }
  }, []);

  // Watch for data changes and trigger debounced save
  useEffect(() => {
    if (!data) return;

    const currentDataString = JSON.stringify(data);

    // Skip initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousDataRef.current = currentDataString;
      return;
    }

    // Skip if data hasn't actually changed
    if (previousDataRef.current === currentDataString) {
      return;
    }

    previousDataRef.current = currentDataString;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveToFile(data);
    }, SAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveToFile]);

  const dismissToast = useCallback(() => {
    setShowToast(null);
  }, []);

  return {
    ...saveState,
    showToast,
    dismissToast,
  };
}
