#!/usr/bin/env node

/**
 * Local CORS Test Script
 * Tests CORS configuration locally before deployment
 */

// Test the CORS utility directly
async function testCorsUtility() {
  console.log('🧪 Testing CORS Utility Locally');
  
  // Mock request and response objects
  const mockReq = {
    method: 'OPTIONS',
    headers: {
      origin: 'https://noladseng.com'
    }
  };
  
  const mockRes = {
    headers: {},
    setHeader: function(key, value) {
      this.headers[key] = value;
      console.log(`   📤 Set header: ${key} = ${value}`);
    },
    status: function(code) {
      this.statusCode = code;
      console.log(`   📤 Set status: ${code}`);
      return this;
    },
    end: function() {
      console.log('   📤 Response ended');
    }
  };
  
  try {
    // Import the CORS utility
    const { applyCors, handlePreflight } = await import('./serverless/_cors.js');
    
    console.log('\n🔍 Testing applyCors function:');
    applyCors(mockReq, mockRes);
    
    console.log('\n🔍 Testing handlePreflight function:');
    const result = handlePreflight(mockReq, mockRes);
    console.log(`   📥 Preflight handled: ${result}`);
    
    console.log('\n✅ CORS utility test completed successfully');
    
  } catch (error) {
    console.error('❌ CORS utility test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testCorsUtility().catch(console.error);
