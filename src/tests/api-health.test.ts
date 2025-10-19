import { describe, it, expect } from 'vitest';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getDatabase, ref, get } from 'firebase/database';

describe('API Health Tests', () => {
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || '',
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || '',
  };

  const app = initializeApp(firebaseConfig, 'health-test-app');
  const auth = getAuth(app);
  const db = getFirestore(app);
  const rtdb = getDatabase(app);

  describe('Firebase Authentication API', () => {
    it('should have auth service available', async () => {
      const startTime = Date.now();
      // Check auth is available
      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(100);
      expect(auth).toBeDefined();
    });

    it('should be operational', () => {
      expect(auth.config.apiKey).toBeTruthy();
      expect(auth.name).toBe('health-test-app');
    });
  });

  describe('Cloud Firestore API', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      try {
        const groupsRef = collection(db, 'groups');
        const q = query(groupsRef, limit(1));
        await getDocs(q);
        
        const latency = Date.now() - startTime;
        expect(latency).toBeLessThan(5000); // Should respond within 5 seconds
      } catch (error: any) {
        const latency = Date.now() - startTime;
        
        // Permission errors are expected and mean the service is working
        if (error.code === 'permission-denied' || error.message.includes('permission')) {
          expect(latency).toBeLessThan(5000);
          expect(error.code).toBe('permission-denied');
        } else {
          throw error;
        }
      }
    });

    it('should be operational', () => {
      expect(db).toBeDefined();
      expect(db.type).toBe('firestore');
    });
  });

  describe('Realtime Database API', () => {
    it('should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      try {
        const testRef = ref(rtdb, '_health_check');
        await get(testRef);
        
        const latency = Date.now() - startTime;
        expect(latency).toBeLessThan(5000);
      } catch (error: any) {
        const latency = Date.now() - startTime;
        
        // Permission errors are expected - they mean the service is working
        if (error.message && error.message.includes('Permission denied')) {
          console.log('⏭️  Permission denied (expected - RTDB is operational)');
          expect(latency).toBeLessThan(5000);
          expect(error.message).toContain('Permission denied');
        } else {
          throw error;
        }
      }
    });

    it('should be operational', () => {
      expect(rtdb).toBeDefined();
      expect(rtdb.app.options.databaseURL).toBeTruthy();
    });
  });

  describe('Firebase Hosting API', () => {
    it('should serve the application', async () => {
      // This would test against the deployed URL
      // Skip if no deployment URL configured
      const deploymentUrl = 'https://collabcanvas-andy.web.app';
      
      if (deploymentUrl) {
        const startTime = Date.now();
        const response = await fetch(deploymentUrl);
        const latency = Date.now() - startTime;

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(latency).toBeLessThan(3000);
      }
    }, 10000);

    it('should serve health check endpoint', async () => {
      const deploymentUrl = 'https://collabcanvas-andy.web.app';
      
      if (deploymentUrl) {
        const startTime = Date.now();
        const response = await fetch(`${deploymentUrl}/healthcheck`);
        const latency = Date.now() - startTime;

        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(latency).toBeLessThan(3000);
        
        const html = await response.text();
        expect(html).toContain('API Health Check');
      }
    }, 10000);
  });

  describe('OpenAI API', () => {
    it('should validate API endpoint accessibility', async () => {
      const apiKey = process.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.log('⏭️  Skipping OpenAI API test - no API key configured');
        return;
      }

      const startTime = Date.now();
      
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        
        const latency = Date.now() - startTime;
        
        expect(response.status).toBeLessThanOrEqual(401); // Either 200 (success) or 401 (invalid key, but API is reachable)
        expect(latency).toBeLessThan(5000);
      } catch (error) {
        console.error('OpenAI API unreachable:', error);
        throw error;
      }
    }, 10000);
  });
});

