import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GroupInfo } from '../types';

export const useGroupAuth = (userId: string | null) => {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!userId) {
        setGroupId(null);
        setGroupInfo(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);

        // Fetch user document to get groupId
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          throw new Error('User data not found. Please sign out and register again.');
        }

        const userData = userDoc.data();
        const userGroupId = userData.groupId;

        if (!userGroupId) {
          throw new Error('User is not assigned to a group. Please sign out and register again with a group name.');
        }

        setGroupId(userGroupId);

        // Fetch group information
        const groupDoc = await getDoc(doc(db, 'groups', userGroupId));
        
        if (groupDoc.exists()) {
          const groupData = groupDoc.data() as GroupInfo;
          setGroupInfo(groupData);
        } else {
          // Group document doesn't exist, create it now
          // Use the stored groupName from user document if available, otherwise use groupId
          const displayName = userData.groupName || userGroupId;
          const newGroupInfo: GroupInfo = {
            id: userGroupId,
            name: displayName,
            createdAt: Date.now(),
            memberCount: 1,
          };
          
          await setDoc(doc(db, 'groups', userGroupId), newGroupInfo);
          setGroupInfo(newGroupInfo);
        }

        setLoading(false);
        setError(null); // Clear any previous errors
      } catch (err: any) {
        // If permission denied and we haven't retried yet, retry after a delay
        if (err.code === 'permission-denied' && retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
        } else {
          setError(err.message || 'Failed to load group data');
          setLoading(false);
        }
      }
    };

    fetchGroupData();
  }, [userId, retryCount]);

  return {
    groupId,
    groupInfo,
    loading,
    error,
  };
};

