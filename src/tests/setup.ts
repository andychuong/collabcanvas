import { beforeAll, afterAll } from 'vitest';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Setup runs before all tests
beforeAll(() => {
  console.log('🧪 Starting test suite...');
  
  // Verify required environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_DATABASE_URL',
  ];

  const missing = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missing.join(', ')}`
    );
    console.warn('Some tests may be skipped or fail.');
  }
});

// Cleanup runs after all tests
afterAll(() => {
  console.log('✅ Test suite completed');
});

