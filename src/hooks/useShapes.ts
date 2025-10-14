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
      await setDoc(shapeRef, {
        ...shape,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  }, []);

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
    deleteShape,
  };
};

