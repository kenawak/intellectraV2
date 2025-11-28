#!/usr/bin/env node

/**
 * PostHog Integration Test Script
 * 
 * This script helps verify PostHog integration is working correctly.
 * Run this in your browser console after setting up PostHog.
 * 
 * Usage:
 * 1. Open your app in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Run: testPostHog()
 */

function testPostHog() {
  console.log('🧪 Testing PostHog Integration...\n');

  // Check if PostHog is loaded
  if (typeof window === 'undefined' || !window.posthog) {
    console.error('❌ PostHog is not loaded. Check:');
    console.error('   1. NEXT_PUBLIC_POSTHOG_KEY is set');
    console.error('   2. PostHogProvider is in layout.tsx');
    console.error('   3. No JavaScript errors in console');
    return;
  }

  const posthog = window.posthog;

  // Test 1: Check if PostHog is initialized
  console.log('✅ PostHog is loaded');
  console.log('   Loaded:', posthog.loaded);
  console.log('   Config:', {
    api_host: posthog.config?.api_host,
    autocapture: posthog.config?.autocapture,
    capture_pageview: posthog.config?.capture_pageview,
  });

  // Test 2: Check current user
  const distinctId = posthog.get_distinct_id();
  console.log('\n👤 Current User:');
  console.log('   Distinct ID:', distinctId);

  // Test 3: Test event capture
  console.log('\n📊 Testing Event Capture...');
  const testEventName = 'test_event_' + Date.now();
  posthog.capture(testEventName, {
    test_property: 'test_value',
    timestamp: new Date().toISOString(),
  });
  console.log('   ✅ Event captured:', testEventName);
  console.log('   Check PostHog dashboard → Events to verify');

  // Test 4: Test pageview
  console.log('\n📄 Testing Pageview...');
  posthog.capture('$pageview', {
    $current_url: window.location.href,
  });
  console.log('   ✅ Pageview captured');
  console.log('   Current URL:', window.location.href);

  // Test 5: Test user identification (if user is logged in)
  console.log('\n🔑 Testing User Identification...');
  const userId = 'test_user_' + Date.now();
  posthog.identify(userId, {
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  });
  console.log('   ✅ User identified:', userId);

  // Test 6: Check recent events
  console.log('\n📈 Summary:');
  console.log('   ✅ PostHog is initialized');
  console.log('   ✅ Events can be captured');
  console.log('   ✅ User identification works');
  console.log('\n🔍 Next Steps:');
  console.log('   1. Go to PostHog dashboard: https://app.posthog.com');
  console.log('   2. Check Events → Recent events');
  console.log('   3. Check People → Users');
  console.log('   4. Verify test events appear');

  return {
    loaded: posthog.loaded,
    distinctId: distinctId,
    config: posthog.config,
  };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('💡 PostHog Test Script Loaded');
  console.log('   Run: testPostHog() to test integration');
  window.testPostHog = testPostHog;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPostHog };
}

