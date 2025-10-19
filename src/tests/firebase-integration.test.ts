import { describe, it, expect, beforeAll } from 'vitest';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';
import { getDatabase, ref, get, Database } from 'firebase/database';

describe('Firebase Integration Tests', () => {
  let app: FirebaseApp;
  let auth: Auth;
  let db: Firestore;
  let rtdb: Database;

  beforeAll(() => {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID || '',
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || '',
    };

    app = initializeApp(firebaseConfig, 'test-app');
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
  });

  describe('Firebase Authentication', () => {
    it('should initialize Firebase Auth', () => {
      expect(auth).toBeDefined();
      expect(auth.app).toBeDefined();
    });

    it('should support anonymous authentication', async () => {
      try {
        const userCredential = await signInAnonymously(auth);
        expect(userCredential.user).toBeDefined();
        expect(userCredential.user.isAnonymous).toBe(true);
        
        // Cleanup
        await auth.signOut();
      } catch (error: any) {
        // Anonymous auth might be disabled in production
        if (error.code === 'auth/admin-restricted-operation') {
          console.log('⏭️  Anonymous auth disabled (expected in production)');
          expect(error.code).toBe('auth/admin-restricted-operation');
        } else {
          throw error;
        }
      }
    }, 10000);

    it('should maintain auth configuration', () => {
      expect(auth.config.apiKey).toBeTruthy();
      expect(auth.config.authDomain).toBeTruthy();
    });
  });

  describe('Cloud Firestore', () => {
    it('should initialize Firestore', () => {
      expect(db).toBeDefined();
      expect(db.app).toBeDefined();
    });

    it('should connect to Firestore', async () => {
      // Try to access a collection (may fail due to security rules, which is expected)
      try {
        const testCollection = collection(db, '_test_connection');
        await getDocs(testCollection);
        // If we get here, connection works
        expect(true).toBe(true);
      } catch (error: any) {
        // Permission denied means Firestore is working, just protected
        if (error.code === 'permission-denied' || error.message.includes('permission')) {
          expect(error.code).toBe('permission-denied');
        } else {
          // Other errors indicate connection problems
          throw error;
        }
      }
    });

    it('should have correct project configuration', () => {
      expect(db.app.options.projectId).toBeTruthy();
      expect(db.type).toBe('firestore');
    });
  });

  describe('Realtime Database', () => {
    it('should initialize Realtime Database', () => {
      expect(rtdb).toBeDefined();
      expect(rtdb.app).toBeDefined();
    });

    it('should connect to Realtime Database', async () => {
      // Try to read from a test path
      try {
        const testRef = ref(rtdb, '_test_connection');
        await get(testRef);
        // If we get here, connection works
        expect(true).toBe(true);
      } catch (error: any) {
        // Permission denied means RTDB is working, just protected
        if (error.message && error.message.includes('Permission denied')) {
          console.log('⏭️  Permission denied (expected - RTDB is working)');
          expect(error.message).toContain('Permission denied');
        } else {
          // Other errors indicate connection problems
          throw error;
        }
      }
    });

    it('should have correct database URL', () => {
      expect(rtdb.app.options.databaseURL).toBeTruthy();
      expect(rtdb.app.options.databaseURL).toContain('firebaseio.com');
    });
  });
});

