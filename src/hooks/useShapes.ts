import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Shape } from '../types';

const CANVAS_ID = 'main-canvas'; // Single shared canvas for all users

export const useShapes = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to shapes collection
  useEffect(() => {
    const shapesRef = collection(db, 'canvases', CANVAS_ID, 'shapes');
    
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
  }, []);

  const addShape = useCallback(async (shape: Shape) => {
    try {
      const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shape.id);
      await setDoc(shapeRef, {
        ...shape,
        createdAt: shape.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  }, []);

  const updateShape = useCallback(async (shape: Shape) => {
    try {
      const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shape.id);
      
      // Always use current timestamp for "last write wins"
      // The real-time listener will ensure we see the most recent version
      await setDoc(shapeRef, {
        ...shape,
        updatedAt: Date.now(), // Fresh timestamp = this is the latest version
      }, { merge: true });
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  }, []);

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
    try {
      const shapeRef = doc(db, 'canvases', CANVAS_ID, 'shapes', shapeId);
      await deleteDoc(shapeRef);
    } catch (error) {
      console.error('Error deleting shape:', error);
    }
  }, []);

  return {
    shapes,
    loading,
    addShape,
    updateShape,
    throttledUpdateShape,
    deleteShape,
  };
};

