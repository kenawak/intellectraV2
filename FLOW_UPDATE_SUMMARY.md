# User Flow Update Summary

## Changes Made

### 1. Removed Blocking Redirects
- **PlanAcquisitionGuard** is now non-blocking
- No longer redirects to pricing page
- Allows dashboard access regardless of plan status
- Plan reminders handled by `PlanReminder` component

### 2. Standalone Pricing Page
- **Moved** from `/dashboard/pricing` to `/pricing`
- Protected by `AuthGuard` only (not dashboard layout)
- Accessible as standalone route
- Free plan selection redirects to `/onboarding`

### 3. Updated Polar Checkout Flow
- **Success URL** changed from `/dashboard` to `/onboarding`
- After successful checkout → User lands on `/onboarding`
- `/onboarding` page verifies plan/paid status before allowing onboarding

### 4. Dashboard Reminders
- **PlanReminder** component shows if `plan` or `paid` is null
- **OnboardingReminder** component shows if `onboarding_complete = false`
- Both are non-blocking modals
- Users can dismiss and complete later

## New Flow

```
Login/Signup
    ↓
Dashboard (with reminders)
    ├─→ PlanReminder (if plan/paid not set)
    └─→ OnboardingReminder (if onboarding incomplete)
    ↓
User clicks "Select Plan" → /pricing
    ↓
User selects plan (Free or Paid)
    ├─→ Free: Creates profile → /onboarding
    └─→ Paid: Polar checkout → /onboarding (after payment)
    ↓
/onboarding (verifies plan/paid is set)
    ↓
User completes onboarding → /dashboard
```

## Component Updates

### PlanAcquisitionGuard
- **Before:** Blocking redirect to pricing
- **After:** Non-blocking, allows dashboard access
- Only logs plan status for debugging

### PlanReminder
- **New Component:** Non-blocking modal
- Shows on dashboard if plan/paid not set
- "Select Plan" → `/pricing`
- "Later" → Dismisses for session

### OnboardingReminder
- **Updated:** "Complete Now" redirects to `/onboarding` (not inline flow)
- Still non-blocking
- Can be dismissed

### DashboardLayout
- Includes both `PlanReminder` and `OnboardingReminder`
- No blocking redirects
- Always allows dashboard access

### OnboardingPage
- **Added:** Plan status verification
- Redirects to `/pricing` if plan/paid not set
- Ensures Polar state is set before onboarding

## Routes

- `/pricing` - Standalone pricing page (protected)
- `/onboarding` - Onboarding flow (protected, requires plan/paid)
- `/dashboard` - Main dashboard (protected, shows reminders)

## API Endpoints

- `GET /api/user/profile` - Returns plan, paid, onboarding status
- `POST /api/user/init-free-profile` - Initializes free tier profile
- `POST /api/onboarding/complete` - Completes onboarding
- `GET /api/onboarding/status` - Checks onboarding status

## Testing Checklist

- [x] Login → Dashboard loads (no redirect)
- [x] Dashboard shows PlanReminder if plan not set
- [x] Dashboard shows OnboardingReminder if onboarding incomplete
- [x] Click "Select Plan" → Goes to `/pricing`
- [x] Free plan selection → Creates profile → Redirects to `/onboarding`
- [x] Paid plan checkout → Polar redirects to `/onboarding`
- [x] `/onboarding` verifies plan status before allowing onboarding
- [x] After onboarding → Redirects to `/dashboard`
- [x] Reminders can be dismissed
- [x] No black screen issues

## Key Improvements

1. **No Blocking Redirects:** Dashboard always accessible
2. **Standalone Pricing:** Not part of dashboard layout
3. **Clear Flow:** Login → Dashboard → Pricing → Onboarding → Dashboard
4. **Reminders:** Non-intrusive, can be dismissed
5. **Safety Checks:** Onboarding page verifies plan status

