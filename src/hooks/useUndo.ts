import { useState, useCallback, useEffect, useRef } from 'react';
import { Shape, HistoryState } from '../types';

const MAX_HISTORY = 50;

export const useUndo = (initialShapes: Shape[]) => {
  const [history, setHistory] = useState<HistoryState[]>([{
    shapes: initialShapes,
    timestamp: Date.now()
  }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isRestoringRef = useRef(false); // Flag to prevent history updates during undo/redo

  // Update history when shapes change externally (but not during undo/redo)
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    
    if (history.length === 0 || JSON.stringify(initialShapes) !== JSON.stringify(history[currentIndex]?.shapes)) {
      addToHistory(initialShapes);
    }
  }, [initialShapes]);

  const addToHistory = useCallback((shapes: Shape[]) => {
    setHistory((prev) => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({
        shapes: JSON.parse(JSON.stringify(shapes)), // Deep clone
        timestamp: Date.now()
      });

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        setCurrentIndex(prev => prev);
        return newHistory;
      }

      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isRestoringRef.current = true; // Set flag to prevent history update
      setCurrentIndex(currentIndex - 1);
      return history[currentIndex - 1].shapes;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isRestoringRef.current = true; // Set flag to prevent history update
      setCurrentIndex(currentIndex + 1);
      return history[currentIndex + 1].shapes;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    addToHistory
  };
};

