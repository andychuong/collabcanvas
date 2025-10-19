import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { ShapeHistoryEntry, Shape, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_ID = 'main-canvas';
const MAX_HISTORY_ENTRIES = 50; // Limit history to prevent excessive storage

export const useShapeHistory = (groupId: string | null, shapeId: string | null) => {
  const [historyEntries, setHistoryEntries] = useState<ShapeHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  // Subscribe to users to get display names
  useEffect(() => {
    if (!groupId) {
      setUsers(new Map());
      return;
    }

    // Users are stored at the top level, not within groups
    // Filter to only get users in the same group
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('groupId', '==', groupId));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersMap = new Map<string, User>();
      
      snapshot.forEach((doc) => {
        const userData = doc.data() as User;
        usersMap.set(doc.id, userData); // Use doc.id as the key (userId)
      });
      
      setUsers(usersMap);
    }, (error) => {
      console.error('Error listening to users:', error);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Subscribe to shape history
  useEffect(() => {
    if (!groupId || !shapeId) {
      setHistoryEntries([]);
      setLoading(false);
      return;
    }

    const historyRef = collection(db, 'groups', groupId, 'canvases', CANVAS_ID, 'history');
    const historyQuery = query(
      historyRef,
      where('shapeId', '==', shapeId),
      orderBy('timestamp', 'desc'),
      limit(MAX_HISTORY_ENTRIES)
    );
    
    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const entries: ShapeHistoryEntry[] = [];
      
      snapshot.forEach((doc) => {
        const entry = doc.data() as ShapeHistoryEntry;
        // Add user name if available
        const user = users.get(entry.userId);
        if (user) {
          entry.userName = user.name;
        }
        entries.push(entry);
      });
      
      setHistoryEntries(entries);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to shape history:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, shapeId, users]);

  // Add a history entry
  const addHistoryEntry = useCallback(async (
    shape: Shape,
    userId: string,
    action: 'created' | 'updated' | 'transformed' | 'styled',
    description?: string
  ) => {
    if (!groupId) return;
    
    try {
      const entryId = uuidv4();
      const user = users.get(userId);
      
      const entry: ShapeHistoryEntry = {
        id: entryId,
        shapeId: shape.id,
        snapshot: { ...shape },
        timestamp: Date.now(),
        userId,
        userName: user?.name,
        action,
        description,
      };
      
      const historyRef = doc(db, 'groups', groupId, 'canvases', CANVAS_ID, 'history', entryId);
      await setDoc(historyRef, entry);
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  }, [groupId, users]);

  // Restore a specific version
  const restoreVersion = useCallback((entry: ShapeHistoryEntry, updateShape: (shape: Shape, immediate?: boolean) => void) => {
    // Create a new shape based on the historical snapshot but with updated timestamp
    const restoredShape: Shape = {
      ...entry.snapshot,
      updatedAt: Date.now(),
    };
    
    // Use immediate=true to ensure the shape is fully updated and history is tracked
    updateShape(restoredShape, true);
  }, []);

  return {
    historyEntries,
    loading,
    addHistoryEntry,
    restoreVersion,
  };
};

