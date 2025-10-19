// Helper functions for creating test data

/**
 * Create a test shape with specified type and properties
 * @param {string} type - Shape type (rectangle, circle, line, text, arrow)
 * @param {Object} props - Additional properties to override defaults
 * @returns {Object} Shape object with all required properties
 */
export function createShape(type, props = {}) {
  const baseShape = {
    id: `test_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    x: 100,
    y: 100,
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    userId: 'test_user'
  };
  
  // Add type-specific defaults, then override with custom props
  if (type === 'rectangle' || type === 'arrow') {
    return { ...baseShape, width: 100, height: 50, rotation: 0, ...props };
  } else if (type === 'circle') {
    return { ...baseShape, radius: 50, ...props };
  } else if (type === 'line') {
    return { ...baseShape, points: [0, 0, 100, 100], ...props };
  } else if (type === 'text') {
    return { ...baseShape, text: 'Test', fontSize: 16, fontFamily: 'Arial', ...props };
  }
  
  return { ...baseShape, ...props };
}

/**
 * Add a test to a suite with error handling
 * @param {Array} tests - Array of test results
 * @param {string} name - Test name
 * @param {Function} testFn - Test function that returns boolean or throws
 */
export function addTest(tests, name, testFn) {
  try {
    const passed = testFn();
    tests.push({ name, passed, duration: 0 });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
}

/**
 * Add an async test to a suite with error handling
 * @param {Array} tests - Array of test results
 * @param {string} name - Test name
 * @param {Function} testFn - Async test function that returns boolean or throws
 */
export async function addAsyncTest(tests, name, testFn) {
  try {
    const passed = await testFn();
    tests.push({ name, passed, duration: 0 });
  } catch (error) {
    tests.push({ name, passed: false, error: error.message });
  }
}

