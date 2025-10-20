export async function runUtilityTests() {
  const suite = { name: 'Browser & DOM Tests', tests: [] };
  
  // Test 1: localStorage availability
  try {
    const testKey = '_healthcheck_test';
    localStorage.setItem(testKey, 'test');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    suite.tests.push({
      name: 'localStorage should be available and functional',
      passed: value === 'test',
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'localStorage should be available and functional',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Fetch API
  let fetchStart = Date.now();
  try {
    const response = await fetch('/healthcheck', { method: 'HEAD' });
    const duration = Date.now() - fetchStart;
    
    suite.tests.push({
      name: 'Fetch API should work (self-check)',
      passed: response.ok,
      duration
    });
  } catch (error) {
    suite.tests.push({
      name: 'Fetch API should work (self-check)',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Date/Time utilities
  try {
    const now = Date.now();
    const date = new Date();
    const isValidTimestamp = now > 1600000000000 && now < 2000000000000;
    const isValidDate = date instanceof Date && !isNaN(date.getTime());
    
    suite.tests.push({
      name: 'Date and time utilities should work correctly',
      passed: isValidTimestamp && isValidDate,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Date and time utilities should work correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 4: DOM manipulation
  try {
    const servicesDiv = document.getElementById('services');
    const testDiv = document.createElement('div');
    testDiv.id = '_test_element';
    document.body.appendChild(testDiv);
    const retrieved = document.getElementById('_test_element');
    document.body.removeChild(testDiv);
    
    suite.tests.push({
      name: 'DOM manipulation should work correctly',
      passed: servicesDiv !== null && retrieved !== null,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'DOM manipulation should work correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 5: JSON parsing
  try {
    const testObj = { test: 'value', number: 123, nested: { key: 'val' } };
    const jsonString = JSON.stringify(testObj);
    const parsed = JSON.parse(jsonString);
    const isEqual = parsed.test === testObj.test && 
                   parsed.number === testObj.number &&
                   parsed.nested.key === testObj.nested.key;
    
    suite.tests.push({
      name: 'JSON stringify/parse should work correctly',
      passed: isEqual,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'JSON stringify/parse should work correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 6: Array operations
  try {
    const arr = [1, 2, 3, 4, 5];
    const filtered = arr.filter(n => n > 2);
    const mapped = arr.map(n => n * 2);
    const reduced = arr.reduce((sum, n) => sum + n, 0);
    
    const result = 
      filtered.length === 3 &&
      mapped[0] === 2 &&
      reduced === 15;
    
    suite.tests.push({
      name: 'Array methods should work correctly',
      passed: result,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Array methods should work correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 7: String operations
  try {
    const str = 'CollabCanvas Health Check';
    const hasIncludes = str.includes('Health');
    const hasStartsWith = str.startsWith('Collab');
    const hasEndsWith = str.endsWith('Check');
    const splitWorks = str.split(' ').length === 3;
    
    suite.tests.push({
      name: 'String methods should work correctly',
      passed: hasIncludes && hasStartsWith && hasEndsWith && splitWorks,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'String methods should work correctly',
      passed: false,
      error: error.message
    });
  }
  
  // Test 8: Promise handling
  let promiseStart = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 10));
    const duration = Date.now() - promiseStart;
    
    suite.tests.push({
      name: 'Promise and async/await should work',
      passed: duration >= 10 && duration < 100,
      duration
    });
  } catch (error) {
    suite.tests.push({
      name: 'Promise and async/await should work',
      passed: false,
      error: error.message
    });
  }
  
  // Test 9: Console availability
  try {
    const hasConsole = typeof console !== 'undefined' &&
                      typeof console.log === 'function' &&
                      typeof console.error === 'function';
    
    suite.tests.push({
      name: 'Console API should be available',
      passed: hasConsole,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Console API should be available',
      passed: false,
      error: error.message
    });
  }
  
  // Test 10: Error handling
  try {
    let errorCaught = false;
    try {
      throw new Error('Test error');
    } catch (e) {
      errorCaught = e.message === 'Test error';
    }
    
    suite.tests.push({
      name: 'Error handling should work correctly',
      passed: errorCaught,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Error handling should work correctly',
      passed: false,
      error: error.message
    });
  }
  
  return suite;
}



