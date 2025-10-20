import { auth, db, realtimeDb } from '../healthcheck-config.js';

export async function runIntegrationTests(services) {
  const suite = { name: 'Cross-Service Integration', tests: [] };
  
  // Test 1: Firebase modules integration
  try {
    const authApp = auth?.app;
    const firestoreApp = db?.app;
    const rtdbApp = realtimeDb?.app;
    const sameInstance = authApp === firestoreApp && firestoreApp === rtdbApp;
    
    suite.tests.push({
      name: 'All Firebase services should share same app instance',
      passed: sameInstance,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'All Firebase services should share same app instance',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Configuration consistency
  try {
    const authConfig = auth?.config;
    const appOptions = auth?.app?.options;
    const hasRequiredConfig = 
      authConfig?.apiKey && 
      authConfig?.authDomain && 
      appOptions?.projectId;
    
    suite.tests.push({
      name: 'Firebase configuration should be complete',
      passed: Boolean(hasRequiredConfig),
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Firebase configuration should be complete',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Health check integration
  try {
    const allServicesChecked = services.length === 5;
    const hasExpectedServices = 
      services.some(s => s.name.includes('Authentication')) &&
      services.some(s => s.name.includes('Firestore')) &&
      services.some(s => s.name.includes('Realtime Database')) &&
      services.some(s => s.name.includes('Hosting')) &&
      services.some(s => s.name.includes('OpenAI'));
    
    suite.tests.push({
      name: 'All expected services should be monitored',
      passed: allServicesChecked && hasExpectedServices,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'All expected services should be monitored',
      passed: false,
      error: error.message
    });
  }
  
  return suite;
}



