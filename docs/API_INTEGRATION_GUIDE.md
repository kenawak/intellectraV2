# API Integration Guide - Unified Search Service

## Overview

The Unified Search Service has been updated to use live API integrations for both Exa and LinkUp search providers, replacing the previous mock implementations.

## Environment Variables

### Required Variables

Add these to your `.env` file:

```bash
# Exa API Configuration
EXASEARCH_API_KEY=your_exa_api_key_here
# Alternative: EXA_API_KEY (both are supported)

# LinkUp API Configuration
LINKUP_API_KEY=your_linkup_api_key_here
LINKUP_API_URL=https://api.linkup.com/v1/search  # Optional, defaults to this URL
```

### Getting API Keys

1. **Exa API Key**
   - Sign up at [exa.ai](https://exa.ai)
   - Navigate to API settings
   - Generate an API key
   - Add to `.env` as `EXASEARCH_API_KEY`

2. **LinkUp API Key**
   - Sign up at LinkUp (contact LinkUp for API access)
   - Obtain API key from dashboard
   - Add to `.env` as `LINKUP_API_KEY`

## API Integration Details

### Exa Search Integration

**Endpoint:** `https://api.exa.ai/search`

**Authentication:** 
- Header: `x-api-key: {EXASEARCH_API_KEY}`

**Request Format:**
```json
{
  "query": "search query",
  "num_results": 5,
  "text": true,
  "contents": {
    "text": {
      "max_characters": 500
    }
  },
  "use_autoprompt": true
}
```

**Response Mapping:**
- `result.title` → `title`
- `result.url` → `url`
- `result.text` → `text_snippet` (first 500 chars)

**Error Handling:**
- Validates API key presence
- Handles HTTP errors with descriptive messages
- Extracts error details from JSON responses
- Falls back gracefully in unified search

### LinkUp Search Integration

**Endpoint:** `https://api.linkup.com/v1/search` (configurable via `LINKUP_API_URL`)

**Authentication:**
- Header: `Authorization: Bearer {LINKUP_API_KEY}`

**Request Format:**
```json
{
  "query": "search query",
  "limit": 5,
  "include_content": true
}
```

**Response Mapping:**
The service attempts multiple field names to handle different API response formats:
- Title: `result.title` || `result.headline`
- URL: `result.url` || `result.link` || `result.source_url`
- Content: `result.content` || `result.description` || `result.snippet` || `result.text`

**Error Handling:**
- Validates API key presence
- Handles HTTP errors with descriptive messages
- Extracts error details from JSON responses
- Falls back gracefully in unified search

## Unified Search Behavior

### Parallel Execution
Both search providers are called in parallel using `Promise.allSettled()` to minimize latency.

### Error Resilience
- If one provider fails, the other provider's results are still returned
- Only throws an error if both providers fail
- Logs warnings for individual provider failures

### Deduplication
- Results are deduplicated by URL
- LinkUp results take priority over Exa results for duplicate URLs
- Ensures unique results in the final output

## Error Handling

### Missing API Keys
```typescript
// Exa
Error: EXASEARCH_API_KEY or EXA_API_KEY is not configured in environment variables

// LinkUp
Error: LINKUP_API_KEY is not configured in environment variables
```

### API Errors
```typescript
// Exa
Error: Exa search failed: Exa API error: 401 Unauthorized

// LinkUp
Error: LinkUp search failed: LinkUp API error: 403 Forbidden
```

### Partial Failures
If one provider fails:
- Warning logged: `⚠️ Exa search failed: {error}`
- Service continues with results from the other provider
- No error thrown unless both providers fail

### Complete Failure
If both providers fail:
```typescript
Error: Unified search failed: Both providers failed. Exa: {error}; LinkUp: {error}
```

## Testing

### Test with Mock Data
To test without API keys, you can temporarily use mock data by modifying the functions.

### Test with Real APIs
1. Ensure API keys are set in `.env`
2. Call `unifiedSearch("test query")`
3. Check logs for success/failure messages
4. Verify results are returned in correct format

### Example Usage
```typescript
import { unifiedSearch } from '@/lib/unified-search-service';

try {
  const results = await unifiedSearch(
    "AI-powered developer tools",
    "Fullstack"
  );
  
  console.log(`Found ${results.length} results`);
  results.forEach(result => {
    console.log(`- ${result.title} (${result.source})`);
  });
} catch (error) {
  console.error('Search failed:', error);
}
```

## Response Format

Both APIs return results in the `SearchResult` format:

```typescript
interface SearchResult {
  title: string;
  url: string;
  text_snippet: string;
  source?: 'exa' | 'linkup';
}
```

## Performance Considerations

1. **Parallel Execution**: Both searches run simultaneously, reducing total latency
2. **Timeout Handling**: Consider adding request timeouts for production
3. **Rate Limiting**: Be aware of API rate limits for both providers
4. **Caching**: Consider implementing result caching for repeated queries

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** regularly
4. **Monitor API usage** for unusual activity
5. **Validate inputs** before sending to APIs

## Troubleshooting

### Issue: "API key not configured"
**Solution:** Ensure `.env` file contains the required keys and is loaded properly.

### Issue: "401 Unauthorized"
**Solution:** Verify API key is correct and has not expired.

### Issue: "403 Forbidden"
**Solution:** Check API key permissions and account status.

### Issue: "Network timeout"
**Solution:** Check network connectivity and API endpoint availability.

### Issue: "No results returned"
**Solution:** 
- Verify query is valid
- Check if both providers are failing
- Review API response format matches expected structure

## Migration Notes

### From Mock to Live
- No code changes required in calling code
- Same function signatures maintained
- Error handling improved
- Performance may vary based on API response times

### Backward Compatibility
- Service maintains same interface
- Existing code continues to work
- Only internal implementation changed

## Next Steps

1. **Add API keys** to production environment
2. **Test with real queries** to verify response formats
3. **Monitor error rates** and adjust error handling if needed
4. **Implement rate limiting** if required by API providers
5. **Add request timeouts** for production reliability
6. **Consider caching** for frequently searched queries

