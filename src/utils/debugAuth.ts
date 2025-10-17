/**
 * Debug utility to check user authentication and group setup
 */

import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export async function debugUserAuth() {
  console.log('\n🔍 ===== DEBUG USER AUTH =====');
  
  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('❌ No user is currently authenticated');
    console.log('   → Please sign in first');
    console.log('================================\n');
    return;
  }
  
  console.log('✅ User authenticated');
  console.log('   User ID:', currentUser.uid);
  console.log('   Email:', currentUser.email);
  console.log('   Display Name:', currentUser.displayName);
  
  // Check if user document exists
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User document does NOT exist in Firestore');
      console.log('   Path checked: /users/' + currentUser.uid);
      console.log('   → This user needs to register again');
      console.log('================================\n');
      return;
    }
    
    console.log('✅ User document exists');
    
    // Check user data
    const userData = userDoc.data();
    console.log('   User data:', JSON.stringify(userData, null, 2));
    
    // Check for groupId
    if (!userData.groupId) {
      console.log('❌ User document is MISSING groupId field');
      console.log('   → This user needs to sign out and register again with a group name');
      console.log('================================\n');
      return;
    }
    
    console.log('✅ User has groupId:', userData.groupId);
    
    // Check if group exists
    const groupDocRef = doc(db, 'groups', userData.groupId);
    const groupDoc = await getDoc(groupDocRef);
    
    if (!groupDoc.exists()) {
      console.log('⚠️  Group document does not exist (this is OK)');
      console.log('   Path checked: /groups/' + userData.groupId);
      console.log('   → A group document will be created when needed');
    } else {
      console.log('✅ Group document exists');
      const groupData = groupDoc.data();
      console.log('   Group data:', JSON.stringify(groupData, null, 2));
    }
    
    // Try to read shapes collection
    console.log('\n🔍 Testing shapes collection access...');
    const shapesPath = `groups/${userData.groupId}/canvases/main-canvas/shapes`;
    console.log('   Path:', shapesPath);
    
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const shapesRef = collection(db, 'groups', userData.groupId, 'canvases', 'main-canvas', 'shapes');
      const shapesSnapshot = await getDocs(shapesRef);
      console.log('✅ Successfully accessed shapes collection');
      console.log('   Found', shapesSnapshot.size, 'shapes');
    } catch (error: any) {
      console.log('❌ FAILED to access shapes collection');
      console.log('   Error:', error.code, '-', error.message);
      
      if (error.code === 'permission-denied') {
        console.log('\n⚠️  PERMISSION DENIED DIAGNOSIS:');
        console.log('   This means the Firestore security rules rejected the request.');
        console.log('   Possible causes:');
        console.log('   1. Security rules not deployed correctly');
        console.log('   2. User document groupId doesn\'t match the group being accessed');
        console.log('   3. Rules are checking something that failed');
        console.log('\n   SOLUTION:');
        console.log('   → Sign out and register again with a group name');
      }
    }
    
  } catch (error: any) {
    console.log('❌ Error during debug:', error.message);
  }
  
  console.log('================================\n');
}

// Run debug on page load in development
if (import.meta.env.DEV) {
  // Make it available globally for easy access in console
  (window as any).debugUserAuth = debugUserAuth;
  console.log('💡 Debug utility loaded! Run debugUserAuth() in console to diagnose auth issues');
}

