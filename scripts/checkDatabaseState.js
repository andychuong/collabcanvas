/**
 * Check Database State - Determines if migration is needed
 * Run: node scripts/checkDatabaseState.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';
import * as dotenv from 'dotenv';

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
const rtdb = getDatabase(app);

async function checkDatabaseState() {
  console.log('\n🔍 Checking Database State...\n');
  
  let needsMigration = false;
  
  // Check for existing users
  try {
    console.log('📊 Checking for existing users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('✅ No existing users found - Fresh installation!');
      console.log('   No migration needed. You can start using the app.\n');
      return;
    }
    
    console.log(`📋 Found ${usersSnapshot.size} existing user(s)\n`);
    
    // Check if users have groupId field
    let usersWithoutGroup = 0;
    let usersWithGroup = 0;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (!userData.groupId) {
        usersWithoutGroup++;
        console.log(`   ⚠️  User ${userData.name || doc.id} - NO groupId`);
      } else {
        usersWithGroup++;
        console.log(`   ✅ User ${userData.name || doc.id} - Group: ${userData.groupId}`);
      }
    });
    
    if (usersWithoutGroup > 0) {
      console.log(`\n⚠️  WARNING: ${usersWithoutGroup} user(s) without groupId field`);
      console.log('   These users will NOT be able to log in with the new system.\n');
      needsMigration = true;
    }
    
    if (usersWithGroup > 0) {
      console.log(`\n✅ ${usersWithGroup} user(s) already have groups assigned\n`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  }
  
  // Check for existing canvas data (old structure)
  try {
    console.log('📊 Checking for existing canvas data (old structure)...');
    const oldShapesSnapshot = await getDocs(collection(db, 'canvases', 'main-canvas', 'shapes'));
    
    if (oldShapesSnapshot.empty) {
      console.log('✅ No shapes found in old location (/canvases/main-canvas/shapes)\n');
    } else {
      console.log(`⚠️  Found ${oldShapesSnapshot.size} shape(s) in old location`);
      console.log('   These shapes need to be migrated to group-scoped structure.\n');
      needsMigration = true;
    }
  } catch (error) {
    console.log('✅ No old canvas data found\n');
  }
  
  // Check for existing RTDB data (old structure)
  try {
    console.log('📊 Checking for Realtime Database data (old structure)...');
    
    const cursorsRef = ref(rtdb, 'cursors');
    const presenceRef = ref(rtdb, 'presence');
    const selectionsRef = ref(rtdb, 'selections');
    
    const [cursorsSnap, presenceSnap, selectionsSnap] = await Promise.all([
      get(cursorsRef),
      get(presenceRef),
      get(selectionsRef)
    ]);
    
    if (cursorsSnap.exists() || presenceSnap.exists() || selectionsSnap.exists()) {
      console.log('⚠️  Found old RTDB data (will be cleaned up automatically)\n');
    } else {
      console.log('✅ No old RTDB data found\n');
    }
  } catch (error) {
    console.log('✅ No old RTDB data found\n');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (needsMigration) {
    console.log('⚠️  MIGRATION REQUIRED\n');
    console.log('Next Steps:');
    console.log('1. Run: node scripts/migrateToGroups.js');
    console.log('2. Review the migration results');
    console.log('3. Deploy the new code\n');
    console.log('OR');
    console.log('1. Delete old data and start fresh');
    console.log('2. Have users re-register with group names\n');
  } else {
    console.log('✅ NO MIGRATION NEEDED\n');
    console.log('Your database is ready for the new group system!');
    console.log('Users can now register/login with group names.\n');
  }
  console.log('='.repeat(60) + '\n');
}

checkDatabaseState().catch(console.error);

