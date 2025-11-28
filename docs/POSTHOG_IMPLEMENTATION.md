# PostHog Analytics Implementation Guide

Complete PostHog integration for Intellectra AI SaaS app with manual event tracking (no autocapture).

## 📦 Installation

PostHog packages are already installed:
- `posthog-js` - Core PostHog JavaScript SDK
- `@posthog/react` - React hooks and provider

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**For self-hosted PostHog:**
```bash
NEXT_PUBLIC_POSTHOG_HOST=https://your-posthog-instance.com
```

### Optional: Proxy Configuration

To bypass ad blockers, you can proxy PostHog requests through your domain. Uncomment the rewrites in `next.config.ts`:

```typescript
async rewrites() {
  return [
    {
      source: '/ingest/:path*',
      destination: 'https://app.posthog.com/:path*',
    },
  ];
}
```

Then update `NEXT_PUBLIC_POSTHOG_HOST` to use your domain:
```bash
NEXT_PUBLIC_POSTHOG_HOST=https://intellectra.kenawak.works
```

## 🏗️ Architecture

### Components Structure

```
components/
  providers/
    PostHogProvider.tsx    # Main provider with initialization
  PostHogPageview.tsx        # Client wrapper for pageview tracking
hooks/
  usePostHogPageview.ts     # Hook for manual pageview tracking
```

### Initialization

PostHog is initialized in `app/layout.tsx` via `PostHogProvider`:

```tsx
<PostHogProvider>
  {children}
</PostHogProvider>
```

**Key Configuration:**
- `autocapture: false` - No automatic event tracking
- `capture_pageview: false` - Manual pageview tracking only
- `person_profiles: 'always'` - Always create user profiles
- `disable_session_recording: true` - No session recording

## 📊 Event Tracking

### Tracked Events

#### 1. Pageviews (`$pageview`)
**Location:** `components/dashboard-layout.tsx`, `app/page.tsx`

Automatically tracked on route changes using `usePostHogPageview()` hook.

**Properties:**
- `$current_url` - Full URL with query parameters

#### 2. User Signed Up
**Location:** `components/login-form.tsx`, `components/singup-form.tsx`

Tracked when user successfully signs up (email or Google OAuth).

**Properties:**
- `role` - User role (default: 'user')
- `plan` - Initial plan (default: 'free')
- `method` - Signup method ('email' or 'google')

**Example:**
```typescript
posthog?.capture('User Signed Up', {
  role: 'user',
  plan: 'free',
  method: 'email',
});
```

#### 3. Button Clicked
**Location:** Landing page, login, signup, pricing pages

Tracked for key CTAs only (not all buttons).

**Properties:**
- `button_text` - Button label
- `section` - Section where button is located ('hero', 'login', 'signup', 'pricing', 'mobile-menu')

**Example:**
```typescript
posthog?.capture('Button Clicked', {
  button_text: 'Get Started',
  section: 'hero',
});
```

#### 4. Feature Used
**Location:** Various feature interactions

Tracked when users interact with key features.

**Properties:**
- `feature_name` - Name of the feature
- `user_id` - User ID (optional)

**Examples:**
- `'Idea Search'` - When user searches for ideas
- `'Onboarding Completed'` - When user completes onboarding
- `'Free Plan Activated'` - When user activates free plan

#### 5. Payment Started
**Location:** `app/pricing/page.tsx`

Tracked when user initiates checkout.

**Properties:**
- `plan` - Plan name ('pro', 'enterprise')
- `product_id` - Product ID from Polar
- `amount` - Price amount (update with actual values)

#### 6. Subscription Purchased
**Note:** This should be tracked in your Polar webhook handler when payment is confirmed.

**Location:** `app/api/webhooks/polar/route.ts` (to be added)

**Properties:**
- `plan` - Plan name
- `amount` - Purchase amount
- `customer_id` - Polar customer ID

## 🔑 User Identification

Users are identified after successful authentication:

```typescript
posthog?.identify(user.id, {
  email: user.email,
  name: user.name,
  role: user.role || 'user',
});
```

**Locations:**
- `components/login-form.tsx` - After email login
- `components/login-form.tsx` - After Google OAuth
- `components/singup-form.tsx` - After email signup
- `components/singup-form.tsx` - After Google OAuth

## 📝 Usage Examples

### Adding Event Tracking to a New Component

```tsx
'use client';

import { usePostHog } from '@posthog/react';

export function MyComponent() {
  const posthog = usePostHog();

  const handleAction = () => {
    // Track event
    posthog?.capture('Feature Used', {
      feature_name: 'My Feature',
      user_id: session?.user?.id,
    });
    
    // Your action logic
  };

  return (
    <button onClick={handleAction}>
      Do Something
    </button>
  );
}
```

### Adding Pageview Tracking to a New Page

```tsx
'use client';

import { PostHogPageview } from '@/components/PostHogPageview';

export default function MyPage() {
  return (
    <>
      <PostHogPageview />
      <div>Page content</div>
    </>
  );
}
```

### Tracking Button Clicks

```tsx
import { usePostHog } from '@posthog/react';

function MyButton() {
  const posthog = usePostHog();

  return (
    <button
      onClick={() => {
        posthog?.capture('Button Clicked', {
          button_text: 'Start Onboarding',
          section: 'dashboard',
        });
        // Your action
      }}
    >
      Start Onboarding
    </button>
  );
}
```

## 🧪 Testing

### Test Script

Run this in your browser console after setting up PostHog:

```javascript
// Check if PostHog is loaded
console.log('PostHog loaded:', window.posthog && typeof window.posthog.capture === 'function');

// Test event capture
window.posthog?.capture('test_event', {
  test_property: 'test_value',
});

// Check recent events in PostHog dashboard
// Go to: https://app.posthog.com/events
```

### Manual Testing Checklist

1. **Pageview Tracking:**
   - Navigate between pages
   - Check PostHog dashboard → Events → `$pageview`

2. **User Signup:**
   - Sign up with email
   - Sign up with Google
   - Check Events → `User Signed Up`
   - Verify user identification in People → Users

3. **Button Clicks:**
   - Click "Sign In" on landing page
   - Click "Get Started Free" on pricing page
   - Check Events → `Button Clicked`

4. **Feature Usage:**
   - Complete onboarding
   - Search for ideas
   - Check Events → `Feature Used`

5. **Payment Flow:**
   - Click "Start 7-Day Trial" on pricing page
   - Check Events → `Payment Started`

## 🚀 Deployment

1. **Set Environment Variables:**
   ```bash
   # Vercel
   vercel env add NEXT_PUBLIC_POSTHOG_KEY
   vercel env add NEXT_PUBLIC_POSTHOG_HOST
   ```

2. **Verify Configuration:**
   - Check browser console for PostHog initialization
   - Verify events appear in PostHog dashboard

3. **Monitor Events:**
   - PostHog Dashboard → Events
   - PostHog Dashboard → People → Users

## 📈 Best Practices

1. **Selective Tracking:** Only track business-critical events, not every click
2. **Consistent Naming:** Use consistent event names (e.g., `Feature Used`, `Button Clicked`)
3. **Property Standardization:** Use consistent property names across events
4. **Error Handling:** Always check `posthog` exists and has `capture` method before capturing events
5. **User Privacy:** Only track necessary data, respect user privacy

## 🔍 Debugging

### PostHog Not Loading

1. Check environment variables are set correctly
2. Check browser console for errors
3. Verify `NEXT_PUBLIC_POSTHOG_KEY` is correct
4. Check network tab for PostHog requests

### Events Not Appearing

1. Check `posthog` exists and has `capture` method before capturing
2. Verify event names match PostHog dashboard
3. Check browser console for errors
4. Verify PostHog project key is correct

### User Identification Issues

1. Ensure `posthog.identify()` is called after authentication
2. Check user ID is correct
3. Verify user properties are set correctly

## 📚 Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog React Integration](https://posthog.com/docs/libraries/react)
- [PostHog Event Tracking](https://posthog.com/docs/getting-started/send-events)

## 🎯 Next Steps

1. **Add Subscription Purchased Tracking:**
   - Update `app/api/webhooks/polar/route.ts` to track successful payments

2. **Add More Feature Tracking:**
   - Track AI generation events
   - Track report generation
   - Track project creation

3. **Add Funnels:**
   - Signup → Onboarding → First Feature Use
   - Free Plan → Pro Plan Conversion

4. **Add Cohorts:**
   - Free users
   - Pro users
   - Enterprise users

