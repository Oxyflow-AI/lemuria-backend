// OAuth functionality test script
const baseUrl = 'http://localhost:3000';

async function testOAuthFunctionality() {
    console.log('=== OAuth Functionality Test ===\n');
    
    try {
        // Test 1: Generate Google OAuth URL
        console.log('1. Testing OAuth URL generation...');
        const oauthResponse = await fetch(`${baseUrl}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (oauthResponse.ok) {
            const oauthResult = await oauthResponse.json();
            console.log('✅ OAuth URL generated successfully');
            console.log(`   URL: ${oauthResult.data?.url}`);
            console.log(`   Message: ${oauthResult.data?.message}`);
        } else {
            console.log('❌ OAuth URL generation failed');
            const error = await oauthResponse.text();
            console.log(`   Error: ${error}`);
        }
        
        // Test 2: Check OAuth callback endpoint accessibility
        console.log('\n2. Testing OAuth callback endpoint...');
        const callbackResponse = await fetch(`${baseUrl}/api/auth/google/callback?code=dummy_code`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // We expect this to fail with a specific error since we're using a dummy code
        const callbackResult = await callbackResponse.text();
        if (callbackResult.includes('OAuth') || callbackResult.includes('callback') || callbackResult.includes('Failed')) {
            console.log('✅ OAuth callback endpoint is accessible');
            console.log(`   Response: ${callbackResult.substring(0, 100)}...`);
        } else {
            console.log('❌ OAuth callback endpoint issue');
            console.log(`   Response: ${callbackResult}`);
        }
        
        // Test 3: Check callback HTML page
        console.log('\n3. Testing OAuth callback HTML page...');
        const htmlResponse = await fetch(`${baseUrl}/auth/callback`);
        if (htmlResponse.ok) {
            const htmlContent = await htmlResponse.text();
            if (htmlContent.includes('Authentication Callback') || htmlContent.includes('Processing Authentication')) {
                console.log('✅ OAuth callback HTML page is accessible');
            } else {
                console.log('❌ OAuth callback HTML page content issue');
            }
        } else {
            console.log('❌ OAuth callback HTML page not accessible');
        }
        
        // Test 4: Check auth routes
        console.log('\n4. Testing all auth routes...');
        const routes = [
            '/api/auth/signup',
            '/api/auth/signin', 
            '/api/auth/google',
            '/api/auth/google/callback',
            '/api/auth/verify-email',
            '/api/auth/status'
        ];
        
        for (const route of routes) {
            try {
                const response = await fetch(`${baseUrl}${route}`, {
                    method: route.includes('callback') ? 'GET' : 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                console.log(`   ${route}: ${response.status} ${response.statusText}`);
            } catch (error) {
                console.log(`   ${route}: ERROR - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Run the test
testOAuthFunctionality();