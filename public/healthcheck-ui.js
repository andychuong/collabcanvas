export function renderServices(services) {
  const container = document.getElementById('services');
  container.innerHTML = services.map((service, index) => `
    <div class="service">
      <div class="service-header collapsed" data-service-index="${index}">
        <div class="service-name">
          ${service.status === 'checking' ? '<div class="spinner"></div>' : ''}
          ${service.name}
        </div>
        <div class="service-header-right">
          <span class="status-badge ${service.status}">
            ${service.status === 'checking' ? 'Checking...' : service.status}
          </span>
          <svg class="toggle-icon collapsed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
      <div class="service-details collapsed" data-service-details="${index}">
        ${service.details.map(detail => `
          <div class="detail-row">
            <span class="detail-label">${detail.label}:</span>
            <span class="detail-value">${detail.value}</span>
          </div>
        `).join('')}
      </div>
      ${service.error ? `<div class="error-details">${service.error}</div>` : ''}
    </div>
  `).join('');
  
  // Add click handlers for toggle
  document.querySelectorAll('.service-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const index = e.currentTarget.getAttribute('data-service-index');
      const details = document.querySelector(`[data-service-details="${index}"]`);
      const icon = e.currentTarget.querySelector('.toggle-icon');
      
      details.classList.toggle('collapsed');
      icon.classList.toggle('collapsed');
      e.currentTarget.classList.toggle('collapsed');
    });
  });
}

export function updateOverallStatus(services) {
  const overallDiv = document.getElementById('overall-status');
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const errorCount = services.filter(s => s.status === 'error').length;
  const checkingCount = services.filter(s => s.status === 'checking').length;

  if (checkingCount > 0) {
    overallDiv.className = 'overall-status checking';
    overallDiv.innerHTML = '<div class="spinner"></div> Checking system health...';
  } else if (errorCount === 0) {
    overallDiv.className = 'overall-status healthy';
    overallDiv.innerHTML = `✅ All Systems Operational (${healthyCount}/${services.length})`;
  } else if (errorCount < services.length) {
    overallDiv.className = 'overall-status degraded';
    overallDiv.innerHTML = `⚠️ Degraded Performance (${healthyCount}/${services.length} healthy)`;
  } else {
    overallDiv.className = 'overall-status down';
    overallDiv.innerHTML = `❌ System Down (${errorCount}/${services.length} errors)`;
  }
}

export function displayTestResults(testResults) {
  const resultsDiv = document.getElementById('test-results');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  testResults.forEach(suite => {
    suite.tests.forEach(test => {
      totalTests++;
      if (test.passed) passedTests++;
      else failedTests++;
    });
  });
  
  let html = '';
  
  // Summary
  const summaryClass = failedTests === 0 ? 'all-passed' : 'some-failed';
  html += `<div class="test-summary ${summaryClass}">`;
  if (failedTests === 0) {
    html += `✅ All Tests Passed: ${passedTests}/${totalTests}`;
  } else {
    html += `⚠️ Tests: ${passedTests} passed, ${failedTests} failed out of ${totalTests}`;
  }
  html += `</div>`;
  
  // Test suites
  testResults.forEach((suite, suiteIndex) => {
    const suitePassed = suite.tests.filter(t => t.passed).length;
    const suiteTotal = suite.tests.length;
    
    html += `<div class="test-suite">`;
    html += `<div class="test-suite-header" data-suite-index="${suiteIndex}">`;
    html += `<div class="test-suite-header-left">`;
    html += `<svg class="test-suite-toggle" fill="none" stroke="currentColor" viewBox="0 0 24 24">`;
    html += `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>`;
    html += `</svg>`;
    html += `<span>${suite.name}</span>`;
    html += `</div>`;
    html += `<span style="font-size: 14px; color: #718096;">${suitePassed}/${suiteTotal} passed</span>`;
    html += `</div>`;
    
    html += `<div class="test-suite-content" data-suite-content="${suiteIndex}">`;
    suite.tests.forEach(test => {
      const statusClass = test.passed ? 'passed' : 'failed';
      const badge = test.passed ? 'PASS' : 'FAIL';
      
      html += `<div class="test-case ${statusClass}">`;
      html += `<div>`;
      html += `<div>${test.name}</div>`;
      if (test.duration !== undefined) {
        html += `<div style="font-size: 12px; color: #718096; margin-top: 4px;">Duration: ${test.duration}ms</div>`;
      }
      if (test.note) {
        html += `<div style="font-size: 12px; color: #4a5568; margin-top: 4px; font-style: italic;">${test.note}</div>`;
      }
      if (test.error) {
        html += `<div class="test-error">Error: ${test.error}</div>`;
      }
      html += `</div>`;
      html += `<span class="test-badge ${statusClass}">${badge}</span>`;
      html += `</div>`;
    });
    html += `</div>`; // Close test-suite-content
    
    html += `</div>`; // Close test-suite
  });
  
  resultsDiv.innerHTML = html;
  
  // Add click handlers for test suite collapse/expand
  document.querySelectorAll('.test-suite-header').forEach(header => {
    header.addEventListener('click', (e) => {
      const index = e.currentTarget.getAttribute('data-suite-index');
      const content = document.querySelector(`[data-suite-content="${index}"]`);
      const toggle = e.currentTarget.querySelector('.test-suite-toggle');
      
      content.classList.toggle('collapsed');
      toggle.classList.toggle('collapsed');
      e.currentTarget.classList.toggle('collapsed');
    });
  });
}


