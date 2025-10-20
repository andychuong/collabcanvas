export async function runDataValidationTests(services) {
  const suite = { name: 'Data Validation & Structure', tests: [] };
  
  // Test 1: Service status values
  try {
    const validStatuses = ['healthy', 'error', 'checking'];
    const allValid = services.every(s => validStatuses.includes(s.status));
    
    suite.tests.push({
      name: 'Service status values should be valid',
      passed: allValid,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Service status values should be valid',
      passed: false,
      error: error.message
    });
  }
  
  // Test 2: Service details structure
  try {
    const allHaveDetails = services.every(s => 
      Array.isArray(s.details) && s.details.length > 0
    );
    const detailsHaveStructure = services.every(s =>
      s.details.every(d => d.label && d.value)
    );
    
    suite.tests.push({
      name: 'Service details should have proper structure',
      passed: allHaveDetails && detailsHaveStructure,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Service details should have proper structure',
      passed: false,
      error: error.message
    });
  }
  
  // Test 3: Performance metrics
  try {
    const servicesWithResponseTime = services.filter(s =>
      s.details.some(d => d.label === 'Response Time')
    );
    const hasMetrics = servicesWithResponseTime.length > 0;
    
    suite.tests.push({
      name: 'Services should include performance metrics',
      passed: hasMetrics,
      duration: 0
    });
  } catch (error) {
    suite.tests.push({
      name: 'Services should include performance metrics',
      passed: false,
      error: error.message
    });
  }
  
  return suite;
}



