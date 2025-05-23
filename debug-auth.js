/**
 * Authentication Debug Tool for ChadJEE
 * 
 * This script helps diagnose authentication issues between frontend and backend
 * when deployed on separate services (like Render).
 * 
 * Usage: 
 * 1. Deploy both frontend and backend services to Render
 * 2. Run this script with your service URLs:
 *    node debug-auth.js https://chadjee-backend.onrender.com https://chadjee-frontend.onrender.com
 */

const fetch = require('node-fetch');
const https = require('https');
const { URL } = require('url');

// Fetch arguments
const args = process.argv.slice(2);
const backendUrl = args[0] || 'http://localhost:5000';
const frontendUrl = args[1] || 'http://localhost:5000';

console.log('ChadJEE Authentication Debugger');
console.log('===============================');
console.log(`Backend URL: ${backendUrl}`);
console.log(`Frontend URL: ${frontendUrl}`);
console.log('');

// Create a cookie jar for storing session cookies
const cookies = [];

// Helper to extract cookies from response headers
function extractCookies(response) {
  const cookieHeaders = response.headers.raw()['set-cookie'];
  if (cookieHeaders) {
    cookieHeaders.forEach(cookie => {
      const cookiePart = cookie.split(';')[0];
      cookies.push(cookiePart);
    });
    return cookieHeaders.length;
  }
  return 0;
}

// Helper to get domain from URL
function getDomain(url) {
  const parsed = new URL(url);
  return parsed.hostname;
}

// Test CORS configuration
function testCors() {
  console.log('Testing CORS Configuration...');
  
  return fetch(`${backendUrl}/api/debug/auth`, {
    method: 'GET',
    headers: {
      'Origin': frontendUrl,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods')
    };
    
    console.log('CORS Headers:', corsHeaders);
    
    if (corsHeaders['access-control-allow-origin'] === frontendUrl) {
      console.log('✅ Origin allowed: Frontend URL is properly allowed by backend CORS');
    } else if (corsHeaders['access-control-allow-origin'] === '*') {
      console.log('⚠️  CORS configured with wildcard (*) - this will NOT allow credentials!');
    } else {
      console.log('❌ CORS issue: Frontend origin not allowed by backend');
      console.log(`   Backend should allow origin: ${frontendUrl}`);
    }
    
    if (corsHeaders['access-control-allow-credentials'] === 'true') {
      console.log('✅ Credentials allowed: Backend properly allows credentials');
    } else {
      console.log('❌ Credentials not allowed: Backend must set access-control-allow-credentials: true');
    }
    
    return response.json();
  })
  .then(data => {
    console.log('Auth Debug Endpoint Response:', data);
    return data;
  })
  .catch(error => {
    console.error('CORS Test Error:', error.message);
    return null;
  });
}

// Test cookie settings
function testCookieSettings() {
  console.log('\nTesting Cookie Settings...');
  
  // Register a test user
  const testUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
  };
  
  console.log(`Attempting to register test user: ${testUser.email}`);
  
  return fetch(`${backendUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Origin': frontendUrl,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testUser)
  })
  .then(response => {
    const cookieCount = extractCookies(response);
    console.log(`Cookies set after registration: ${cookieCount}`);
    
    if (cookieCount > 0) {
      console.log('✅ Session cookie set during registration');
      cookies.forEach(cookie => console.log(`   ${cookie}`));
    } else {
      console.log('❌ No cookies set during registration!');
    }
    
    return response.json();
  })
  .then(data => {
    console.log('Registration Response:', data);
    
    // Now check if we can access protected endpoint
    console.log('\nTesting Authentication with Session Cookie...');
    
    return fetch(`${backendUrl}/api/debug/auth`, {
      method: 'GET',
      headers: {
        'Origin': frontendUrl,
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    });
  })
  .then(response => {
    return response.json();
  })
  .then(data => {
    console.log('Authentication Status:', data);
    
    if (data.authenticated) {
      console.log('✅ Authentication successful with session cookie!');
    } else {
      console.log('❌ Authentication failed even with session cookie');
      console.log('   This indicates a cookie or session configuration issue');
    }
    
    return data;
  })
  .catch(error => {
    console.error('Cookie Test Error:', error.message);
    return null;
  });
}

// Run all tests
async function runTests() {
  console.log('Running Authentication Tests...');
  console.log('This will help diagnose cross-domain auth issues.\n');
  
  // 1. Test CORS configuration
  await testCors();
  
  // 2. Test cookie settings
  await testCookieSettings();
  
  console.log('\nTests completed!');
  console.log('===============================================');
  console.log('If you encountered issues, check the following:');
  console.log('');
  console.log('1. Backend CORS configuration (server/index.ts):');
  console.log('   - origin: Should include your frontend URL');
  console.log('   - credentials: Must be true');
  console.log('');
  console.log('2. Cookie settings (server/auth.ts):');
  console.log('   - secure: Should be true in production');
  console.log('   - sameSite: Should be "none" in production');
  console.log('   - httpOnly: Should be true');
  console.log('');
  console.log('3. Frontend API configuration:');
  console.log('   - VITE_API_URL: Must point to your backend URL');
  console.log('   - All fetch calls should include credentials: "include"');
  console.log('');
  console.log('4. Environment variables:');
  console.log('   - SESSION_SECRET: Should be set in backend');
  console.log('   - ALLOWED_ORIGINS: Should include frontend URL');
}

// Run the tests
runTests().catch(console.error);