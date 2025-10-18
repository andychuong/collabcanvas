import { useState, useCallback } from 'react';
import { ShapeType } from '../types';

/**
 * Represents the state of a shape that is currently being placed/drawn
 */
type ShapePlacementState =
  | { type: 'line'; shapeId: string; startX: number; startY: number }
  | { type: 'rectangle'; shapeId: string; startX: number; startY: number }
  | { type: 'arrow'; shapeId: string; startX: number; startY: number }
  | { type: 'circle'; shapeId: string; centerX: number; centerY: number }
  | null;

/**
 * Hook for managing shape placement state.
 * Consolidates the various "in progress" states for different shape types.
 * 
 * Previously managed as separate states:
 * - lineInProgress
 * - rectangleInProgress
 * - arrowInProgress
 * - circleInProgress
 */
export function useShapePlacement() {
  const [placementState, setPlacementState] = useState<ShapePlacementState>(null);
  const [circleJustFinalized, setCircleJustFinalized] = useState<string | null>(null);

  /**
   * Start placing a line shape
   */
  const startLine = useCallback((shapeId: string, startX: number, startY: number) => {
    setPlacementState({ type: 'line', shapeId, startX, startY });
  }, []);

  /**
   * Start placing a rectangle shape
   */
  const startRectangle = useCallback((shapeId: string, startX: number, startY: number) => {
    setPlacementState({ type: 'rectangle', shapeId, startX, startY });
  }, []);

  /**
   * Start placing an arrow shape
   */
  const startArrow = useCallback((shapeId: string, startX: number, startY: number) => {
    setPlacementState({ type: 'arrow', shapeId, startX, startY });
  }, []);

  /**
   * Start placing a circle shape
   */
  const startCircle = useCallback((shapeId: string, centerX: number, centerY: number) => {
    setPlacementState({ type: 'circle', shapeId, centerX, centerY });
  }, []);

  /**
   * Clear the placement state
   */
  const clearPlacement = useCallback(() => {
    setPlacementState(null);
  }, []);

  /**
   * Finalize a circle placement (for undo history tracking)
   */
  const finalizeCircle = useCallback((shapeId: string) => {
    setCircleJustFinalized(shapeId);
    clearPlacement();
  }, [clearPlacement]);

  /**
   * Clear the circle finalization marker
   */
  const clearCircleFinalized = useCallback(() => {
    setCircleJustFinalized(null);
  }, []);

  // Helper getters for specific shape types
  const lineInProgress = placementState?.type === 'line' ? placementState : null;
  const rectangleInProgress = placementState?.type === 'rectangle' ? placementState : null;
  const arrowInProgress = placementState?.type === 'arrow' ? placementState : null;
  const circleInProgress = placementState?.type === 'circle' ? placementState : null;

  // Helper to check if any shape is in progress
  const hasShapeInProgress = placementState !== null;

  // Helper to get the current shape type
  const currentShapeType: ShapeType | null = placementState ? placementState.type : null;

  return {
    // State
    placementState,
    lineInProgress,
    rectangleInProgress,
    arrowInProgress,
    circleInProgress,
    circleJustFinalized,
    hasShapeInProgress,
    currentShapeType,
    
    // Actions
    startLine,
    startRectangle,
    startArrow,
    startCircle,
    clearPlacement,
    finalizeCircle,
    clearCircleFinalized,
    
    // Setters for compatibility with existing code
    setLineInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => {
      if (value) {
        startLine(value.shapeId, value.startX, value.startY);
      } else {
        clearPlacement();
      }
    },
    setRectangleInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => {
      if (value) {
        startRectangle(value.shapeId, value.startX, value.startY);
      } else {
        clearPlacement();
      }
    },
    setArrowInProgress: (value: { shapeId: string; startX: number; startY: number } | null) => {
      if (value) {
        startArrow(value.shapeId, value.startX, value.startY);
      } else {
        clearPlacement();
      }
    },
    setCircleInProgress: (value: { shapeId: string; centerX: number; centerY: number } | null) => {
      if (value) {
        startCircle(value.shapeId, value.centerX, value.centerY);
      } else {
        clearPlacement();
      }
    },
    setCircleJustFinalized,
  };
}

