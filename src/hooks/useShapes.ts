import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Shape, ShapeHistoryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_ID = 'main-canvas'; // Canvas identifier within each group

export const useShapes = (groupId: string | null, userId?: string) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to shapes collection
  useEffect(() => {
    if (!groupId) {
      setShapes([]);
      setLoading(false);
      return;
    }

    const shapesRef = collection(db, 'groups', groupId, 'canvases', CANVAS_ID, 'shapes');
    
    const unsubscribe = onSnapshot(shapesRef, (snapshot) => {
      const shapesData: Shape[] = [];
      
      snapshot.forEach((doc) => {
        shapesData.push({ ...doc.data() } as Shape);
      });

      // Sort by creation time for consistent ordering
      shapesData.sort((a, b) => a.createdAt - b.createdAt);
      
      setShapes(shapesData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to shapes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Helper function to save history entry
  const saveHistoryEntry = useCallback(async (
    shape: Shape,
    action: 'created' | 'updated' | 'transformed' | 'styled'
  ) => {
    if (!groupId || !userId) return;
    
    try {
      const entryId = uuidv4();
      const entry: ShapeHistoryEntry = {
        id: entryId,
        shapeId: shape.id,
        snapshot: { ...shape },
        timestamp: Date.now(),
        userId,
        action,
      };
      
      const historyRef = doc(db, 'groups', groupId, 'canvases', CANVAS_ID, 'history', entryId);
      await setDoc(historyRef, entry);
    } catch (error) {
      console.error('Error saving history entry:', error);
    }
  }, [groupId, userId]);

  const addShape = useCallback(async (shape: Shape, skipHistory: boolean = false) => {
    if (!groupId) return;
    
    try {
      const shapeRef = doc(db, 'groups', groupId, 'canvases', CANVAS_ID, 'shapes', shape.id);
      const shapeData = {
        ...shape,
        createdAt: shape.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await setDoc(shapeRef, shapeData);
      
      // Save creation history only if not skipped
      // Skip for shapes with two-step creation (rectangle, circle, arrow) - save history on finalization instead
      if (userId && !skipHistory) {
        await saveHistoryEntry(shapeData, 'created');
      }
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  }, [groupId, userId, saveHistoryEntry]);

  const updateShape = useCallback(async (shape: Shape, trackHistory: boolean = false) => {
    if (!groupId) return;
    
    try {
      const shapeRef = doc(db, 'groups', groupId, 'canvases', CANVAS_ID, 'shapes', shape.id);
      
      // Always use current timestamp for "last write wins"
      // The real-time listener will ensure we see the most recent version
      const updatedShape = {
        ...shape,
        updatedAt: Date.now(), // Fresh timestamp = this is the latest version
      };
      
      await setDoc(shapeRef, updatedShape, { merge: true });
      
      // Determine action type based on what changed
      // Only track history if explicitly requested (for final updates, not intermediate drag movements)
      if (trackHistory && userId) {
        const existingShape = shapes.find(s => s.id === shape.id);
        let action: 'created' | 'updated' | 'transformed' | 'styled' = 'updated';
        
        if (existingShape) {
          // Check if this shape was just created with placeholder dimensions
          // (width/height = 1, or radius = 1) - treat as creation
          const isPlaceholder = (existingShape.width === 1 && existingShape.height === 1) || 
                               existingShape.radius === 1;
          
          if (isPlaceholder) {
            // This is the first real update after creation with placeholder dimensions
            action = 'created';
          } else {
            // Check if position/size changed (transformation)
            const posChanged = existingShape.x !== shape.x || existingShape.y !== shape.y;
            const sizeChanged = existingShape.width !== shape.width || 
                               existingShape.height !== shape.height ||
                               existingShape.radius !== shape.radius;
            const rotationChanged = existingShape.rotation !== shape.rotation;
            
            // Check if style changed
            const styleChanged = existingShape.fill !== shape.fill ||
                                existingShape.stroke !== shape.stroke ||
                                existingShape.strokeWidth !== shape.strokeWidth;
            
            if (posChanged || sizeChanged || rotationChanged) {
              action = 'transformed';
            } else if (styleChanged) {
              action = 'styled';
            }
          }
        }
        
        await saveHistoryEntry(updatedShape, action);
      }
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  }, [groupId, userId, shapes, saveHistoryEntry]);

  // Batch update multiple shapes at once using Firebase WriteBatch for atomic updates
  const batchUpdateShapes = useCallback(async (shapes: Shape[]) => {
    if (!groupId) return;
    
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      // Use the same timestamp for all shapes in the batch for perfect synchronization
      const timestamp = Date.now();
      
      shapes.forEach(shape => {
        const shapeRef = doc(db, 'groups', groupId, 'canvases', CANVAS_ID, 'shapes', shape.id);
        batch.set(shapeRef, {
          ...shape,
          updatedAt: timestamp, // Same timestamp for all shapes
        }, { merge: true });
      });
      
      // Commit all updates atomically - they all succeed or all fail together
      await batch.commit();
    } catch (error) {
      console.error('Error batch updating shapes:', error);
    }
  }, [groupId]);

  // Throttled batch update for smooth multi-shape dragging
  const throttledBatchUpdate = useCallback(
    (() => {
      const pendingShapes = new Map<string, Shape>();
      let rafId: number | null = null;
      
      const flush = () => {
        if (pendingShapes.size > 0) {
          const shapesToUpdate = Array.from(pendingShapes.values());
          batchUpdateShapes(shapesToUpdate);
          pendingShapes.clear();
        }
        rafId = null;
      };

      return (shapes: Shape[]) => {
        // Add/update shapes in pending batch
        shapes.forEach(shape => {
          pendingShapes.set(shape.id, shape);
        });

        // Use requestAnimationFrame to batch updates at display refresh rate
        // This ensures smooth updates without overwhelming Firebase
        if (!rafId) {
          rafId = requestAnimationFrame(flush);
        }
      };
    })(),
    [batchUpdateShapes]
  );

  // Throttled version for drag operations with auto-flush
  const throttledUpdateShape = useCallback(
    (() => {
      const pendingUpdates = new Map<string, Shape>();
      const lastUpdateTime = new Map<string, number>();
      let timeoutId: NodeJS.Timeout | null = null;
      let finalFlushTimeoutId: NodeJS.Timeout | null = null;
      const THROTTLE_MS = 16; // Update Firestore at most every 16ms (~60 FPS)
      const FINAL_FLUSH_MS = 150; // After no updates for 150ms, force a final flush

      const flush = () => {
        if (pendingUpdates.size > 0) {
          // Process all pending updates in batch
          pendingUpdates.forEach((shape) => {
            updateShape(shape);
          });
          pendingUpdates.clear();
        }
        timeoutId = null;
      };

      const scheduleFlush = () => {
        if (!timeoutId) {
          timeoutId = setTimeout(flush, THROTTLE_MS);
        }
      };

      const scheduleFinalFlush = () => {
        // Clear any existing final flush
        if (finalFlushTimeoutId) {
          clearTimeout(finalFlushTimeoutId);
        }
        
        // Schedule a final flush after inactivity
        finalFlushTimeoutId = setTimeout(() => {
          flush();
          finalFlushTimeoutId = null;
        }, FINAL_FLUSH_MS);
      };

      return (shape: Shape) => {
        // Store the latest version of this shape
        pendingUpdates.set(shape.id, shape);
        lastUpdateTime.set(shape.id, Date.now());

        // Schedule regular flush
        scheduleFlush();
        
        // Schedule final flush (resets on each update)
        scheduleFinalFlush();
      };
    })(),
    [updateShape]
  );

  const deleteShape = useCallback(async (shapeId: string) => {
    if (!groupId) return;
    
    try {
      const shapeRef = doc(db, 'groups', groupId, 'canvases', CANVAS_ID, 'shapes', shapeId);
      await deleteDoc(shapeRef);
    } catch (error) {
      console.error('Error deleting shape:', error);
    }
  }, [groupId]);

  return {
    shapes,
    loading,
    addShape,
    updateShape,
    batchUpdateShapes,
    throttledBatchUpdate,
    throttledUpdateShape,
    deleteShape,
  };
};

