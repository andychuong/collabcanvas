import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../firebase';
import { User as UserType } from '../types';
import { getUserColor } from '../utils/colors';

export const usePresence = (
  userId: string | null,
  userName?: string,
  userEmail?: string,
  userColor?: string
) => {
  const [onlineUsers, setOnlineUsers] = useState<UserType[]>([]);

  // Immediately add current user to online users list to avoid showing 0
  useEffect(() => {
    if (userId && userName && userColor) {
      setOnlineUsers(prev => {
        // Check if current user is already in the list
        const existingUser = prev.find(u => u.id === userId);
        if (existingUser) return prev;
        
        // Add current user immediately
        return [{
          id: userId,
          name: userName,
          email: userEmail || '',
          color: userColor,
          online: true,
          lastSeen: Date.now(),
        }, ...prev];
      });
    }
  }, [userId, userName, userEmail, userColor]);

  useEffect(() => {
    if (!userId) return;

    // Set user as online in Realtime Database
    const userStatusRef = ref(rtdb, `presence/${userId}`);
    
    const setOnline = async () => {
      try {
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });

        // Also update Firestore - use setDoc with merge to create if doesn't exist
        const userDocRef = doc(db, 'users', userId);
        
        // Check if user doc exists, if not create it with basic info
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // Create user document with basic info from auth
          const { getAuth } = await import('firebase/auth');
          const currentUser = getAuth().currentUser;
          
          await setDoc(userDocRef, {
            id: userId,
            name: userName || currentUser?.displayName || 'Anonymous',
            email: userEmail || currentUser?.email || '',
            color: userColor || getUserColor(userId),
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
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    };

    const setOffline = async () => {
      try {
        // Update both RTDB and Firestore when manually going offline (e.g., tab hidden)
        await set(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp(),
        });
        
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          online: false,
          lastSeen: Date.now(),
        }, { merge: true });
      } catch (error) {
        // Log but don't throw - this might happen during logout
        console.log('Could not set offline status (user may be logging out)');
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
      // Only update Firestore on cleanup - RTDB is handled by onDisconnect
      const userDocRef = doc(db, 'users', userId);
      setDoc(userDocRef, {
        online: false,
        lastSeen: Date.now(),
      }, { merge: true }).catch(() => {
        // Ignore errors during cleanup (user may have logged out)
        console.log('Cleanup: Could not update presence (expected during logout)');
      });
    };
  }, [userId]);

  // Listen to presence changes
  useEffect(() => {
    const presenceRef = ref(rtdb, 'presence');
    
    const unsubscribeRTDB = onValue(
      presenceRef, 
      async (snapshot) => {
        try {
          const presenceData = snapshot.val() || {};
          
          // For simplicity, we'll just track online status from RTDB
          // In production, you'd want to join this with Firestore user data
          const users: UserType[] = [];
          
          for (const [uid, status] of Object.entries(presenceData)) {
            if ((status as any).online) {
              // Fetch user from Firestore
              try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                
                if (userDoc.exists()) {
                  users.push(userDoc.data() as UserType);
                }
              } catch (error) {
                console.error(`Error fetching user ${uid}:`, error);
              }
            }
          }

          setOnlineUsers(prevUsers => {
            // Create a map of existing users by ID
            const userMap = new Map(prevUsers.map(u => [u.id, u]));
            
            // Update with new data from database
            users.forEach(user => {
              userMap.set(user.id, user);
            });
            
            // Get IDs of users who are online according to RTDB
            const onlineUserIds = new Set(
              Object.keys(presenceData).filter(uid => (presenceData[uid] as any).online)
            );
            
            // Filter users: keep those in RTDB OR current user (to handle race condition)
            const now = Date.now();
            return Array.from(userMap.values()).filter(u => 
              onlineUserIds.has(u.id) || 
              u.id === userId || 
              (now - (u.lastSeen || 0) < 2000)
            );
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
  }, [userId]);

  return { onlineUsers };
};

