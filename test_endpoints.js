const http = require('http');

// Simple test for health endpoint first
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  console.log(`Health Check Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Health Response:', data);
    
    // Test file history endpoint
    const historyReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/files/history',
      method: 'GET'
    }, (historyRes) => {
      console.log(`File History Status: ${historyRes.statusCode}`);
      let historyData = '';
      historyRes.on('data', chunk => historyData += chunk);
      historyRes.on('end', () => {
        console.log('File History Response:', historyData);
      });
    });
    
    historyReq.on('error', (error) => {
      console.error('History request error:', error);
    });
    
    historyReq.end();
  });
});

req.on('error', (error) => {
  console.error('Health request error:', error);
});

req.end();
