# Unified Search and Deep Report Generation Service

## Overview

The unified search service combines multiple data sources (Exa and LinkUp) and generates comprehensive market analysis reports using LLM synthesis. This service is designed to be technology-agnostic and ready for production integration.

## Service File

**Location:** `lib/unified-search-service.ts`

## Core Functions

### 1. `unifiedSearch(query: string, marketSpecialization?: string): Promise<SearchResult[]>`

Combines search results from multiple providers in parallel, deduplicates by URL, and prioritizes LinkUp results.

**Parameters:**
- `query`: Search query string
- `marketSpecialization`: Optional user specialization (e.g., 'Fullstack')

**Returns:** Array of deduplicated search results

**Example:**
```typescript
import { unifiedSearch } from '@/lib/unified-search-service';

const results = await unifiedSearch(
  'developer productivity tools',
  'Fullstack'
);

console.log(`Found ${results.length} unique results`);
```

### 2. `generateReport(query: string, marketSpecialization: string | undefined, combinedResults: SearchResult[]): Promise<string>`

Generates a comprehensive markdown report using Gemini LLM, contextualized by user's specialization.

**Parameters:**
- `query`: Original search query
- `marketSpecialization`: User's specialization (optional)
- `combinedResults`: Results from `unifiedSearch`

**Returns:** Markdown-formatted report string

**Example:**
```typescript
import { unifiedSearch, generateReport } from '@/lib/unified-search-service';

// Step 1: Get search results
const results = await unifiedSearch('API management tools', 'Fullstack');

// Step 2: Generate report
const report = await generateReport(
  'API management tools',
  'Fullstack',
  results
);

console.log(report);
```

## API Integration

### Example API Route

**Location:** `app/api/reports/generate/route.ts`

**Usage:**
```bash
POST /api/reports/generate
Content-Type: application/json

{
  "query": "developer productivity tools"
}
```

**Response:**
```json
{
  "success": true,
  "report": "# Executive Summary\n\n...",
  "resultsCount": 7,
  "specialization": "Fullstack"
}
```

## Report Structure

The generated report follows this Markdown structure:

1. **Executive Summary** (2-3 sentences)
   - Quick overview of market viability

2. **Key Trends & Signals** (3-5 bullet points)
   - Emerging topics
   - Job demand indicators
   - Competitive signals

3. **Competitive Landscape** (2-3 examples)
   - Potential competitors
   - Existing solutions

4. **Market Recommendation**
   - Viability assessment for Indie Hackers
   - Specialization-specific insights

## Specialization Context

The service automatically injects user's market specialization into the LLM system instruction, ensuring all analysis is filtered through the specialization lens.

**Example System Instruction:**
```
You are a highly specialized Market Analyst for Intellectra.

**Primary Expertise:**
Your analysis must be filtered through the lens of Fullstack specialization. 
You understand the unique challenges, opportunities, and market dynamics 
specific to Fullstack professionals.
...
```

## Error Handling

The service includes robust error handling:

- **Retry Logic**: Exponential backoff for API failures (5 retries max)
- **Validation**: Input validation for query and results
- **Error Messages**: Clear, actionable error messages

**Retry Strategy:**
- Initial delay: 1 second
- Exponential backoff: 1s → 2s → 4s → 8s → 16s
- Retries on: 503, 429, 500, network errors

## Mock Data Sources

### Exa Search Mock
- **Type**: Broad, general web results
- **Content**: Articles, blogs, general information
- **Results**: 4 mock results per query

### LinkUp Search Mock
- **Type**: Specialized, niche data
- **Content**: Job postings, business formations, trend reports
- **Results**: 4 mock results per query

## Environment Variables

Required:
```bash
GEMINI_API_KEY=your_api_key_here
```

## Testing

### Unit Test Example

```typescript
import { unifiedSearch, generateReport } from '@/lib/unified-search-service';

describe('Unified Search Service', () => {
  it('should combine and deduplicate results', async () => {
    const results = await unifiedSearch('test query');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.title && r.url && r.text_snippet)).toBe(true);
  });

  it('should generate report with specialization context', async () => {
    const results = await unifiedSearch('test query', 'Fullstack');
    const report = await generateReport('test query', 'Fullstack', results);
    expect(report).toContain('Executive Summary');
    expect(report).toContain('Fullstack');
  });
});
```

## Production Integration

### Replacing Mocks with Real APIs

1. **Exa Integration:**
   ```typescript
   // Replace exaSearch function
   import { Exa } from "exa-js";
   const exa = new Exa(process.env.EXASEARCH_API_KEY);
   
   async function exaSearch(query: string): Promise<SearchResult[]> {
     const { results } = await exa.searchAndContents(query, {
       text: true,
       numResults: 5,
     });
     return results.map(r => ({
       title: r.title || '',
       url: r.url,
       text_snippet: r.text || '',
       source: 'exa',
     }));
   }
   ```

2. **LinkUp Integration:**
   ```typescript
   // Replace linkUpSearch function
   async function linkUpSearch(query: string): Promise<SearchResult[]> {
     const response = await fetch('https://api.linkup.com/search', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.LINKUP_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({ query }),
     });
     const data = await response.json();
     return data.results.map(r => ({
       title: r.title,
       url: r.url,
       text_snippet: r.snippet,
       source: 'linkup',
     }));
   }
   ```

## Performance Considerations

- **Parallel Execution**: Both searches run simultaneously
- **Deduplication**: O(n) complexity using Map
- **Caching**: Consider caching reports for identical queries
- **Rate Limiting**: Implement rate limiting for production use

## Next Steps

1. ✅ Service implementation complete
2. ✅ API route example created
3. ⏳ Replace mocks with real API integrations
4. ⏳ Add caching layer
5. ⏳ Implement rate limiting
6. ⏳ Add report storage/persistence
7. ⏳ Create UI for report viewing

