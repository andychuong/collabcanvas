/**
 * Migration Script - Migrate Existing Data to Group Structure
 * Run: node scripts/migrateToGroups.js
 * 
 * This script will:
 * 1. Add groupId field to existing users (assigns them to "default" group)
 * 2. Move canvas shapes from old location to group-scoped location
 * 3. Create the "default" group document
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
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

const DEFAULT_GROUP_ID = 'default';
const DEFAULT_GROUP_NAME = 'Default Group';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function migrateToGroups() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 MIGRATION SCRIPT - Groups Integration');
  console.log('='.repeat(60) + '\n');
  
  console.log('This script will:');
  console.log('1. Assign all existing users to "default" group');
  console.log('2. Move canvas data to /groups/default/canvases/main-canvas/');
  console.log('3. Create the "default" group document\n');
  
  console.log('⚠️  WARNING: This will modify your database!');
  console.log('   Make sure you have a backup before proceeding.\n');
  
  const confirm = await question('Do you want to continue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Migration cancelled.\n');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Starting migration...\n');
  
  let stats = {
    usersMigrated: 0,
    shapesMigrated: 0,
    errors: []
  };
  
  try {
    // Step 1: Migrate users
    console.log('📋 Step 1: Migrating users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('   ℹ️  No users found to migrate.\n');
    } else {
      for (const userDoc of usersSnapshot.docs) {
        try {
          const userData = userDoc.data();
          
          // Check if user already has a groupId
          if (userData.groupId) {
            console.log(`   ⏭️  Skipping ${userData.name || userDoc.id} - already has group: ${userData.groupId}`);
            continue;
          }
          
          // Add groupId field
          await updateDoc(userDoc.ref, {
            groupId: DEFAULT_GROUP_ID
          });
          
          console.log(`   ✅ Migrated user: ${userData.name || userDoc.id} → ${DEFAULT_GROUP_ID}`);
          stats.usersMigrated++;
        } catch (error) {
          const errorMsg = `Failed to migrate user ${userDoc.id}: ${error.message}`;
          console.error(`   ❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      }
      console.log(`\n   ✅ Migrated ${stats.usersMigrated} user(s)\n`);
      
      // Create default group document
      console.log('📋 Step 2: Creating default group...');
      try {
        await setDoc(doc(db, 'groups', DEFAULT_GROUP_ID), {
          id: DEFAULT_GROUP_ID,
          name: DEFAULT_GROUP_NAME,
          createdAt: Date.now(),
          memberCount: stats.usersMigrated
        });
        console.log('   ✅ Created "default" group\n');
      } catch (error) {
        const errorMsg = `Failed to create group: ${error.message}`;
        console.error(`   ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
    
    // Step 3: Migrate canvas shapes
    console.log('📋 Step 3: Migrating canvas shapes...');
    try {
      const oldShapesSnapshot = await getDocs(collection(db, 'canvases', 'main-canvas', 'shapes'));
      
      if (oldShapesSnapshot.empty) {
        console.log('   ℹ️  No shapes found to migrate.\n');
      } else {
        for (const shapeDoc of oldShapesSnapshot.docs) {
          try {
            const shapeData = shapeDoc.data();
            
            // Copy shape to new location
            const newShapeRef = doc(db, 'groups', DEFAULT_GROUP_ID, 'canvases', 'main-canvas', 'shapes', shapeDoc.id);
            await setDoc(newShapeRef, shapeData);
            
            console.log(`   ✅ Migrated shape: ${shapeDoc.id}`);
            stats.shapesMigrated++;
          } catch (error) {
            const errorMsg = `Failed to migrate shape ${shapeDoc.id}: ${error.message}`;
            console.error(`   ❌ ${errorMsg}`);
            stats.errors.push(errorMsg);
          }
        }
        console.log(`\n   ✅ Migrated ${stats.shapesMigrated} shape(s)\n`);
        
        console.log('   ℹ️  Note: Old shapes are still at /canvases/main-canvas/shapes/');
        console.log('   You can delete them manually after verifying the migration.\n');
      }
    } catch (error) {
      console.log('   ℹ️  No old canvas data found.\n');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE\n');
    console.log(`Summary:`);
    console.log(`  - Users migrated: ${stats.usersMigrated}`);
    console.log(`  - Shapes migrated: ${stats.shapesMigrated}`);
    console.log(`  - Errors: ${stats.errors.length}\n`);
    
    if (stats.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
      console.log('');
    }
    
    console.log('Next Steps:');
    console.log('1. Verify the migration in Firebase Console');
    console.log('2. Test login with existing users (they should use "default" as group name)');
    console.log('3. Deploy the updated application');
    console.log('4. (Optional) Delete old data at /canvases/main-canvas/ after verification\n');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
  }
  
  rl.close();
}

migrateToGroups().catch(console.error);

