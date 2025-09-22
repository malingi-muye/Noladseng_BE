#!/usr/bin/env node

/**
 * CORS Test Script
 * Tests CORS configuration for the serverless functions
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'https://noladseng-be.vercel.app';
const TEST_ORIGIN = process.env.TEST_ORIGIN || 'https://noladseng.com';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Origin': TEST_ORIGIN,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testCorsConfiguration() {
  console.log('🧪 Testing CORS Configuration');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`🌐 Test Origin: ${TEST_ORIGIN}`);
  console.log('');

  const tests = [
    {
      name: 'CORS Test Endpoint',
      url: `${API_BASE_URL}/api/cors-test`,
      method: 'GET'
    },
    {
      name: 'Contact Endpoint',
      url: `${API_BASE_URL}/api/contact`,
      method: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        message: 'CORS test message'
      })
    },
    {
      name: 'Analytics Overview',
      url: `${API_BASE_URL}/api/analytics/overview`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Method: ${test.method}`);
    
    try {
      // Test preflight request
      console.log('   📤 Sending preflight request...');
      const preflightResponse = await makeRequest(test.url, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': test.method,
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      console.log(`   📥 Preflight Status: ${preflightResponse.status}`);
      console.log(`   📥 CORS Headers:`);
      console.log(`      Access-Control-Allow-Origin: ${preflightResponse.headers['access-control-allow-origin']}`);
      console.log(`      Access-Control-Allow-Methods: ${preflightResponse.headers['access-control-allow-methods']}`);
      console.log(`      Access-Control-Allow-Headers: ${preflightResponse.headers['access-control-allow-headers']}`);
      console.log(`      Access-Control-Allow-Credentials: ${preflightResponse.headers['access-control-allow-credentials']}`);

      // Test actual request
      if (test.method !== 'OPTIONS') {
        console.log('   📤 Sending actual request...');
        const actualResponse = await makeRequest(test.url, {
          method: test.method,
          body: test.body
        });

        console.log(`   📥 Actual Status: ${actualResponse.status}`);
        console.log(`   📥 Response Headers:`);
        console.log(`      Access-Control-Allow-Origin: ${actualResponse.headers['access-control-allow-origin']}`);
        
        if (actualResponse.status === 200) {
          console.log('   ✅ Request successful');
        } else {
          console.log('   ❌ Request failed');
          console.log(`   📄 Response: ${actualResponse.data}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n🏁 CORS testing completed');
}

// Run the test
if (require.main === module) {
  testCorsConfiguration().catch(console.error);
}

module.exports = { testCorsConfiguration };
