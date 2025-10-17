import { useReducer, useCallback, useRef, useEffect } from 'react';
import { Shape, HistoryState } from '../types';

const MAX_HISTORY = 50;

type UndoState = {
  history: HistoryState[];
  currentIndex: number;
};

type UndoAction =
  | { type: 'ADD_TO_HISTORY'; shapes: Shape[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const undoReducer = (state: UndoState, action: UndoAction): UndoState => {
  switch (action.type) {
    case 'ADD_TO_HISTORY': {
      // Remove any future history if we're not at the end
      const newHistory = state.history.slice(0, state.currentIndex + 1);
      
      // Add new state
      newHistory.push({
        shapes: JSON.parse(JSON.stringify(action.shapes)), // Deep clone
        timestamp: Date.now()
      });

      // Limit history size
      let newIndex = newHistory.length - 1;
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        newIndex = MAX_HISTORY - 1;
      }

      return {
        history: newHistory,
        currentIndex: newIndex
      };
    }
    
    case 'UNDO': {
      if (state.currentIndex > 0) {
        return {
          ...state,
          currentIndex: state.currentIndex - 1
        };
      }
      return state;
    }
    
    case 'REDO': {
      if (state.currentIndex < state.history.length - 1) {
        return {
          ...state,
          currentIndex: state.currentIndex + 1
        };
      }
      return state;
    }
    
    default:
      return state;
  }
};

export const useUndo = (initialShapes: Shape[]) => {
  const isInitializedRef = useRef(false);
  
  const [state, dispatch] = useReducer(undoReducer, {
    history: [],
    currentIndex: -1
  });

  const isRestoringRef = useRef(false);
  const lastShapesRef = useRef<string>('');
  
  // Initialize history once shapes are loaded from Firestore
  useEffect(() => {
    if (!isInitializedRef.current && initialShapes.length > 0) {
      isInitializedRef.current = true;
      const shapesJson = JSON.stringify(initialShapes);
      lastShapesRef.current = shapesJson;
      // Add the loaded state as the first history entry
      dispatch({ type: 'ADD_TO_HISTORY', shapes: initialShapes });
    }
  }, [initialShapes]);

  const addToHistory = useCallback((shapes: Shape[]) => {
    // Skip if currently restoring from undo/redo
    if (isRestoringRef.current) {
      return;
    }
    
    const shapesJson = JSON.stringify(shapes);
    
    // Don't add if it's the same as what we last added
    if (shapesJson === lastShapesRef.current) {
      return;
    }
    
    lastShapesRef.current = shapesJson;
    dispatch({ type: 'ADD_TO_HISTORY', shapes });
  }, []);

  const undo = useCallback(() => {
    if (state.currentIndex > 0) {
      const previousShapes = state.history[state.currentIndex - 1].shapes;
      
      isRestoringRef.current = true; // Set flag to prevent history update
      dispatch({ type: 'UNDO' });
      lastShapesRef.current = JSON.stringify(previousShapes); // Update ref to prevent re-adding
      return previousShapes;
    }
    return null;
  }, [state.currentIndex, state.history]);

  const redo = useCallback(() => {
    if (state.currentIndex < state.history.length - 1) {
      isRestoringRef.current = true; // Set flag to prevent history update
      dispatch({ type: 'REDO' });
      const shapes = state.history[state.currentIndex + 1].shapes;
      lastShapesRef.current = JSON.stringify(shapes); // Update ref to prevent re-adding
      return shapes;
    }
    return null;
  }, [state.currentIndex, state.history]);

  const finishRestoring = useCallback(() => {
    isRestoringRef.current = false;
  }, []);

  // Can undo if we're not at the beginning
  const canUndo = state.currentIndex > 0;
  
  const canRedo = state.currentIndex < state.history.length - 1;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    addToHistory,
    finishRestoring
  };
};
