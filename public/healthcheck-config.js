// Import Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Firebase configuration - this file should be built using the build-healthcheck script
// For development, these placeholders will cause errors. Run: npm run build:healthcheck
const firebaseConfig = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "VITE_FIREBASE_PROJECT_ID",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "VITE_FIREBASE_APP_ID",
  databaseURL: "VITE_FIREBASE_DATABASE_URL"
};

// Initialize Firebase only if config is valid
let app, auth, db, realtimeDb;

try {
  // Check if we have valid config (not placeholder strings)
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('VITE_')) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Only initialize Realtime Database if URL is provided
    if (firebaseConfig.databaseURL && firebaseConfig.databaseURL !== 'VITE_FIREBASE_DATABASE_URL') {
      realtimeDb = getDatabase(app);
    }
  } else {
    console.warn('⚠️ Healthcheck: Firebase config contains placeholders. Run "npm run build:healthcheck" to build with actual credentials.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase for healthcheck:', error);
}

export { auth, db, realtimeDb };

