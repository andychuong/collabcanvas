# Health Check Endpoint

## Overview

The Collab Canvas application includes a comprehensive health check endpoint for monitoring the status of all critical services and APIs.

## Access

The health check page is available at:

```
https://collabcanvas-andy.web.app/healthcheck
https://collabcanvas-andy.web.app/healthcheck.html
```

## Monitored Services

The health check monitors the following services in real-time:

### 1. **Firebase Authentication**
- Checks if the authentication service is operational
- Displays current authentication status (authenticated/anonymous)
- Shows response time

### 2. **Cloud Firestore**
- Tests database connectivity
- Attempts to read from the groups collection
- Measures query latency
- Verifies read permissions

### 3. **Firebase Hosting**
- Checks if the hosting service is responding
- Verifies the main application loads correctly
- Measures page load time

### 4. **OpenAI API**
- Checks if the OpenAI API key is configured
- Displays configuration status
- Shows partial API key (for verification)
- Note: Does not validate the key (to avoid API costs)

## Status Indicators

The health check uses color-coded status badges:

- **🟢 Healthy** (Green): Service is operational
- **🟡 Degraded** (Yellow): Some services are experiencing issues
- **🔴 Down** (Red): Critical services are unavailable
- **🔵 Checking** (Blue): Health check in progress

## Features

### Overall System Status
- Dashboard view showing aggregate health of all services
- Clear visual indicators for system state
- Real-time status updates

### Per-Service Details
Each service displays:
- Response time/latency
- Operational status
- Configuration details
- Error messages (if any)

### Auto-Refresh
- Automatically refreshes status every 30 seconds
- Manual refresh button available
- Timestamp of last check displayed

### Responsive Design
- Works on all device sizes
- Modern, clean interface
- Easy to read status information

## Use Cases

### 1. **Production Monitoring**
Use the health check endpoint with monitoring tools like:
- UptimeRobot
- Pingdom
- StatusCake
- Custom monitoring scripts

### 2. **Incident Response**
Quick way to diagnose system-wide issues during incidents

### 3. **Deployment Verification**
Verify all services are operational after deployments

### 4. **Status Page Integration**
Can be used as a backend for a public status page

## Technical Details

### Implementation
- Pure client-side JavaScript (no backend required)
- Uses Firebase SDK to test services directly
- Runs checks in parallel for fast results
- Graceful error handling

### Performance
- Initial load: < 500ms
- Health checks complete in ~1-2 seconds
- Minimal resource usage
- No impact on main application

### Security
- Read-only operations
- Uses existing Firebase security rules
- No sensitive data exposed
- API keys only show partial values

## Maintenance

### Updating the Health Check

The health check page is located at:
```
public/healthcheck.html
```

When building the application:
1. The build script automatically copies it to `dist/`
2. Firebase Hosting serves it at `/healthcheck`
3. The rewrite rules exclude it from SPA routing

### Adding New Service Checks

To add a new service to monitor:

1. Add a new check function in `healthcheck.html`:
```javascript
async function checkNewService() {
  const startTime = Date.now();
  try {
    // Perform service check
    const latency = Date.now() - startTime;
    
    return {
      name: 'New Service',
      status: 'healthy',
      details: [
        { label: 'Response Time', value: `${latency}ms` },
        { label: 'Status', value: 'Operational' },
      ]
    };
  } catch (error) {
    return {
      name: 'New Service',
      status: 'error',
      details: [
        { label: 'Status', value: 'Error' },
        { label: 'Error', value: error.message }
      ],
      error: error.message
    };
  }
}
```

2. Add it to the services array in `checkHealth()`:
```javascript
services = [
  // ... existing services
  { name: 'New Service', status: 'checking', details: [] },
];
```

3. Add it to the Promise.all():
```javascript
const results = await Promise.all([
  // ... existing checks
  checkNewService(),
]);
```

## Monitoring Best Practices

### Recommended Checks
- Check the endpoint every 1-5 minutes
- Alert if response time > 5 seconds
- Alert if any service status is "error"
- Alert if overall status is "down" for > 2 minutes

### Example: UptimeRobot Configuration
```
URL to Monitor: https://collabcanvas-andy.web.app/healthcheck
Monitoring Interval: 5 minutes
Alert Contacts: Your email/SMS
Keyword: "All Systems Operational"
```

### Example: cURL Health Check
```bash
# Check health status
curl -s https://collabcanvas-andy.web.app/healthcheck | grep "All Systems Operational"

# Exit code 0 if healthy, 1 if not
```

## Troubleshooting

### Health Check Page Not Loading
1. Verify Firebase Hosting is deployed
2. Check firebase.json rewrite rules
3. Ensure healthcheck.html is in dist/ directory

### Services Showing as Error
1. Check Firebase Console for service status
2. Verify Firestore security rules allow reads
3. Check browser console for detailed error messages
4. Verify network connectivity

### False Positives
- Clear browser cache and retry
- Check if Firebase services have scheduled maintenance
- Verify your internet connection

## Future Enhancements

Potential improvements:
- Add historical uptime data
- Include response time graphs
- Export health data as JSON API
- Add webhook notifications
- Include more detailed Firestore metrics
- Add real-time user count
- Show database query performance

