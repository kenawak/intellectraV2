# Report Artifact Persistence Service

## Overview

The Report Persistence Service manages the creation, storage, and retrieval of generated market analysis reports for Intellectra. It ensures paid users can access their full report history with secure user-specific data isolation.

## Architecture

### Database Schema

The service uses a PostgreSQL table `report` with the following structure:

```sql
CREATE TABLE "report" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "query" text NOT NULL,
  "market_specialization" text,
  "report_content" text NOT NULL,
  "results_count" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
```

### Pathing Structure

The service implements a conceptual pathing structure for user data isolation:

```
/artifacts/{appId}/users/{userId}/reports/{reportId}
```

**Implementation:**
- User isolation: Enforced via `userId` foreign key constraint
- Report identification: Unique `reportId` (UUID) per report
- Security: All queries filter by `userId` to ensure users can only access their own reports

## Service Functions

### `saveReport(artifact: ReportArtifactInput)`

Persists a complete Report Artifact to the database.

**Parameters:**
```typescript
interface ReportArtifactInput {
  userId: string;
  query: string;
  marketSpecialization?: string | null;
  reportContent: string;
  resultsCount?: number;
}
```

**Returns:**
```typescript
{
  reportId: string;
  success: boolean;
}
```

**Usage:**
```typescript
import { saveReport } from '@/lib/report-persistence-service';

const result = await saveReport({
  userId: 'user-123',
  query: 'AI-powered developer tools',
  marketSpecialization: 'Fullstack',
  reportContent: '# Market Analysis Report...',
  resultsCount: 6,
});

console.log(result.reportId); // UUID of saved report
```

**Validation:**
- `userId` must be non-empty string
- `query` must be non-empty string
- `reportContent` must be non-empty string
- `reportId` is auto-generated (UUID)

### `fetchReportsByUserId(userId: string)`

Retrieves all saved reports for a given user, sorted by creation date (most recent first).

**Parameters:**
- `userId: string` - The ID of the user whose reports to retrieve

**Returns:**
```typescript
ReportArtifactSummary[]
```

**Usage:**
```typescript
import { fetchReportsByUserId } from '@/lib/report-persistence-service';

const reports = await fetchReportsByUserId('user-123');

reports.forEach(report => {
  console.log(report.reportId);
  console.log(report.query);
  console.log(report.preview); // First 200 characters
});
```

**Features:**
- Returns summaries with preview (first 200 characters)
- Sorted by `createdAt` descending (newest first)
- Only returns reports belonging to the specified user

### `fetchReportById(userId: string, reportId: string)`

Retrieves the complete content of a specific report artifact.

**Parameters:**
- `userId: string` - The ID of the user requesting the report
- `reportId: string` - The unique identifier of the report

**Returns:**
```typescript
ReportArtifact
```

**Usage:**
```typescript
import { fetchReportById } from '@/lib/report-persistence-service';

const report = await fetchReportById('user-123', 'report-uuid');

console.log(report.reportContent); // Full markdown content
```

**Security:**
- Verifies user ownership before returning report
- Throws error if report not found or user doesn't have access

### `deleteReportById(userId: string, reportId: string)`

Deletes a specific report artifact (optional utility function).

**Parameters:**
- `userId: string` - The ID of the user requesting deletion
- `reportId: string` - The unique identifier of the report

**Returns:**
```typescript
{ success: boolean }
```

**Security:**
- Verifies user ownership before deletion
- Throws error if report not found or user doesn't have access

## API Integration

### Automatic Persistence

Reports are automatically saved when generated via `/api/reports/generate`:

```typescript
POST /api/reports/generate
{
  "query": "market opportunity"
}

Response:
{
  "success": true,
  "report": "# Markdown content...",
  "reportId": "uuid-here",  // Automatically saved
  "resultsCount": 6
}
```

### Fetching Reports

**List all reports:**
```typescript
GET /api/reports

Response:
{
  "success": true,
  "reports": [
    {
      "reportId": "uuid",
      "query": "market opportunity",
      "marketSpecialization": "Fullstack",
      "preview": "Based on comprehensive market analysis...",
      "createdAt": "2025-01-16T10:00:00Z"
    }
  ],
  "count": 1
}
```

**Get specific report:**
```typescript
GET /api/reports/[id]

Response:
{
  "success": true,
  "report": {
    "reportId": "uuid",
    "userId": "user-123",
    "query": "market opportunity",
    "reportContent": "# Full markdown content...",
    "createdAt": "2025-01-16T10:00:00Z"
  }
}
```

**Delete report:**
```typescript
DELETE /api/reports/[id]

Response:
{
  "success": true,
  "message": "Report deleted successfully"
}
```

## Data Types

### ReportArtifact

Complete report artifact with all fields:

```typescript
interface ReportArtifact {
  reportId: string;
  userId: string;
  query: string;
  marketSpecialization: string | null;
  reportContent: string;
  resultsCount?: number;
  createdAt: Date;
}
```

### ReportArtifactSummary

Lightweight representation for list views:

```typescript
interface ReportArtifactSummary {
  reportId: string;
  userId: string;
  query: string;
  marketSpecialization: string | null;
  resultsCount: number | null;
  createdAt: Date;
  preview?: string; // First 200 characters
}
```

## Security Considerations

1. **User Isolation**: All queries filter by `userId` to ensure users can only access their own reports
2. **Ownership Verification**: `fetchReportById` and `deleteReportById` verify user ownership before operations
3. **Foreign Key Constraints**: `userId` references `user.id` with `ON DELETE CASCADE` for data integrity
4. **Authentication**: API endpoints require authentication via session

## Performance

- **Single Query Optimization**: `fetchReportsByUserId` uses a single query to fetch all data including previews
- **Indexing**: Consider adding index on `(user_id, created_at)` for faster queries
- **Pagination**: For large report collections, consider adding pagination support

## Migration

To add the `report` table to your database:

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

Or manually:

```sql
CREATE TABLE "report" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "query" text NOT NULL,
  "market_specialization" text,
  "report_content" text NOT NULL,
  "results_count" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "report_user_id_created_at_idx" ON "report"("user_id", "created_at");
```

## Error Handling

All functions throw descriptive errors:

- `userId is required and must be a non-empty string`
- `reportContent is required and must be a non-empty string`
- `Report not found: {reportId}`
- `Access denied: Report does not belong to this user`

## Testing

Example test cases:

```typescript
// Save report
const saved = await saveReport({
  userId: 'test-user',
  query: 'test query',
  reportContent: '# Test Report',
});

// Fetch reports
const reports = await fetchReportsByUserId('test-user');
expect(reports.length).toBe(1);

// Fetch specific report
const report = await fetchReportById('test-user', saved.reportId);
expect(report.query).toBe('test query');

// Delete report
await deleteReportById('test-user', saved.reportId);
```

## Future Enhancements

1. **Pagination**: Add pagination support for large report collections
2. **Search**: Add full-text search within reports
3. **Tags/Categories**: Allow users to tag and categorize reports
4. **Sharing**: Enable sharing reports with team members
5. **Export**: Add export functionality (PDF, Markdown, JSON)
6. **Analytics**: Track report generation and access patterns

