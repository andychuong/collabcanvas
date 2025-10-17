import { useEffect, useCallback } from 'react';
import { ref, set, onValue, onDisconnect } from 'firebase/database';
import { getAuth } from 'firebase/auth';
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
  selectedShapeIds: string[],
  groupId: string | null
) => {
  // Broadcast current user's selections
  useEffect(() => {
    if (!userId || !groupId) return;

    const userSelectionRef = ref(rtdb, `groups/${groupId}/selections/${userId}`);
    
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
  }, [userId, userName, userColor, selectedShapeIds, groupId]);

  // Setup onDisconnect handler and cleanup on unmount
  useEffect(() => {
    if (!userId || !groupId) return;

    const userSelectionRef = ref(rtdb, `groups/${groupId}/selections/${userId}`);
    
    // Set up automatic cleanup when user disconnects
    onDisconnect(userSelectionRef).set(null).catch((error) => {
      console.warn('Failed to set onDisconnect handler for selections:', error.code);
    });
    
    return () => {
      // Clear selections on unmount
      // Check if user is still authenticated before writing
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        set(userSelectionRef, null).catch((error) => {
          // Silently fail during logout - this is expected
          if (error.code !== 'PERMISSION_DENIED') {
            console.warn('Failed to clear selection:', error.code);
          }
        });
      }
    };
  }, [userId, groupId]);

  // Listen to all users' selections
  const subscribeToSelections = useCallback((callback: (selections: Map<string, UserSelection>) => void) => {
    if (!userId || !groupId) return () => {};

    const selectionsRef = ref(rtdb, `groups/${groupId}/selections`);
    
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
  }, [userId, groupId]);

  return { subscribeToSelections };
};

