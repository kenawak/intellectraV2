# ✅ Polar Integration Implementation Checklist

## Phase 1: Environment Variables ✅

- [ ] Add `POLAR_ACCESS_TOKEN` to `.env.local`
- [ ] Add `POLAR_WEBHOOK_SECRET` to `.env.local`
- [ ] Add `NEXT_PUBLIC_POLAR_URL` to `.env.local` (optional, defaults to production)
- [ ] Add `POLAR_SERVER` to `.env.local` (optional: "sandbox" for testing)

**Location**: `.env.local`

```bash
POLAR_ACCESS_TOKEN=polar_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_POLAR_URL=https://api.polar.sh
POLAR_SERVER=production  # or "sandbox" for testing
```

---

## Phase 2: Files Created/Updated ✅

### ✅ Created Files

1. **`lib/polar-utils.ts`**
   - Helper functions for subscription status
   - Polar client initialization
   - Database and API subscription status fetching

2. **`lib/auth-session-extension.ts`**
   - Session enrichment with subscription status
   - Used by auth-utils to inject subscription into sessions

3. **`lib/subscription-guard.tsx`**
   - React component for protecting paid features
   - Hook `useSubscription()` for checking subscription status
   - Automatic redirect to Polar checkout

4. **`POLAR_INTEGRATION_SETUP.md`**
   - Complete setup documentation
   - Environment variable guide
   - Testing checklist

5. **`POLAR_IMPLEMENTATION_CHECKLIST.md`** (this file)
   - Implementation checklist
   - Verification steps

### ✅ Updated Files

1. **`lib/auth.ts`**
   - ✅ Uncommented Polar plugin configuration
   - ✅ Configured Polar client initialization
   - ✅ Enabled checkout, portal, usage, and webhooks
   - ✅ Product IDs configured (free, pro, enterprise)

2. **`app/api/webhooks/polar/route.ts`**
   - ✅ Added signature verification (HMAC SHA256)
   - ✅ Handles `subscription.created` event
   - ✅ Handles `subscription.updated` event
   - ✅ Handles `subscription.deleted` event
   - ✅ Legacy support for `checkout.created` and `order.paid`

3. **`lib/auth-utils.ts`**
   - ✅ Added `enrichSessionWithSubscription()` calls
   - ✅ Added `requireSubscription()` function
   - ✅ Added `hasSubscription()` function

---

## Phase 3: Webhook Configuration ✅

### Polar Dashboard Setup

1. **Create Webhook Endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/polar`
   - Events to subscribe:
     - ✅ `subscription.created`
     - ✅ `subscription.updated`
     - ✅ `subscription.deleted`
     - ✅ `checkout.created` (legacy)
     - ✅ `order.paid` (legacy)

2. **Copy Webhook Secret**:
   - From Polar Dashboard → Settings → Webhooks
   - Add to `.env.local` as `POLAR_WEBHOOK_SECRET`

---

## Phase 4: Frontend Integration ✅

### Using SubscriptionGuard Component

```tsx
import { SubscriptionGuard } from '@/lib/subscription-guard';

export default function PaidFeaturePage() {
  return (
    <SubscriptionGuard requiredPlan="pro">
      <YourPaidFeatureContent />
    </SubscriptionGuard>
  );
}
```

### Using useSubscription Hook

```tsx
import { useSubscription } from '@/lib/subscription-guard';

export default function FeaturePage() {
  const { isPro, isEnterprise, subscriptionStatus } = useSubscription();
  
  if (!isPro) {
    return <UpgradePrompt />;
  }
  
  return <ProFeature />;
}
```

### Server-Side Protection

```tsx
import { requireSubscription } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await requireSubscription(req, 'pro');
    // User has pro subscription, proceed
  } catch (error) {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
  }
}
```

---

## Phase 5: Testing Checklist

### Webhook Testing

- [ ] Test `subscription.created` event
- [ ] Test `subscription.updated` event (upgrade/downgrade)
- [ ] Test `subscription.deleted` event
- [ ] Verify signature verification works (test with invalid signature)
- [ ] Verify database updates correctly

### Subscription Status Testing

- [ ] Create test user
- [ ] Verify default status is 'free'
- [ ] Complete checkout flow
- [ ] Verify `userprofile.plan` updates to 'pro'
- [ ] Verify `userprofile.paid` updates to `true`
- [ ] Verify session includes `subscriptionStatus: 'pro'`

### Frontend Testing

- [ ] Test `SubscriptionGuard` redirects free users
- [ ] Test `SubscriptionGuard` allows pro users
- [ ] Test `useSubscription` hook returns correct values
- [ ] Test server-side `requireSubscription()` throws correctly

---

## Phase 6: Product IDs Configuration

### Current Product IDs (in `lib/auth.ts`)

- **Free**: `88c88042-ede8-4290-8e6e-b96291bf4c87`
- **Pro**: `447405a4-6037-42f5-9138-aa519625dc3e`
- **Enterprise**: `d6aea22f-6156-4bc9-9f4c-a937ad05fa0f`

**⚠️ Action Required**: Verify these product IDs match your Polar Dashboard products!

---

## Phase 7: Security Checklist

- [x] Webhook signature verification implemented
- [x] Environment variables not exposed to client
- [x] Subscription status checked server-side
- [ ] HTTPS enabled in production
- [ ] Webhook endpoint rate-limited (consider adding)
- [ ] Error handling for Polar API failures

---

## Phase 8: Deployment Steps

1. **Set Environment Variables**:
   ```bash
   # Production
   POLAR_ACCESS_TOKEN=polar_xxx
   POLAR_WEBHOOK_SECRET=whsec_xxx
   NEXT_PUBLIC_POLAR_URL=https://api.polar.sh
   POLAR_SERVER=production
   ```

2. **Configure Webhook in Polar Dashboard**:
   - Point to: `https://yourdomain.com/api/webhooks/polar`
   - Copy webhook secret to environment variables

3. **Test Webhook**:
   - Use Polar's webhook testing tool
   - Or use ngrok for local testing

4. **Verify Checkout Flow**:
   - Test `/checkout/pro` redirects correctly
   - Test `/checkout/enterprise` redirects correctly
   - Verify success redirect to `/dashboard`

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in Polar Dashboard
2. Verify `POLAR_WEBHOOK_SECRET` matches Polar Dashboard
3. Check server logs for signature verification errors
4. Ensure webhook endpoint is publicly accessible

### Subscription Status Not Updating

1. Check database `userprofile` table
2. Verify webhook events are being received
3. Check webhook handler logs
4. Verify `customerId` is being set correctly

### Session Not Including Subscription Status

1. Verify `enrichSessionWithSubscription()` is being called
2. Check `getSubscriptionStatus()` function
3. Verify database query returns correct data
4. Check for errors in server logs

---

## Support Resources

- Polar Docs: https://docs.polar.sh
- Better-Auth Polar Plugin: https://www.better-auth.com/docs/plugins/polar
- Polar Dashboard: https://polar.sh

---

## Next Steps

1. ✅ Complete environment variable setup
2. ✅ Configure webhook in Polar Dashboard
3. ✅ Test webhook events
4. ✅ Test checkout flow
5. ✅ Test subscription protection
6. ✅ Deploy to production

**Status**: 🟢 Ready for testing and deployment!

