/**
 * ChadJEE Authentication Debugger
 * 
 * This script helps diagnose authentication issues in the browser.
 * To use, open your browser console and copy-paste this entire script.
 */

const debugAuth = async () => {
  console.group('🔍 ChadJEE Auth Debugger');
  
  // 1. Environment check
  console.log('🌐 Environment Check:');
  const isProd = import.meta?.env?.PROD;
  console.log(`- Running in ${isProd ? 'production' : 'development'} mode`);
  
  if (isProd) {
    const apiUrl = import.meta?.env?.VITE_API_URL;
    console.log(`- API URL: ${apiUrl || 'NOT SET - This is a critical issue!'}`);
  } else {
    console.log('- Using relative API URLs');
  }
  
  // 2. Cookie check
  console.log('\n🍪 Cookie Check:');
  if (document.cookie) {
    console.log(`- Cookies present: ${document.cookie.split(';').length} cookies found`);
    
    // Check for session cookie (connect.sid or similar)
    const hasSessionCookie = document.cookie.includes('connect.sid');
    console.log(`- Session cookie: ${hasSessionCookie ? 'Found' : 'Not found - authentication will fail!'}`);
    
    console.log('- To view all cookies, check Application tab > Storage > Cookies');
  } else {
    console.log('- No cookies found - This indicates a serious authentication issue!');
    console.log('- Possible causes:');
    console.log('  * CORS issues preventing cookie setting');
    console.log('  * Cookie settings issues (sameSite, secure)');
    console.log('  * Different domains for frontend and backend');
  }
  
  // 3. API connectivity test
  console.log('\n🔌 API Connectivity:');
  try {
    const baseUrl = import.meta?.env?.PROD 
      ? import.meta.env.VITE_API_URL 
      : '';
    
    const authCheckUrl = `${baseUrl}/api/debug/auth`;
    console.log(`- Testing endpoint: ${authCheckUrl}`);
    
    const response = await fetch(authCheckUrl, { 
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    console.log('- Response:', data);
    
    if (data.authenticated) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Not authenticated');
      console.log(`- Session ID: ${data.sessionID || 'None'}`);
      
      if (data.cookies) {
        console.log('- Cookies are being sent to the server');
      } else {
        console.log('- No cookies are being sent to the server - critical issue!');
      }
    }
  } catch (error) {
    console.error('- API connectivity test failed:', error);
    console.log('- This indicates a CORS issue or backend service unreachable');
  }
  
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('1. Check CORS settings in server/index.ts');
  console.log('2. Verify VITE_API_URL is set correctly in the frontend environment');
  console.log('3. Ensure cookies are configured with { secure: true, sameSite: "none" } in production');
  console.log('4. Make sure all API calls include credentials: "include"');
  
  console.groupEnd();
};

// Run the debug function
debugAuth().catch(console.error);

// Return a helpful message to the console
"🔍 Running ChadJEE authentication diagnostics... Check the output above.";