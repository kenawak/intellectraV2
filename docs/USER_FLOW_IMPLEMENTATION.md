# User Flow Implementation Guide

## Overview

This document describes the complete user flow from login/signup through plan acquisition to onboarding and dashboard access.

## Flow Sequence

```
Login/Signup
    ↓
AuthGuard (Authentication Check)
    ↓
PlanAcquisitionGuard (Polar State Check)
    ├─→ If plan/paid NOT set → Redirect to /dashboard/pricing
    └─→ If plan/paid set → Continue
    ↓
OnboardingGuard (Optional, Non-Blocking)
    ├─→ If onboarding_complete = false → Allow access (non-blocking)
    └─→ If onboarding_complete = true → Continue
    ↓
Dashboard with OnboardingReminder
    ├─→ If onboarding_complete = false → Show reminder modal
    └─→ User can complete now or skip for later
```

## Component Hierarchy

```tsx
<AuthGuard>
  <PlanAcquisitionGuard>
    <OnboardingGuard optional={true}>
      <DashboardLayout>
        <OnboardingReminder />
        {children}
      </DashboardLayout>
    </OnboardingGuard>
  </PlanAcquisitionGuard>
</AuthGuard>
```

## Components

### 1. AuthGuard
**File:** `components/auth-guard.tsx`

- Ensures user is authenticated
- Redirects to `/login` if not authenticated
- Must be the outermost guard

### 2. PlanAcquisitionGuard
**File:** `components/plan-acquisition-guard.tsx`

**Purpose:** Ensures Polar state (plan/paid) is set before proceeding.

**Logic:**
- Checks `/api/user/profile` for `plan` and `paid` status
- If either is `null` or `undefined`, redirects to `/dashboard/pricing`
- Allows free tier users (`plan: 'free'`, `paid: false`) to proceed
- Must run BEFORE OnboardingGuard

**API Endpoint:** `GET /api/user/profile`

**Response:**
```json
{
  "plan": "free" | "pro" | "enterprise" | null,
  "paid": boolean | null,
  "onboardingComplete": boolean,
  "marketSpecialization": string | null,
  "specializationPath": string[] | null
}
```

### 3. OnboardingGuard
**File:** `components/onboarding-guard.tsx`

**Purpose:** Checks onboarding status, but allows dashboard access if optional.

**Props:**
- `optional?: boolean` - If true, onboarding is non-blocking

**Behavior:**
- If `optional={true}`: Allows dashboard access even if onboarding incomplete
- If `optional={false}`: Blocks dashboard access, shows onboarding flow
- In dashboard, we use `optional={true}` to allow access with reminder

**Precondition:** Plan acquisition (paid/plan) must be complete.

### 4. OnboardingReminder
**File:** `components/onboarding-reminder.tsx`

**Purpose:** Non-blocking reminder modal on dashboard.

**Features:**
- Only shows if `onboarding_complete = false`
- User can "Complete Now" or "Skip for Now"
- Uses `sessionStorage` to remember dismissal for current session
- "Complete Now" opens full onboarding flow
- "Skip for Now" dismisses modal (can be shown again on next page load)

## User Profile State

The `userprofile` table must have all these fields set:

```typescript
{
  plan: 'free' | 'pro' | 'enterprise',  // Required
  paid: boolean,                         // Required
  onboardingComplete: boolean,            // Required (default: false)
  marketSpecialization: string | null,   // Optional
  specializationPath: string[] | null    // Optional
}
```

## Flow Scenarios

### Scenario 1: New User Signup

1. **Signup** → User creates account
2. **AuthGuard** → User authenticated ✅
3. **PlanAcquisitionGuard** → No profile exists → Redirect to `/dashboard/pricing`
4. **User selects plan** → Free tier or paid plan
5. **Polar webhook** → Sets `plan` and `paid` in userprofile
6. **Redirect to dashboard** → PlanAcquisitionGuard passes ✅
7. **OnboardingGuard** → `onboarding_complete = false`, but optional → Allow access ✅
8. **Dashboard loads** → OnboardingReminder shows modal
9. **User completes onboarding** → Sets `onboarding_complete = true`, `marketSpecialization`, `specializationPath`

### Scenario 2: Existing User with Plan, No Onboarding

1. **Login** → User authenticates ✅
2. **AuthGuard** → User authenticated ✅
3. **PlanAcquisitionGuard** → `plan` and `paid` set → Continue ✅
4. **OnboardingGuard** → `onboarding_complete = false`, optional → Allow access ✅
5. **Dashboard loads** → OnboardingReminder shows modal
6. **User can complete or skip**

### Scenario 3: Complete User

1. **Login** → User authenticates ✅
2. **AuthGuard** → User authenticated ✅
3. **PlanAcquisitionGuard** → `plan` and `paid` set → Continue ✅
4. **OnboardingGuard** → `onboarding_complete = true` → Continue ✅
5. **Dashboard loads** → No reminder shown ✅

## Polar Integration

### Webhook Handler
**File:** `app/api/webhooks/polar/route.ts`

When `order.paid` event is received:
1. Extracts `userId` from webhook payload
2. Maps `product_id` to plan (`pro` or `enterprise`)
3. Updates userprofile:
   ```typescript
   {
     plan: 'pro' | 'enterprise',
     paid: true,
     customerId: string
   }
   ```

### Checkout Success URL
**File:** `lib/auth.ts`

```typescript
checkout({
  successUrl: "/dashboard",  // Redirects here after successful payment
  // ...
})
```

After successful checkout:
1. User is redirected to `/dashboard`
2. PlanAcquisitionGuard checks profile → `plan` and `paid` now set ✅
3. OnboardingGuard allows access (optional)
4. OnboardingReminder shows if needed

## API Endpoints

### GET /api/user/profile
Returns current user's profile state.

**Response:**
```json
{
  "plan": "free",
  "paid": false,
  "onboardingComplete": false,
  "marketSpecialization": null,
  "specializationPath": null
}
```

### GET /api/onboarding/status
Returns onboarding completion status.

**Response:**
```json
{
  "onboardingComplete": false,
  "marketSpecialization": null,
  "specializationPath": null
}
```

### POST /api/onboarding/complete
Completes onboarding and saves specialization data.

**Request:**
```json
{
  "marketSpecialization": "Fullstack",
  "specializationPath": ["Digital", "Software_Development", "Web_Development", "Fullstack"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

## Testing Checklist

- [ ] New user signup → Redirected to pricing
- [ ] Free plan selection → Profile created with `plan: 'free'`, `paid: false`
- [ ] Paid plan checkout → Webhook sets `plan` and `paid: true`
- [ ] After payment → Redirected to dashboard
- [ ] Onboarding reminder → Shows if `onboarding_complete = false`
- [ ] Skip onboarding → Modal dismissed, dashboard accessible
- [ ] Complete onboarding → `onboarding_complete = true`, reminder disappears
- [ ] Return visit → No reminder if onboarding complete

## Edge Cases

### Case 1: User with plan but no profile
- PlanAcquisitionGuard will redirect to pricing
- Pricing page should handle existing customers gracefully

### Case 2: User completes payment but webhook fails
- User profile may not have `plan`/`paid` set
- PlanAcquisitionGuard will redirect back to pricing
- User can retry checkout or contact support

### Case 3: User dismisses reminder multiple times
- Reminder uses `sessionStorage` (cleared on browser close)
- Reminder will show again on next session
- Consider adding "Don't show again" option with localStorage

## Future Enhancements

1. **Settings Page Integration**
   - Add "Complete Onboarding" button in settings
   - Allow users to update specialization later

2. **Analytics**
   - Track onboarding completion rate
   - Track time from signup to onboarding completion

3. **Progressive Onboarding**
   - Multi-step onboarding with progress indicator
   - Save progress if user exits early

