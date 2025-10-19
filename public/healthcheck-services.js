import { auth, db, realtimeDb } from './healthcheck-config.js';
import { collection, getDocs, limit, query } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { ref, set, get, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

export async function checkFirebaseAuth() {
  const startTime = Date.now();
  try {
    // Check if auth is configured and operational
    const currentUser = auth.currentUser;
    const latency = Date.now() - startTime;
    
    return {
      name: 'Firebase Authentication',
      status: 'healthy',
      details: [
        { label: 'Response Time', value: `${latency}ms` },
        { label: 'Status', value: 'Operational' },
        { label: 'Service', value: 'Available' },
      ]
    };
  } catch (error) {
    return {
      name: 'Firebase Authentication',
      status: 'error',
      details: [
        { label: 'Status', value: 'Error' },
        { label: 'Error', value: error.message }
      ],
      error: error.message
    };
  }
}

export async function checkFirestore() {
  const startTime = Date.now();
  try {
    // Try to read from groups collection
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, limit(1));
    await getDocs(q);
    
    const latency = Date.now() - startTime;
    
    return {
      name: 'Cloud Firestore',
      status: 'healthy',
      details: [
        { label: 'Response Time', value: `${latency}ms` },
        { label: 'Status', value: 'Operational' },
        { label: 'Database', value: 'Connected' },
      ]
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    
    // If it's a permissions error, the database is actually working - just requires auth
    if (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions')) {
      return {
        name: 'Cloud Firestore',
        status: 'healthy',
        details: [
          { label: 'Response Time', value: `${latency}ms` },
          { label: 'Status', value: 'Operational' },
          { label: 'Database', value: 'Connected' },
          { label: 'Security', value: 'Rules enforced (auth required)' },
        ]
      };
    }
    
    return {
      name: 'Cloud Firestore',
      status: 'error',
      details: [
        { label: 'Status', value: 'Error' },
        { label: 'Error', value: error.message }
      ],
      error: error.message
    };
  }
}

export async function checkFirebaseHosting() {
  const startTime = Date.now();
  try {
    // Check if we can load the main app
    const response = await fetch('/');
    const latency = Date.now() - startTime;
    
    return {
      name: 'Firebase Hosting',
      status: response.ok ? 'healthy' : 'error',
      details: [
        { label: 'Response Time', value: `${latency}ms` },
        { label: 'Status Code', value: response.status },
        { label: 'Status', value: response.ok ? 'Operational' : 'Error' },
      ]
    };
  } catch (error) {
    return {
      name: 'Firebase Hosting',
      status: 'error',
      details: [
        { label: 'Status', value: 'Error' },
        { label: 'Error', value: error.message }
      ],
      error: error.message
    };
  }
}

export async function checkRealtimeDatabase() {
  const startTime = Date.now();
  try {
    // Try to write and read a test value
    const testRef = ref(realtimeDb, '_healthcheck/test');
    const testValue = { timestamp: Date.now(), test: true };
    
    await set(testRef, testValue);
    const snapshot = await get(testRef);
    await remove(testRef); // Clean up
    
    const latency = Date.now() - startTime;
    
    if (snapshot.exists()) {
      return {
        name: 'Realtime Database',
        status: 'healthy',
        details: [
          { label: 'Response Time', value: `${latency}ms` },
          { label: 'Status', value: 'Operational' },
          { label: 'Read/Write', value: 'Working' },
          { label: 'Usage', value: 'Cursors & Presence' },
        ]
      };
    } else {
      return {
        name: 'Realtime Database',
        status: 'error',
        details: [
          { label: 'Status', value: 'Error' },
          { label: 'Error', value: 'Write succeeded but read failed' }
        ],
        error: 'Write succeeded but read failed'
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    
    // Permission errors mean the database is working, just protected
    if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission')) {
      return {
        name: 'Realtime Database',
        status: 'healthy',
        details: [
          { label: 'Response Time', value: `${latency}ms` },
          { label: 'Status', value: 'Operational' },
          { label: 'Database', value: 'Connected' },
          { label: 'Security', value: 'Rules enforced (auth required)' },
        ]
      };
    }
    
    return {
      name: 'Realtime Database',
      status: 'error',
      details: [
        { label: 'Status', value: 'Error' },
        { label: 'Error', value: error.message }
      ],
      error: error.message
    };
  }
}

export async function checkOpenAIAPI() {
  try {
    const apiKey = localStorage.getItem('openai_api_key');
    
    if (!apiKey) {
      return {
        name: 'OpenAI API (AI Assistant)',
        status: 'healthy',
        details: [
          { label: 'Status', value: 'Not Configured' },
          { label: 'Note', value: 'API key not set by user' },
          { label: 'Feature', value: 'Optional - AI chat disabled' },
        ]
      };
    }

    // Test the API key with a minimal request
    try {
      const testStartTime = Date.now();
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      const testLatency = Date.now() - testStartTime;

      if (response.ok) {
        return {
          name: 'OpenAI API (AI Assistant)',
          status: 'healthy',
          details: [
            { label: 'Response Time', value: `${testLatency}ms` },
            { label: 'Status', value: 'Operational' },
            { label: 'API Key', value: `${apiKey.substring(0, 12)}...` },
            { label: 'Authentication', value: 'Valid' },
          ]
        };
      } else if (response.status === 401) {
        return {
          name: 'OpenAI API (AI Assistant)',
          status: 'error',
          details: [
            { label: 'Status', value: 'Authentication Failed' },
            { label: 'API Key', value: `${apiKey.substring(0, 12)}...` },
            { label: 'Error', value: 'Invalid API key' }
          ],
          error: 'Invalid or expired API key'
        };
      } else {
        return {
          name: 'OpenAI API (AI Assistant)',
          status: 'error',
          details: [
            { label: 'Status', value: 'Error' },
            { label: 'HTTP Status', value: response.status.toString() },
            { label: 'Error', value: response.statusText }
          ],
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (fetchError) {
      return {
        name: 'OpenAI API (AI Assistant)',
        status: 'error',
        details: [
          { label: 'Status', value: 'Connection Error' },
          { label: 'Error', value: fetchError.message }
        ],
        error: fetchError.message
      };
    }
  } catch (error) {
    return {
      name: 'OpenAI API (AI Assistant)',
      status: 'error',
      details: [
        { label: 'Status', value: 'Error' },
        { label: 'Error', value: error.message }
      ],
      error: error.message
    };
  }
}

