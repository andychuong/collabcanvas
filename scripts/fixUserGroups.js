/**
 * Fix User Groups - Assigns a default group to users without groupId
 * Run: node scripts/fixUserGroups.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to get user input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function fixUserGroups() {
  console.log('\n🔧 Checking for users without groupId...\n');
  
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('✅ No users found in database.\n');
      return;
    }
    
    const usersWithoutGroup = [];
    const usersWithGroup = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (!userData.groupId) {
        usersWithoutGroup.push({ id: doc.id, ...userData });
      } else {
        usersWithGroup.push({ id: doc.id, ...userData });
      }
    });
    
    console.log(`📊 Found ${usersSnapshot.size} total user(s)`);
    console.log(`   ✅ ${usersWithGroup.length} user(s) with groupId`);
    console.log(`   ⚠️  ${usersWithoutGroup.length} user(s) WITHOUT groupId\n`);
    
    if (usersWithoutGroup.length === 0) {
      console.log('✅ All users have groupId assigned. Nothing to fix!\n');
      return;
    }
    
    console.log('Users without groupId:');
    usersWithoutGroup.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.email || user.id}`);
    });
    
    console.log('\n❓ What would you like to do?');
    console.log('   1. Assign all users to a default group (e.g., "default-group")');
    console.log('   2. Assign a custom group to all users');
    console.log('   3. Delete users without groupId');
    console.log('   4. Exit without changes\n');
    
    const choice = await askQuestion('Enter your choice (1-4): ');
    
    if (choice === '1') {
      // Assign default group
      const defaultGroupId = 'default-group';
      console.log(`\n📝 Assigning all users to group: ${defaultGroupId}...`);
      
      for (const user of usersWithoutGroup) {
        await updateDoc(doc(db, 'users', user.id), {
          groupId: defaultGroupId
        });
        console.log(`   ✅ Updated user: ${user.name || user.email || user.id}`);
      }
      
      console.log(`\n✅ Successfully assigned ${usersWithoutGroup.length} user(s) to ${defaultGroupId}\n`);
      
    } else if (choice === '2') {
      // Assign custom group
      const groupId = await askQuestion('\nEnter the group name to assign: ');
      const normalizedGroupId = groupId
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      if (!normalizedGroupId) {
        console.log('❌ Invalid group name. Exiting.\n');
        return;
      }
      
      console.log(`\n📝 Assigning all users to group: ${normalizedGroupId}...`);
      
      for (const user of usersWithoutGroup) {
        await updateDoc(doc(db, 'users', user.id), {
          groupId: normalizedGroupId
        });
        console.log(`   ✅ Updated user: ${user.name || user.email || user.id}`);
      }
      
      console.log(`\n✅ Successfully assigned ${usersWithoutGroup.length} user(s) to ${normalizedGroupId}\n`);
      
    } else if (choice === '3') {
      // Delete users
      const confirm = await askQuestion(`\n⚠️  Are you sure you want to DELETE ${usersWithoutGroup.length} user(s)? (yes/no): `);
      
      if (confirm.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting users...');
        const { deleteDoc } = await import('firebase/firestore');
        
        for (const user of usersWithoutGroup) {
          await deleteDoc(doc(db, 'users', user.id));
          console.log(`   ✅ Deleted user: ${user.name || user.email || user.id}`);
        }
        
        console.log(`\n✅ Successfully deleted ${usersWithoutGroup.length} user(s)\n`);
      } else {
        console.log('\n❌ Cancelled. No users were deleted.\n');
      }
      
    } else {
      console.log('\n❌ Exiting without changes.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserGroups()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

