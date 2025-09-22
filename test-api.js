// Simple API testing script for Vercel deployment
const https = require('https');

const BASE_URL = 'https://your-app.vercel.app'; // Replace with your actual Vercel URL

async function testEndpoint(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Vercel API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing /api/health...');
    const health = await testEndpoint('/api/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data)}\n`);

    // Test contact endpoint
    console.log('2. Testing /api/contact...');
    const contact = await testEndpoint('/api/contact', 'POST', {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message'
    });
    console.log(`   Status: ${contact.status}`);
    console.log(`   Response: ${JSON.stringify(contact.data)}\n`);

    // Test quotes endpoint
    console.log('3. Testing /api/quotes...');
    const quotes = await testEndpoint('/api/quotes', 'POST', {
      name: 'Test User',
      email: 'test@example.com',
      project_name: 'Test Project',
      description: 'This is a test quote request'
    });
    console.log(`   Status: ${quotes.status}`);
    console.log(`   Response: ${JSON.stringify(quotes.data)}\n`);

    // Test analytics endpoint
    console.log('4. Testing /api/analytics/overview...');
    const analytics = await testEndpoint('/api/analytics/overview');
    console.log(`   Status: ${analytics.status}`);
    console.log(`   Response: ${JSON.stringify(analytics.data)}\n`);

    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testEndpoint, runTests };
