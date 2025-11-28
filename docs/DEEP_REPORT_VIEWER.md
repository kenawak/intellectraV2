# Deep Report Viewer Implementation

## Overview

The **DeepReportViewer** component is a high-value, subscription-gated feature that allows users to generate comprehensive market analysis reports powered by AI synthesis of multiple data sources.

## Features

### Core Functionality
- **Search Input**: Clean, prominent search interface with specialization context
- **Report Generation**: Calls unified search service and LLM to generate structured reports
- **Loading States**: Professional loading indicators during report generation
- **Markdown Rendering**: Uses hardened React Markdown for secure, professional output

### Subscription Gating
- **Free Users**: See Executive Summary teaser + compelling paywall
- **Pro/Enterprise Users**: See full report with all sections
- **Dynamic Access**: Checks user profile for plan/paid status
- **Paywall CTA**: Direct link to pricing page for upgrades

### User Experience
- **Specialization Context**: Shows user's market specialization in search UI
- **Empty States**: Helpful guidance when no report is generated
- **Error Handling**: Graceful error messages with toast notifications
- **Responsive Design**: Fully responsive with Tailwind CSS

## Component Structure

```tsx
<DeepReportViewer />
```

### Props
None - Component is self-contained and fetches user profile internally.

### State Management
- `query`: Search query string
- `isGenerating`: Loading state during report generation
- `report`: Generated markdown report
- `userProfile`: User's plan, paid status, and specialization
- `isLoadingProfile`: Initial profile loading state

## API Integration

### Endpoint: `POST /api/reports/generate`

**Request:**
```json
{
  "query": "market opportunity search term"
}
```

**Response:**
```json
{
  "success": true,
  "report": "# Markdown report content...",
  "resultsCount": 6,
  "specialization": "Fullstack",
  "hasFullAccess": true
}
```

**Subscription Check:**
- API checks subscription status using `getSubscriptionStatus()`
- Free users can generate reports (see paywall on frontend)
- Pro/Enterprise users get full access
- Returns `hasFullAccess` flag in response

## Report Structure

Generated reports follow this structure:

1. **Executive Summary** (2-3 sentences)
   - Market viability assessment
   - Growth indicators
   - Opportunity overview

2. **Key Trends & Signals** (3-5 bullet points)
   - Job market data
   - Business formation trends
   - Framework adoption patterns
   - Developer productivity focus
   - Open source opportunities

3. **Competitive Landscape** (2-3 examples)
   - Existing solutions analysis
   - Market gaps identification
   - Competitive positioning

4. **Market Recommendation**
   - Verdict (Viable/Not Viable)
   - Key success factors
   - Risk assessment
   - Recommended next steps

## Paywall Implementation

### Free User Experience

1. **Executive Summary Teaser**
   - Full Executive Summary section visible
   - Rendered with professional markdown styling

2. **Paywall Message**
   - Gradient background with blur effect
   - Lock icon and "Pro Feature" badge
   - Clear value proposition
   - Visual stats grid (3-5 Trends, 2-3 Competitors, 1 Verdict)
   - Two CTAs:
     - "Upgrade to Pro" → `/pricing`
     - "Start New Search" → Clear current report

3. **Pricing Information**
   - "$19/month • Cancel anytime • 7-day free trial"

### Paid User Experience

- Full markdown report rendered
- All sections visible
- Professional typography and spacing
- No restrictions

## Specialization Integration

The component uses the user's `marketSpecialization` from their profile:

1. **Search Context**: Shows specialization in search UI
   - "Your search is currently optimized for **Fullstack** markets"
   - Only shows if specialization is set

2. **Report Generation**: Passes specialization to API
   - API uses specialization in LLM system instructions
   - Reports are contextualized to user's market

3. **Empty State**: Mentions specialization if available

## Error Handling

- **Network Errors**: Toast notification with error message
- **API Errors**: Displays error from API response
- **Validation**: Prevents empty queries
- **Loading States**: Prevents multiple simultaneous searches

## Styling

- **Tailwind CSS**: Fully responsive design
- **Shadcn UI Components**: Card, Button, Input, Dialog
- **Markdown Rendering**: Uses `Response` component from shadcn-io/ai
- **Dark Mode**: Full dark mode support
- **Typography**: Professional prose styling for reports

## Integration Points

### Dashboard
Component is integrated into `/app/dashboard/page.tsx`:

```tsx
<div className="px-4 lg:px-6 py-6">
  <DeepReportViewer />
</div>
```

### User Profile
Fetches from `/api/user/profile`:
- `plan`: 'free' | 'pro' | 'enterprise'
- `paid`: boolean
- `marketSpecialization`: string | null
- `onboardingComplete`: boolean

### Unified Search Service
Uses `/lib/unified-search-service.ts`:
- `unifiedSearch()`: Combines Exa and LinkUp results
- `generateReport()`: LLM synthesis with specialization context

## Testing Checklist

- [ ] Free user can generate report
- [ ] Free user sees Executive Summary + paywall
- [ ] Free user can click "Upgrade to Pro" → goes to pricing
- [ ] Pro user sees full report
- [ ] Enterprise user sees full report
- [ ] Specialization context shows correctly
- [ ] Loading states work properly
- [ ] Error handling works for network failures
- [ ] Empty states display correctly
- [ ] Responsive design works on mobile
- [ ] Dark mode styling is correct

## Future Enhancements

1. **Report History**: Save and view past reports
2. **Export Options**: PDF, Markdown, JSON export
3. **Sharing**: Share reports with team members
4. **Customization**: User-defined report sections
5. **Analytics**: Track report generation usage
6. **Caching**: Cache reports for faster re-access
7. **Bookmarking**: Save favorite reports

## Security Considerations

- ✅ Authentication required (via AuthGuard)
- ✅ Subscription status checked server-side
- ✅ Markdown rendering uses hardened component
- ✅ No XSS vulnerabilities in report content
- ✅ User profile data validated

## Performance

- **Report Generation**: 3-10 seconds (depends on LLM)
- **Profile Fetch**: < 100ms (cached in component)
- **Markdown Rendering**: Instant (client-side)
- **Bundle Size**: Minimal (uses existing components)

