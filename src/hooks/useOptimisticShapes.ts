import { useState, useEffect, useCallback } from 'react';
import { Shape } from '../types';

/**
 * Hook for managing optimistic UI updates for shapes.
 * 
 * Implements "Last Write Wins" strategy:
 * - Local updates are applied immediately for instant feedback
 * - Changes are synced to Firestore with throttling
 * - Firestore updates override local changes if they have newer timestamps
 * 
 * @param firestoreShapes - Shapes from Firestore
 * @param addShape - Function to add shape to Firestore
 * @param updateShape - Function to update shape in Firestore
 * @param throttledUpdateShape - Throttled version of updateShape
 * @param throttledBatchUpdate - Throttled batch update function
 * @param addToHistory - Function to add shapes to undo history
 */
export function useOptimisticShapes(
  firestoreShapes: Shape[],
  addShape: (shape: Shape, skipHistory?: boolean) => void,
  updateShape: (shape: Shape, trackHistory?: boolean) => void,
  throttledUpdateShape: (shape: Shape) => void,
  throttledBatchUpdate: (shapes: Shape[]) => void,
  addToHistory: (shapes: Shape[]) => void
) {
  // Local optimistic updates for shapes being actively manipulated
  const [localShapeUpdates, setLocalShapeUpdates] = useState<Map<string, Shape>>(new Map());

  // Merge Firestore shapes with local updates (last write wins based on timestamp)
  const shapes = (() => {
    // Start with Firestore shapes and apply local updates
    const shapeMap = new Map<string, Shape>();
    
    // Add all Firestore shapes
    firestoreShapes.forEach(shape => {
      shapeMap.set(shape.id, shape);
    });
    
    // Apply local updates (including new shapes not yet in Firestore)
    localShapeUpdates.forEach((localShape, id) => {
      const firestoreShape = shapeMap.get(id);
      
      if (!firestoreShape) {
        // New shape not yet in Firestore, use local version
        shapeMap.set(id, localShape);
      } else if (localShape.updatedAt > firestoreShape.updatedAt) {
        // Local is newer, use it
        shapeMap.set(id, localShape);
      }
      // Otherwise keep Firestore version (it's newer)
    });
    
    // Convert back to array and sort by creation time
    return Array.from(shapeMap.values()).sort((a, b) => a.createdAt - b.createdAt);
  })();

  // Clean up local updates after Firestore sync (last write wins)
  // If Firestore has a newer or equal timestamp, prefer it over local updates
  useEffect(() => {
    if (localShapeUpdates.size > 0) {
      setLocalShapeUpdates(prev => {
        const next = new Map(prev);
        let hasChanges = false;
        
        prev.forEach((localShape, id) => {
          const firestoreShape = firestoreShapes.find(s => s.id === id);
          
          if (firestoreShape) {
            // LAST WRITE WINS: If Firestore version is newer or equal, clear local update
            // This ensures that updates from other users always take precedence when newer
            if (firestoreShape.updatedAt >= localShape.updatedAt) {
              next.delete(id);
              hasChanges = true;
            }
            // If local is newer, it means we have pending changes that haven't synced yet
            // Keep the local update until Firestore catches up
          }
        });
        
        return hasChanges ? next : prev;
      });
    }
  }, [firestoreShapes, localShapeUpdates]);

  // Helper to add shape with local optimistic update
  const addShapeOptimistic = useCallback((shape: Shape) => {
    // Immediately add to local state for instant feedback
    setLocalShapeUpdates(prev => {
      const next = new Map(prev);
      next.set(shape.id, shape);
      return next;
    });
    
    // Then sync to Firestore
    addShape(shape);
  }, [addShape]);

  // Helper for shape updates with optimistic UI and history
  const handleShapeUpdate = useCallback((shape: Shape, immediate = false) => {
    setLocalShapeUpdates(prev => {
      const next = new Map(prev);
      next.set(shape.id, shape);
      return next;
    });
    
    if (immediate) {
      // For immediate updates (drag end, resize end, etc.), track history
      updateShape(shape, true); // trackHistory = true
      const updatedShapes = shapes.map(s => s.id === shape.id ? shape : s);
      setTimeout(() => {
        addToHistory(updatedShapes);
      }, 100);
    } else {
      // For throttled updates (during dragging), don't track history
      throttledUpdateShape(shape);
    }
  }, [updateShape, throttledUpdateShape, addToHistory, shapes]);

  // Helper for batch shape updates with optimistic UI
  const handleBatchShapeUpdate = useCallback((updatedShapes: Shape[]) => {
    // IMMEDIATELY update local state for all shapes for instant visual feedback
    setLocalShapeUpdates(prev => {
      const next = new Map(prev);
      updatedShapes.forEach(shape => {
        next.set(shape.id, shape);
      });
      return next;
    });
    
    // Then throttle the Firebase batch update
    throttledBatchUpdate(updatedShapes);
  }, [throttledBatchUpdate]);

  return {
    shapes,
    addShapeOptimistic,
    handleShapeUpdate,
    handleBatchShapeUpdate,
  };
}

