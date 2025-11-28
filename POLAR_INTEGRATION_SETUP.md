# 🛠️ Polar Integration Setup Guide

## Phase 1: Environment Variables

### Required Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Polar API Configuration
POLAR_ACCESS_TOKEN=polar_xxxxxxxxxxxxx  # Your Polar API access token
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Webhook secret from Polar dashboard
NEXT_PUBLIC_POLAR_URL=https://api.polar.sh  # Polar API base URL (or your custom domain)

# Optional: For sandbox/testing
# POLAR_SERVER=sandbox  # Use 'sandbox' for testing, remove for production
```

### How to Get These Values

1. **POLAR_ACCESS_TOKEN**:
   - Go to Polar Dashboard → Settings → API
   - Generate a new access token
   - Copy the token (starts with `polar_`)

2. **POLAR_WEBHOOK_SECRET**:
   - Go to Polar Dashboard → Settings → Webhooks
   - Create a new webhook endpoint pointing to: `https://yourdomain.com/api/webhooks/polar`
   - Copy the webhook secret (starts with `whsec_`)

3. **NEXT_PUBLIC_POLAR_URL**:
   - Production: `https://api.polar.sh`
   - Sandbox: `https://sandbox-api.polar.sh` (if using sandbox mode)

---

## Phase 2: Database Schema

The `userprofile` table already exists with the following relevant fields:
- `plan`: text (default: "free") - Values: "free", "pro", "enterprise"
- `paid`: boolean (default: false)
- `customerId`: text (nullable) - Polar customer ID

No schema changes needed! ✅

---

## Phase 3: Implementation Checklist

### ✅ Files to Update/Create

1. **`lib/auth.ts`** - Uncomment and configure Polar plugin
2. **`app/api/webhooks/polar/route.ts`** - Add signature verification and subscription event handling
3. **`lib/polar-utils.ts`** - NEW: Helper functions for subscription status
4. **`lib/subscription-guard.tsx`** - NEW: React component for protecting paid features
5. **`.env.local`** - Add environment variables

---

## Phase 4: Testing Checklist

### Webhook Testing

1. Use Polar's webhook testing tool or ngrok for local testing
2. Test events:
   - `checkout.created`
   - `order.paid`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.deleted`

### Subscription Status Testing

1. Create a test user
2. Complete a checkout flow
3. Verify `userprofile.plan` updates to "pro"
4. Verify session includes `subscriptionStatus`

---

## Phase 5: Frontend Integration

### Protecting Paid Features

Use the `SubscriptionGuard` component to protect paid features:

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

### Checking Subscription Status

```tsx
import { authClient } from '@/lib/auth-client';

const { data: session } = authClient.useSession();
const isPro = session?.user?.subscriptionStatus === 'pro';
```

---

## Security Notes

1. **Never expose** `POLAR_ACCESS_TOKEN` or `POLAR_WEBHOOK_SECRET` in client-side code
2. **Always verify** webhook signatures before processing events
3. **Use HTTPS** in production for webhook endpoints
4. **Rate limit** webhook endpoints to prevent abuse

---

## Support

For issues or questions:
- Polar Docs: https://docs.polar.sh
- Better-Auth Polar Plugin: https://www.better-auth.com/docs/plugins/polar

