# Social Login Fix - unable_to_create_user Error

## Problem
The `unable_to_create_user` error occurred when users tried to sign in with Google OAuth. This was caused by:

1. **Missing `mapProfileToUser` function** - Google profile data wasn't being properly mapped to user fields
2. **Schema mismatch** - `auth-schema.ts` was missing the `banned` field that exists in `db/schema.ts`
3. **Name field handling** - The `name` field is required but Google might not always provide it

## Solution Implemented

### 1. Added `mapProfileToUser` to Google OAuth
**File**: `lib/auth.ts`

Added proper profile mapping to ensure all required fields are populated:
- `name`: Falls back through multiple options (name → given_name → family_name → email prefix → 'User')
- `email`: Required field from Google profile
- `image`: Profile picture from Google
- `emailVerified`: Set to true for Google accounts

### 2. Updated Auth Schema
**File**: `auth-schema.ts`

Added `banned` field to match `db/schema.ts`:
```typescript
banned: boolean("banned").default(false),
```

### 3. Type Safety
Added proper TypeScript types for the `mapProfileToUser` function to prevent runtime errors.

## Testing

1. **Test Google Sign-In**:
   - Try signing in with Google OAuth
   - Verify user is created successfully
   - Check that name field is populated (even if Google doesn't provide it)

2. **Verify Database**:
   - Check that new users are created in the `user` table
   - Verify `name` field is never null
   - Verify `banned` field exists and defaults to false

## Migration (if needed)

If the `banned` field doesn't exist in your database, run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Or manually add the field:

```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
```

## Files Modified

- `lib/auth.ts` - Added `mapProfileToUser` function
- `auth-schema.ts` - Added `banned` field

## Notes

- The `name` field fallback ensures users can always be created even if Google doesn't provide a name
- Email is required and will fail if Google doesn't provide it (shouldn't happen with Google OAuth)
- The `banned` field is now consistent across both schema files

