import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GroupInfo } from '../types';

export const useGroupAuth = (userId: string | null) => {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!userId) {
        setGroupId(null);
        setGroupInfo(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user document to get groupId
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          throw new Error('User data not found');
        }

        const userData = userDoc.data();
        const userGroupId = userData.groupId;

        if (!userGroupId) {
          throw new Error('User is not assigned to a group');
        }

        setGroupId(userGroupId);

        // Fetch group information
        const groupDoc = await getDoc(doc(db, 'groups', userGroupId));
        
        if (groupDoc.exists()) {
          setGroupInfo(groupDoc.data() as GroupInfo);
        } else {
          // Group document doesn't exist yet, create a basic one
          setGroupInfo({
            id: userGroupId,
            name: userGroupId,
            createdAt: Date.now(),
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching group data:', err);
        setError(err.message || 'Failed to load group data');
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [userId]);

  return {
    groupId,
    groupInfo,
    loading,
    error,
  };
};

