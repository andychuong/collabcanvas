import { useEffect } from 'react';
import { Shape, ShapeType, ViewportState } from '../types';

interface UseKeyboardShortcutsProps {
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  shapeToPlace: ShapeType | null;
  lineInProgress: { shapeId: string; startX: number; startY: number } | null;
  rectangleInProgress: { shapeId: string; startX: number; startY: number } | null;
  circleInProgress: { shapeId: string; centerX: number; centerY: number } | null;
  shapes: Shape[];
  handleDeleteSelected: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  setIsSelectMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  deleteShape: (id: string) => void;
  getInitialViewport: () => ViewportState;
  setViewport: (viewport: ViewportState) => void;
  setLineInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => void;
  setRectangleInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => void;
  setCircleInProgress: (value: { shapeId: string; centerX: number; centerY: number } | null) => void;
  setShapeToPlace: (type: ShapeType | null) => void;
  setSelectedShapeId: (id: string | null) => void;
  setSelectedShapeIds: (ids: string[]) => void;
  handleShapeUpdate: (shape: Shape, immediate?: boolean) => void;
}

export const useKeyboardShortcuts = ({
  selectedShapeId,
  selectedShapeIds,
  shapeToPlace,
  lineInProgress,
  rectangleInProgress,
  circleInProgress,
  shapes,
  handleDeleteSelected,
  handleUndo,
  handleRedo,
  setIsSelectMode,
  deleteShape,
  getInitialViewport,
  setViewport,
  setLineInProgress,
  setRectangleInProgress,
  setCircleInProgress,
  setShapeToPlace,
  setSelectedShapeId,
  setSelectedShapeIds,
  handleShapeUpdate,
}: UseKeyboardShortcutsProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're editing text (don't trigger shortcuts in text fields)
      const isEditingText = (e.target as HTMLElement)?.tagName === 'TEXTAREA' || 
                           (e.target as HTMLElement)?.tagName === 'INPUT';

      // Arrow keys - move selected shapes (only when not editing text)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isEditingText) {
        if (selectedShapeIds.length > 0 || selectedShapeId) {
          e.preventDefault();
          
          // Determine movement distance (1px normal, 10px with Shift)
          const distance = e.shiftKey ? 10 : 1;
          
          // Calculate delta based on arrow key
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -distance;
          if (e.key === 'ArrowDown') dy = distance;
          if (e.key === 'ArrowLeft') dx = -distance;
          if (e.key === 'ArrowRight') dx = distance;
          
          // Get the shapes to move
          const shapeIdsToMove = selectedShapeIds.length > 0 ? selectedShapeIds : (selectedShapeId ? [selectedShapeId] : []);
          
          // Update each selected shape
          shapeIdsToMove.forEach(shapeId => {
            const shape = shapes.find(s => s.id === shapeId);
            if (shape) {
              const updatedShape: Shape = {
                ...shape,
                x: shape.x + dx,
                y: shape.y + dy,
                updatedAt: Date.now(),
              };
              handleShapeUpdate(updatedShape, true);
            }
          });
          return;
        }
      }

      // Spacebar - reset viewport to original view (only when not editing text)
      if (e.key === ' ' && !isEditingText) {
        e.preventDefault();
        setViewport(getInitialViewport());
        return;
      }

      // Escape key - cancel placement mode or deselect
      if (e.key === 'Escape') {
        if (lineInProgress) {
          deleteShape(lineInProgress.shapeId);
          setLineInProgress(null);
          setShapeToPlace(null);
        } else if (rectangleInProgress) {
          deleteShape(rectangleInProgress.shapeId);
          setRectangleInProgress(null);
          setShapeToPlace(null);
        } else if (circleInProgress) {
          deleteShape(circleInProgress.shapeId);
          setCircleInProgress(null);
          setShapeToPlace(null);
        } else if (shapeToPlace) {
          setShapeToPlace(null);
        } else {
          setSelectedShapeId(null);
          setSelectedShapeIds([]);
        }
        return;
      }

      // V key - toggle select mode (only when not editing text)
      if (e.key === 'v' && !isEditingText) {
        e.preventDefault();
        setIsSelectMode(prev => !prev);
        setShapeToPlace(null);
        return;
      }

      // Undo with Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo with Ctrl+Y or Ctrl+Shift+Z (or Cmd+Y / Cmd+Shift+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }

      // Delete selected shape(s) with Delete or Backspace (only when not editing text)
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedShapeId || selectedShapeIds.length > 0) && !isEditingText) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedShapeId,
    selectedShapeIds,
    shapeToPlace,
    lineInProgress,
    rectangleInProgress,
    circleInProgress,
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    setIsSelectMode,
    deleteShape,
    getInitialViewport,
    setViewport,
    setLineInProgress,
    setRectangleInProgress,
    setCircleInProgress,
    setShapeToPlace,
    setSelectedShapeId,
    setSelectedShapeIds,
    shapes,
    handleShapeUpdate,
  ]);
};

