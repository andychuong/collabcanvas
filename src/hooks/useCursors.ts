import { useState, useEffect, useCallback } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase';
import { Cursor } from '../types';

export const useCursors = (userId: string | null, userName: string, userColor: string) => {
  const [cursors, setCursors] = useState<Cursor[]>([]);

  // Listen to all cursors
  useEffect(() => {
    const cursorsRef = ref(rtdb, 'cursors');

    const handleCursorsUpdate = (snapshot: any) => {
      const cursorsData = snapshot.val() || {};
      const cursorsArray: Cursor[] = [];

      for (const [uid, cursor] of Object.entries(cursorsData)) {
        // Don't show our own cursor
        if (uid !== userId && cursor) {
          const c = cursor as Cursor;
          // Only show cursors that have been updated in the last 5 seconds
          if (Date.now() - c.timestamp < 5000) {
            cursorsArray.push(c);
          }
        }
      }

      setCursors(cursorsArray);
    };

    onValue(cursorsRef, handleCursorsUpdate);

    return () => {
      off(cursorsRef, 'value', handleCursorsUpdate);
    };
  }, [userId]);

  // Update cursor position (throttled)
  const updateCursor = useCallback((x: number, y: number) => {
    if (!userId) return;

    const cursorRef = ref(rtdb, `cursors/${userId}`);
    set(cursorRef, {
      userId,
      userName,
      x,
      y,
      color: userColor,
      timestamp: Date.now(),
    });
  }, [userId, userName, userColor]);

  // Throttle cursor updates
  const throttledUpdateCursor = useCallback(
    (() => {
      let lastUpdate = 0;
      const THROTTLE_MS = 75; // 75ms = ~13 updates per second

      return (x: number, y: number) => {
        const now = Date.now();
        if (now - lastUpdate >= THROTTLE_MS) {
          updateCursor(x, y);
          lastUpdate = now;
        }
      };
    })(),
    [updateCursor]
  );

  return {
    cursors,
    updateCursor: throttledUpdateCursor,
  };
};

