import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { rtdb, db } from '../firebase';
import { User as UserType } from '../types';
import { getUserColor } from '../utils/colors';

export const usePresence = (
  userId: string | null,
  userName?: string,
  userEmail?: string,
  userColor?: string,
  groupId?: string | null
) => {
  const [onlineUsers, setOnlineUsers] = useState<UserType[]>([]);

  // Optimistically add current user to avoid showing 0 on initial load
  useEffect(() => {
    if (userId && userName && userColor && groupId) {
      setOnlineUsers(prev => {
        // Check if current user is already in the list
        const existingUser = prev.find(u => u.id === userId);
        if (existingUser) return prev;
        
        // Add current user immediately (will be replaced by RTDB data once available)
        return [{
          id: userId,
          name: userName,
          email: userEmail || '',
          color: userColor,
          groupId: groupId,
          online: true,
          lastSeen: Date.now(),
        }, ...prev];
      });
    }
  }, [userId, userName, userEmail, userColor, groupId]);

  useEffect(() => {
    if (!userId || !groupId || !userName) return;

    // Set user as online in Realtime Database
    const userStatusRef = ref(rtdb, `groups/${groupId}/presence/${userId}`);
    
    const setOnline = async () => {
      try {
        // IMPORTANT: Update Firestore FIRST before RTDB
        // This ensures user data is available when RTDB listeners fire
        const userDocRef = doc(db, 'users', userId);
        
        // Check if user doc exists, if not create it with basic info
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // Create user document with basic info from auth
          const { getAuth } = await import('firebase/auth');
          const currentUser = getAuth().currentUser;
          
          // Note: We don't have groupName here, but that's okay
          // It will be set properly during registration in Auth.tsx
          await setDoc(userDocRef, {
            id: userId,
            name: userName || currentUser?.displayName || 'Anonymous',
            email: userEmail || currentUser?.email || '',
            color: userColor || getUserColor(userId),
            groupId: groupId,
            createdAt: Date.now(),
            online: true,
            lastSeen: Date.now(),
          });
        } else {
          // Update existing document
          await setDoc(userDocRef, {
            online: true,
            lastSeen: Date.now(),
          }, { merge: true });
        }

        // Now update Realtime Database (triggers listeners in other clients)
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    };

    const setOffline = async () => {
      try {
        // Update Firestore first, then RTDB (consistent with setOnline)
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          online: false,
          lastSeen: Date.now(),
        }, { merge: true });
        
        await set(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
      } catch (error) {
        // Silently fail - this might happen during logout
        console.error('Could not set offline status:', error);
      }
    };

    setOnline();

    // Set up disconnect handler
    onDisconnect(userStatusRef).set({
      online: false,
      lastSeen: serverTimestamp(),
    });

    // Handle tab visibility
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Only update Firestore on cleanup (not RTDB)
      // RTDB updates are handled by:
      // 1. onDisconnect handler (for unexpected disconnections)
      // 2. markOffline() function (for explicit logout)
      // We can't update RTDB here because user may have already signed out
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', userId);
        setDoc(userDocRef, {
          online: false,
          lastSeen: Date.now(),
        }, { merge: true }).catch((error) => {
          // Silently fail - expected during logout
          if (error.code !== 'permission-denied') {
            console.warn('Failed to update user presence on cleanup:', error.code);
          }
        });
      }
    };
  }, [userId, groupId, userName]);

  // Listen to presence changes - only when user is authenticated
  useEffect(() => {
    // Don't set up listener if user is not authenticated or no groupId
    if (!userId || !groupId) return;
    
    const presenceRef = ref(rtdb, `groups/${groupId}/presence`);
    
    const unsubscribeRTDB = onValue(
      presenceRef, 
      async (snapshot) => {
        try {
          const presenceData = snapshot.val() || {};
          
          // Get IDs of users who are online according to RTDB
          const onlineUserIds = Object.keys(presenceData).filter(
            uid => (presenceData[uid] as any).online
          );
          
          // Fetch all user data from Firestore in parallel
          const userPromises = onlineUserIds.map(async (uid) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', uid));
              if (userDoc.exists()) {
                return userDoc.data() as UserType;
              }
              return null;
            } catch (error) {
              console.error(`Error fetching user ${uid}:`, error);
              return null;
            }
          });
          
          const userResults = await Promise.all(userPromises);
          const users = userResults.filter((u): u is UserType => u !== null);

          // Update state with deduplicated users
          setOnlineUsers(() => {
            // Create a map to ensure each user appears only once
            const userMap = new Map<string, UserType>();
            
            // Add users from RTDB (source of truth for online status)
            users.forEach(user => {
              userMap.set(user.id, user);
            });
            
            return Array.from(userMap.values());
          });
        } catch (error) {
          console.error('Error processing presence data:', error);
        }
      },
      (error) => {
        console.error('Error listening to presence:', error);
      }
    );

    return () => {
      unsubscribeRTDB();
    };
  }, [userId, groupId]); // Re-run when userId or groupId changes (user logs in/out)

  // Expose a manual cleanup function for explicit logout
  const markOffline = useCallback(async () => {
    if (!userId || !groupId) return;
    
    const userStatusRef = ref(rtdb, `groups/${groupId}/presence/${userId}`);
    const userDocRef = doc(db, 'users', userId);
    
    try {
      await Promise.all([
        setDoc(userDocRef, {
          online: false,
          lastSeen: Date.now(),
        }, { merge: true }),
        set(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        })
      ]);
    } catch (error) {
      console.error('Error marking user offline:', error);
    }
  }, [userId, groupId]);

  return { onlineUsers, markOffline };
};

