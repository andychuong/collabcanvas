// Main healthcheck orchestration file
import { 
  checkFirebaseAuth, 
  checkFirestore, 
  checkFirebaseHosting, 
  checkRealtimeDatabase, 
  checkOpenAIAPI 
} from './healthcheck-services.js';
import { renderServices, updateOverallStatus, displayTestResults } from './healthcheck-ui.js';
import { 
  runShapeOperationTests, 
  runIntegrationTests, 
  runDataValidationTests, 
  runUtilityTests 
} from './healthcheck-tests.js';

let services = [];
let testResults = [];

async function checkHealth() {
  const btn = document.getElementById('refresh-btn');
  const btnText = document.getElementById('btn-text');
  
  btn.disabled = true;
  btnText.textContent = 'Checking...';

  // Initialize services with checking status
  services = [
    { name: 'Firebase Authentication', status: 'checking', details: [] },
    { name: 'Cloud Firestore', status: 'checking', details: [] },
    { name: 'Realtime Database', status: 'checking', details: [] },
    { name: 'Firebase Hosting', status: 'checking', details: [] },
    { name: 'OpenAI API (AI Assistant)', status: 'checking', details: [] },
  ];

  renderServices(services);
  updateOverallStatus(services);

  // Check all services in parallel
  const results = await Promise.all([
    checkFirebaseAuth(),
    checkFirestore(),
    checkRealtimeDatabase(),
    checkFirebaseHosting(),
    checkOpenAIAPI(),
  ]);

  services = results;
  renderServices(services);
  updateOverallStatus(services);

  // Update timestamp
  const now = new Date();
  document.getElementById('timestamp').textContent = 
    `Last checked: ${now.toLocaleString()}`;

  btn.disabled = false;
  btnText.textContent = 'Refresh Status';
}

async function runTests() {
  const btn = document.getElementById('run-tests-btn');
  const btnText = document.getElementById('test-btn-text');
  const resultsDiv = document.getElementById('test-results');
  
  btn.disabled = true;
  btnText.textContent = '⏳ Running Tests...';
  resultsDiv.style.display = 'block';
  resultsDiv.innerHTML = '<div class="spinner"></div> Initializing test suite...';
  
  testResults = [];
  
  try {
    // Run all test suites
    const utilityTests = await runUtilityTests();
    const shapeTests = await runShapeOperationTests();
    const integrationTests = await runIntegrationTests(services);
    const validationTests = await runDataValidationTests(services);
    
    testResults = [utilityTests, shapeTests, integrationTests, validationTests];
    
    // Display results
    displayTestResults(testResults);
  } catch (error) {
    resultsDiv.innerHTML = `<div class="error-details">Test suite failed: ${error.message}</div>`;
  }
  
  btn.disabled = false;
  btnText.textContent = '🧪 Run Integration Tests';
}

// Export functions to window for onclick handlers
window.checkHealth = checkHealth;
window.runTests = runTests;

// Run check on page load
checkHealth();

// Auto-refresh every 30 seconds
setInterval(checkHealth, 30000);
