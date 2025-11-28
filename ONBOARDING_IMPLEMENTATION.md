# Onboarding System Implementation Guide

## Overview

The Intellectra onboarding system captures user market specialization through a hierarchical selection process, enabling personalized AI-generated insights and reports.

## Architecture

### Components

1. **Database Schema** (`db/schema.ts`)
   - `marketSpecialization`: Clean, readable specialization name
   - `specializationPath`: Array of strings representing the full hierarchy path
   - `onboardingComplete`: Boolean flag indicating completion status

2. **Onboarding Flow Component** (`components/onboarding-flow.tsx`)
   - Hierarchical selection UI
   - Navigation through market tree
   - Leaf node selection and completion

3. **Onboarding Guard** (`components/onboarding-guard.tsx`)
   - Checks onboarding status
   - Redirects to onboarding if incomplete
   - Wraps protected dashboard content

4. **API Endpoints** (`app/api/onboarding/complete/route.ts`)
   - `POST /api/onboarding/complete`: Save onboarding data
   - `GET /api/onboarding/status`: Check onboarding status

## Setup Instructions

### 1. Database Migration

Run the migration to add the new fields:

```bash
# If using drizzle-kit
npx drizzle-kit generate
npx drizzle-kit migrate

# Or manually run the SQL
psql $DATABASE_URL -f migrations/0016_onboarding_fields.sql
```

### 2. Verify Schema

The `userprofile` table should now include:
- `market_specialization` (text, nullable)
- `specialization_path` (text[], default: [])
- `onboarding_complete` (boolean, default: false, NOT NULL)

### 3. Test Onboarding Flow

1. Create a new user account or use an existing one
2. Navigate to `/dashboard`
3. If `onboarding_complete` is `false`, you'll be redirected to the onboarding flow
4. Select your specialization through the hierarchical tree
5. Complete onboarding
6. Verify data in database:
   ```sql
   SELECT market_specialization, specialization_path, onboarding_complete 
   FROM userprofile 
   WHERE user_id = 'your-user-id';
   ```

## User Flow

### First-Time User Journey

1. **Sign Up / Login** → User authenticates
2. **Dashboard Access** → `OnboardingGuard` checks status
3. **Onboarding Redirect** → If incomplete, shows `OnboardingFlow`
4. **Selection Process**:
   - User selects top-level domain (Physical/Digital/Services)
   - Navigates through categories
   - Selects specific specialization (leaf node)
5. **Completion** → Data saved, `onboarding_complete = true`
6. **Dashboard Access** → User can now access full dashboard

### Returning User Journey

1. **Login** → User authenticates
2. **Dashboard Access** → `OnboardingGuard` checks status
3. **Direct Access** → If `onboarding_complete = true`, proceed to dashboard

## Integration with LLM Intelligence Engine

The specialization data is used to contextualize AI-generated content. See `docs/ONBOARDING_LLM_INTEGRATION.md` for detailed implementation examples.

### Quick Example

```typescript
// Fetch user specialization
const profile = await db
  .select({ specializationPath: userprofile.specializationPath })
  .from(userprofile)
  .where(eq(userprofile.userId, userId))
  .limit(1);

// Build specialized system instruction
const systemInstruction = buildSpecializedSystemInstruction(
  profile[0]?.specializationPath || []
);

// Use in LLM prompt
const prompt = `${systemInstruction}\n\nAnalyze: ${searchResults}`;
```

## API Reference

### POST /api/onboarding/complete

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

### GET /api/onboarding/status

**Response:**
```json
{
  "onboardingComplete": true,
  "marketSpecialization": "Fullstack",
  "specializationPath": ["Digital", "Software_Development", "Web_Development", "Fullstack"]
}
```

## Customization

### Adding New Market Categories

Edit `market.json` to add new categories, subcategories, or specializations. The onboarding flow will automatically reflect these changes.

### Modifying Onboarding UI

The `OnboardingFlow` component can be customized:
- Change card styling in `components/onboarding-flow.tsx`
- Modify navigation behavior
- Add additional steps before/after specialization selection

### Updating LLM Integration

Modify the system instruction builder in your LLM integration code. See `docs/ONBOARDING_LLM_INTEGRATION.md` for examples.

## Troubleshooting

### Onboarding Not Triggering

1. Check that `onboarding_complete` is `false` or `NULL` in database
2. Verify `OnboardingGuard` is wrapping dashboard content
3. Check browser console for API errors

### Data Not Saving

1. Verify API endpoint is accessible: `/api/onboarding/complete`
2. Check authentication is working
3. Verify database migration ran successfully
4. Check server logs for errors

### Specialization Path Issues

1. Ensure `specialization_path` is stored as text array in PostgreSQL
2. Verify path matches structure in `market.json`
3. Check that leaf nodes are properly detected

## Next Steps

1. ✅ Database schema updated
2. ✅ Onboarding flow component created
3. ✅ API endpoints implemented
4. ✅ Guard component added
5. ⏳ Integrate with deep search report generation
6. ⏳ Integrate with idea generation
7. ⏳ Add specialization-based filtering

## Support

For questions or issues, refer to:
- `docs/ONBOARDING_LLM_INTEGRATION.md` - LLM integration examples
- `components/onboarding-flow.tsx` - Component implementation
- `app/api/onboarding/complete/route.ts` - API implementation

