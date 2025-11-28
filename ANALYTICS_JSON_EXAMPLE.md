# Feature Analytics JSON Response Example

This document shows the structure of the comprehensive analytics response from `/api/analytics/features`.

## Example Response

```json
{
  "success": true,
  "period": {
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-31T23:59:59.999Z"
  },
  "overall": {
    "totalActions": 1247,
    "totalTokens": 245893,
    "successfulActions": 1189
  },
  "features": [
    {
      "feature": "bookmark",
      "summary": {
        "totalActions": 342,
        "successfulActions": 338,
        "failedActions": 3,
        "rateLimitedActions": 1,
        "successRate": "98.83"
      },
      "tokens": {
        "total": 0,
        "average": "0.00",
        "input": 0,
        "output": 0
      },
      "performance": {
        "averageDurationMs": "45.23"
      },
      "actionsBreakdown": [
        {
          "action": "create",
          "count": 312
        },
        {
          "action": "delete",
          "count": 30
        }
      ],
      "recentActivity": [
        {
          "id": "abc123-def456-ghi789",
          "action": "create",
          "status": "success",
          "tokensUsed": 0,
          "timestamp": "2025-01-31T14:23:45.123Z",
          "metadata": {
            "ideaId": "idea-xyz-123",
            "title": "AI-Powered Code Review Tool",
            "sourceUrl": "https://example.com/idea"
          }
        },
        {
          "id": "jkl012-mno345-pqr678",
          "action": "delete",
          "status": "success",
          "tokensUsed": 0,
          "timestamp": "2025-01-31T13:15:22.456Z",
          "metadata": {
            "sourceUrl": "https://example.com/idea",
            "title": "Old Idea"
          }
        }
      ]
    },
    {
      "feature": "idea-validator",
      "summary": {
        "totalActions": 189,
        "successfulActions": 175,
        "failedActions": 12,
        "rateLimitedActions": 2,
        "successRate": "92.59"
      },
      "tokens": {
        "total": 45678,
        "average": "241.68",
        "input": 12345,
        "output": 33333
      },
      "performance": {
        "averageDurationMs": "3421.56"
      },
      "actionsBreakdown": [
        {
          "action": "validate",
          "count": 189
        }
      ],
      "recentActivity": [
        {
          "id": "stu901-vwx234-yza567",
          "action": "validate",
          "status": "success",
          "tokensUsed": 523,
          "timestamp": "2025-01-31T15:30:12.789Z",
          "metadata": {
            "ideaLength": 156,
            "marketSpecialization": "Fullstack",
            "hasLinks": true,
            "linksCount": 8
          }
        },
        {
          "id": "bcd890-efg123-hij456",
          "action": "validate",
          "status": "error",
          "tokensUsed": 0,
          "timestamp": "2025-01-31T14:45:33.012Z",
          "metadata": {
            "error": "API key not configured"
          }
        }
      ]
    },
    {
      "feature": "market-opportunities",
      "summary": {
        "totalActions": 267,
        "successfulActions": 251,
        "failedActions": 14,
        "rateLimitedActions": 2,
        "successRate": "94.01"
      },
      "tokens": {
        "total": 123456,
        "average": "462.57",
        "input": 45678,
        "output": 77778
      },
      "performance": {
        "averageDurationMs": "15234.89"
      },
      "actionsBreakdown": [
        {
          "action": "generate",
          "count": 267
        }
      ],
      "recentActivity": [
        {
          "id": "klm789-nop012-qrs345",
          "action": "generate",
          "status": "success",
          "tokensUsed": 892,
          "timestamp": "2025-01-31T16:12:45.234Z",
          "metadata": {
            "query": "AI tools for developers",
            "resultsCount": 12,
            "marketSpecialization": "Software Development",
            "reportId": "report-abc-123",
            "hasFullAccess": true
          }
        },
        {
          "id": "tuv678-wxy901-zab234",
          "action": "generate",
          "status": "rate_limited",
          "tokensUsed": 0,
          "timestamp": "2025-01-31T12:30:15.567Z",
          "metadata": {
            "reason": "token_limit",
            "attempts": 5,
            "tokensUsed": 95000,
            "tokenLimit": 100000
          }
        }
      ]
    },
    {
      "feature": "new-project",
      "summary": {
        "totalActions": 449,
        "successfulActions": 425,
        "failedActions": 18,
        "rateLimitedActions": 6,
        "successRate": "94.65"
      },
      "tokens": {
        "total": 76759,
        "average": "170.96",
        "input": 23456,
        "output": 53303
      },
      "performance": {
        "averageDurationMs": "8934.12"
      },
      "actionsBreakdown": [
        {
          "action": "generate",
          "count": 449
        }
      ],
      "recentActivity": [
        {
          "id": "cde567-fgh890-ijk123",
          "action": "generate",
          "status": "success",
          "tokensUsed": 234,
          "timestamp": "2025-01-31T17:45:30.890Z",
          "metadata": {
            "prompt": "developer tool pain points",
            "provider": "exa",
            "sites": ["reddit.com", "x.com", "indiehackers.com"],
            "numResults": 5,
            "ideasGenerated": 5
          }
        },
        {
          "id": "lmn456-opq789-rst012",
          "action": "generate",
          "status": "error",
          "tokensUsed": 0,
          "timestamp": "2025-01-31T11:20:45.123Z",
          "metadata": {
            "error": "Search provider unavailable"
          }
        }
      ]
    }
  ]
}
```

## Response Structure

### Top Level
- `success`: Boolean indicating if the request was successful
- `period`: Object with `startDate` and `endDate` (ISO strings or null)
- `overall`: Aggregate statistics across all features
- `features`: Array of feature-specific analytics

### Overall Statistics
- `totalActions`: Total number of actions across all features
- `totalTokens`: Total tokens consumed across all features
- `successfulActions`: Total successful actions

### Feature Object Structure
Each feature object contains:

1. **feature**: Feature name (`bookmark`, `idea-validator`, `market-opportunities`, `new-project`)

2. **summary**: High-level metrics
   - `totalActions`: Total actions for this feature
   - `successfulActions`: Number of successful actions
   - `failedActions`: Number of failed actions
   - `rateLimitedActions`: Number of rate-limited actions
   - `successRate`: Success rate as percentage string (e.g., "94.65")

3. **tokens**: Token usage statistics
   - `total`: Total tokens used
   - `average`: Average tokens per action
   - `input`: Total input tokens
   - `output`: Total output tokens

4. **performance**: Performance metrics
   - `averageDurationMs`: Average duration in milliseconds

5. **actionsBreakdown**: Array of action types with counts
   - `action`: Action type (create, delete, generate, validate, etc.)
   - `count`: Number of times this action was performed

6. **recentActivity**: Array of the 10 most recent actions
   - `id`: Unique analytics record ID
   - `action`: Action type
   - `status`: success, error, or rate_limited
   - `tokensUsed`: Tokens consumed for this action
   - `timestamp`: ISO timestamp
   - `metadata`: Additional context (varies by feature/action)

## Query Parameters

- `userId`: Filter by specific user (admin only)
- `startDate`: ISO date string for start of period
- `endDate`: ISO date string for end of period
- `feature`: Filter by specific feature (`bookmark`, `idea-validator`, `market-opportunities`, `new-project`)

## Usage Example

```typescript
// Get all analytics for current user
const response = await fetch('/api/analytics/features');

// Get analytics for last 30 days
const response = await fetch('/api/analytics/features?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z');

// Get analytics for specific feature
const response = await fetch('/api/analytics/features?feature=idea-validator');

// Admin: Get analytics for specific user
const response = await fetch('/api/analytics/features?userId=user-123');
```

