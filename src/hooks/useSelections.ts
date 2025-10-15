import { useEffect, useCallback } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

interface UserSelection {
  userId: string;
  userName: string;
  userColor: string;
  shapeIds: string[];
  timestamp: number;
}

export const useSelections = (
  userId: string | null,
  userName: string,
  userColor: string,
  selectedShapeIds: string[]
) => {
  // Broadcast current user's selections
  useEffect(() => {
    if (!userId) return;

    const userSelectionRef = ref(rtdb, `selections/${userId}`);
    
    const broadcastSelection = async () => {
      try {
        if (selectedShapeIds.length > 0) {
          await set(userSelectionRef, {
            userId,
            userName,
            userColor,
            shapeIds: selectedShapeIds,
            timestamp: Date.now(),
          });
        } else {
          // Clear selection when nothing is selected
          await set(userSelectionRef, null);
        }
      } catch (error) {
        console.error('Error broadcasting selection:', error);
      }
    };

    broadcastSelection();
  }, [userId, userName, userColor, selectedShapeIds]);

  // Cleanup on unmount
  useEffect(() => {
    if (!userId) return;

    const userSelectionRef = ref(rtdb, `selections/${userId}`);
    
    return () => {
      // Clear selections on unmount
      set(userSelectionRef, null).catch(() => {
        // Silently fail during logout
      });
    };
  }, [userId]);

  // Listen to all users' selections
  const subscribeToSelections = useCallback((callback: (selections: Map<string, UserSelection>) => void) => {
    if (!userId) return () => {};

    const selectionsRef = ref(rtdb, 'selections');
    
    const unsubscribe = onValue(
      selectionsRef,
      (snapshot) => {
        try {
          const selectionsData = snapshot.val() || {};
          const selectionsMap = new Map<string, UserSelection>();
          
          // Process all users' selections
          Object.entries(selectionsData).forEach(([uid, data]) => {
            // Skip current user's selections (we already show those locally)
            if (uid !== userId && data) {
              const selection = data as UserSelection;
              // Only include recent selections (within last 10 seconds)
              if (Date.now() - selection.timestamp < 10000) {
                selectionsMap.set(uid, selection);
              }
            }
          });
          
          callback(selectionsMap);
        } catch (error) {
          console.error('Error processing selections:', error);
        }
      },
      (error) => {
        console.error('Error listening to selections:', error);
      }
    );

    return unsubscribe;
  }, [userId]);

  return { subscribeToSelections };
};

