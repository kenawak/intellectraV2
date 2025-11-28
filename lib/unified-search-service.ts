import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { LinkupClient } from 'linkup-sdk';

/**
 * Unified Search and Deep Report Generation Service
 * 
 * This service combines multiple search data sources and generates
 * comprehensive market analysis reports using LLM synthesis.
 */

// ============================================================================
// 1. DATA SOURCE MOCKING (Technology-Agnostic)
// ============================================================================

export interface SearchResult {
  title: string;
  url: string;
  text_snippet: string;
  source?: 'exa' | 'linkup';
}

/**
 * Exa Search Integration
 * 
 * Connects to the Exa API to retrieve broad, general web indexing results
 * (articles, blogs, general information).
 * 
 * @param query - The search query string
 * @returns Array of SearchResult objects from Exa
 * @throws Error if API key is missing or API call fails
 */
async function exaSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.EXASEARCH_API_KEY || process.env.EXA_API_KEY;
  
  if (!apiKey) {
    throw new Error('EXASEARCH_API_KEY or EXA_API_KEY is not configured in environment variables');
  }

  try {
    // Exa API endpoint for search with content
    const apiUrl = 'https://api.exa.ai/search';
    
    const requestBody = {
      query: query,
      num_results: 5,
      text: true, // Request text content
      contents: {
        text: {
          max_characters: 500, // Limit text snippet length
        },
      },
      use_autoprompt: true, // Let Exa optimize the query
      depth: "standard", // Use standard depth for comprehensive results
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey, // Exa uses x-api-key header
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Exa API error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        // If error response is not JSON, use the text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Map Exa API response to SearchResult format
    const results: SearchResult[] = (data.results || []).map((result: Record<string, unknown>) => {
      // Extract text snippet from content
      const textValue = typeof result.text === 'string' ? result.text : '';
      const snippetValue = typeof result.snippet === 'string' ? result.snippet : '';
      const textSnippet = textValue 
        ? textValue.substring(0, 500).trim()
        : snippetValue;

      return {
        title: typeof result.title === 'string' ? result.title : 'Untitled',
        url: typeof result.url === 'string' ? result.url : '',
        text_snippet: textSnippet || 'No content available',
        source: 'exa' as const,
      };
    });

    console.log(`✅ Exa search completed: ${results.length} results for query "${query}"`);
    
    return results;
  } catch (error) {
    console.error('❌ Exa search error:', error);
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Exa search failed: ${error.message}`);
    }
    
    throw new Error('Exa search failed: Unknown error');
  }
}

/**
 * LinkUp Search Integration
 * 
 * Connects to the LinkUp API using the official SDK to retrieve highly focused data
 * on niche job postings, new business formations, or detailed trend reports.
 * 
 * @param query - The search query string
 * @returns Array of SearchResult objects from LinkUp
 * @throws Error if API key is missing or API call fails
 */
async function linkUpSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.LINKUP_API_KEY;
  
  if (!apiKey) {
    throw new Error('LINKUP_API_KEY is not configured in environment variables');
  }

  try {
    // Initialize LinkUp client with API key
    const client = new LinkupClient({ apiKey: apiKey || "" });

    // Call LinkUp search API using the SDK
    const response = await client.search({
      query: query,
      depth: "deep",
      outputType: "sourcedAnswer",
      includeImages: false,
    });
    console.log("response from linup", response);
    // Handle empty or undefined response
    if (!response) {
      console.warn(`⚠️ LinkUp API returned empty response for query "${query}"`);
      return [];
    }

    // Map LinkUp SDK response to SearchResult format
    // LinkUp returns { answer: string, sources: Array<{name, snippet, url}> }
    let results: SearchResult[] = [];

    if (response && typeof response === 'object') {
      const anyResponse = response as Record<string, unknown>;
      
      // Check if response has 'sources' array (the actual structure from LinkUp)
      if (anyResponse.sources && Array.isArray(anyResponse.sources)) {
        results = anyResponse.sources.map((source: Record<string, unknown>) => {
          const snippetValue = typeof source.snippet === 'string' ? source.snippet : '';
          return {
            title: typeof source.name === 'string' ? source.name : 'Untitled',
            url: typeof source.url === 'string' ? source.url : '',
            text_snippet: snippetValue.substring(0, 500).trim() || 'No content available',
            source: 'linkup' as const,
          };
        });
      } else if (Array.isArray(response)) {
        // If response is directly an array
        results = response.map((result: Record<string, unknown>) => {
          const textSnippet = typeof result.content === 'string' ? result.content
            : typeof result.description === 'string' ? result.description
            : typeof result.snippet === 'string' ? result.snippet
            : typeof result.text === 'string' ? result.text
            : typeof result.summary === 'string' ? result.summary
            : '';

          const title = typeof result.title === 'string' ? result.title
            : typeof result.headline === 'string' ? result.headline
            : typeof result.name === 'string' ? result.name
            : 'Untitled';

          const url = typeof result.url === 'string' ? result.url
            : typeof result.link === 'string' ? result.link
            : typeof result.source_url === 'string' ? result.source_url
            : typeof result.sourceUrl === 'string' ? result.sourceUrl
            : '';

          return {
            title,
            url,
            text_snippet: textSnippet ? textSnippet.substring(0, 500).trim() : 'No content available',
            source: 'linkup' as const,
          };
        });
      } else if (anyResponse.results && Array.isArray(anyResponse.results)) {
        // If response has a results array
        results = anyResponse.results.map((result: Record<string, unknown>) => {
          const textSnippet = typeof result.content === 'string' ? result.content
            : typeof result.description === 'string' ? result.description
            : typeof result.snippet === 'string' ? result.snippet
            : typeof result.text === 'string' ? result.text
            : typeof result.summary === 'string' ? result.summary
            : '';

          const title = typeof result.title === 'string' ? result.title
            : typeof result.headline === 'string' ? result.headline
            : typeof result.name === 'string' ? result.name
            : 'Untitled';

          const url = typeof result.url === 'string' ? result.url
            : typeof result.link === 'string' ? result.link
            : typeof result.source_url === 'string' ? result.source_url
            : typeof result.sourceUrl === 'string' ? result.sourceUrl
            : '';

          return {
            title,
            url,
            text_snippet: textSnippet ? textSnippet.substring(0, 500).trim() : 'No content available',
            source: 'linkup' as const,
          };
        });
      } else {
        // Unknown structure - log for debugging
        console.warn(`⚠️ LinkUp API returned unexpected response structure for query "${query}"`);
        console.warn(`⚠️ Response type: ${typeof response}, keys: ${response && typeof response === 'object' ? Object.keys(response).join(', ') : 'null'}`);
      }
    }

    // Limit to 5 results to match expected behavior
    const limitedResults = results.slice(0, 5);

    console.log(`✅ LinkUp search completed: ${limitedResults.length} results for query "${query}"`);
    
    return limitedResults;
  } catch (error) {
    console.error('❌ LinkUp search error:', error);
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`LinkUp search failed: ${error.message}`);
    }
    
    throw new Error('LinkUp search failed: Unknown error');
  }
}

// ============================================================================
// 2. UNIFIED SEARCH SERVICE
// ============================================================================

/**
 * Unified Search Service
 * 
 * Combines results from multiple search providers, running them in parallel
 * and deduplicating based on URL (prioritizing LinkUp data for duplicates).
 * 
 * Implements robust error handling: if one provider fails, the other provider's
 * results are still returned to ensure partial functionality.
 * 
 * @param query - The search query string
 * @param marketSpecialization - Optional user's market specialization (e.g., 'Fullstack')
 * @returns Combined and deduplicated search results
 */
export async function unifiedSearch(
  query: string,
  _marketSpecialization?: string
): Promise<SearchResult[]> {
  // Validate query
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Query is required and must be a non-empty string');
  }

  // Run both searches in parallel to minimize latency
  // Use Promise.allSettled to handle partial failures gracefully
  const [exaSettlement, linkUpSettlement] = await Promise.allSettled([
    exaSearch(query),
    linkUpSearch(query),
  ]);

  // Extract results from settlements, handling failures gracefully
  let exaResults: SearchResult[] = [];
  let linkUpResults: SearchResult[] = [];

  if (exaSettlement.status === 'fulfilled') {
    exaResults = exaSettlement.value;
  } else {
    console.error('⚠️ Exa search failed:', exaSettlement.reason);
    // Continue with LinkUp results only
  }

  if (linkUpSettlement.status === 'fulfilled') {
    linkUpResults = linkUpSettlement.value;
  } else {
    console.error('⚠️ LinkUp search failed:', linkUpSettlement.reason);
    // Continue with Exa results only
  }

  // If both providers failed, throw an error
  if (exaResults.length === 0 && linkUpResults.length === 0) {
    const errors = [
      exaSettlement.status === 'rejected' ? `Exa: ${exaSettlement.reason}` : null,
      linkUpSettlement.status === 'rejected' ? `LinkUp: ${linkUpSettlement.reason}` : null,
    ].filter(Boolean);
    
    throw new Error(
      `Unified search failed: Both providers failed. ${errors.join('; ')}`
    );
  }

  // Create a Map for deduplication, using URL as the key
  // LinkUp results are added first to prioritize them in case of duplicates
  const resultsMap = new Map<string, SearchResult>();

  // Add LinkUp results first (higher priority for duplicates)
  for (const result of linkUpResults) {
    if (result.url) {
      resultsMap.set(result.url, result);
    }
  }

  // Add Exa results, skipping duplicates
  for (const result of exaResults) {
    if (result.url && !resultsMap.has(result.url)) {
      resultsMap.set(result.url, result);
    }
  }

  // Convert Map values back to array
  const combinedResults = Array.from(resultsMap.values());

  console.log(
    `✅ Unified search completed: ${combinedResults.length} unique results ` +
    `(${exaResults.length} Exa + ${linkUpResults.length} LinkUp)`
  );

  return combinedResults;
}

// ============================================================================
// 3. DEEP REPORT GENERATOR
// ============================================================================

/**
 * Product Idea Interface
 */
export interface ProductIdea {
  title: string;
  niche: string;
  pain_point: string;
  monetization_strategy: string; // Can contain 2 options separated by " + " or " OR "
  market_proof?: string; // 1-sentence market validation
  viability_score: number;
  core_features: string[];
}

/**
 * Builds a specialized system instruction for the LLM as a Product Idea Generator
 */
function buildSystemInstruction(marketSpecialization?: string): string {
  const baseInstruction = `You are a Product Idea Generator and Revenue Analyst for Intellectra.

**Your Primary Role:**
You analyze market data and search results to identify highly viable, product-centric opportunities that can generate $100+ MRR (Monthly Recurring Revenue). Your focus is on WHAT to build and WHY it will generate revenue, NOT on implementation details.

**Critical Guidelines:**
1. IGNORE implementation details: Do NOT mention specific frameworks, databases, programming languages, or technical stack choices
2. FOCUS on product features, user pain points, and monetization strategies
3. EXTRACT evidence of high revenue signals or strong trend indicators from the search snippets
4. IDENTIFY distinct product opportunities (4-6 unique ideas spanning 3+ different sub-sectors)
5. CALCULATE viability scores (1-10) based on revenue signals and competitive landscape
6. ENSURE each product idea is ready for immediate card-based display
7. DIVERSITY: Generate ideas across multiple sub-sectors (e.g., for "ai trends": DevOps, Sales, Consumer, Healthcare, etc.)
8. VALIDATION: Include 1-sentence market proof with concrete numbers (e.g., "$15B agentic AI market by 2027")
9. QUANTIFY: Pain points MUST include specific metrics (e.g., "40% build failures in cross-platform teams")
10. MONETIZATION: Provide 2 realistic monetization options per idea (e.g., "Usage-based $0.10/build-min + $99/mo base" OR "Per-seat $29/user/month + $500 setup fee")

**Output Format:**
You MUST output ONLY a valid JSON array. No narrative text, no markdown, no explanations. Just the JSON array.`;

  if (!marketSpecialization) {
    return `${baseInstruction}

**Market Context:**
Focus on opportunities suitable for indie hackers and product builders across all markets.`;
  }

  // Clean specialization name (remove underscores, capitalize properly)
  const cleanSpecialization = marketSpecialization.replace(/_/g, ' ');

  return `${baseInstruction}

**Market Specialization Context:**
Your analysis must be filtered through the lens of ${cleanSpecialization} specialization. 
- Consider the unique needs and constraints of ${cleanSpecialization} professionals
- Focus on product ideas that align with ${cleanSpecialization} market dynamics
- Ensure opportunities are suitable for entrepreneurs in the ${cleanSpecialization} space
- DO NOT mention specific technologies, but DO consider the specialization's characteristics (e.g., cross-platform needs, velocity requirements, etc.)`;
}

/**
 * Constructs the user query with all search result snippets, demanding JSON output
 */
function buildUserQuery(query: string, combinedResults: SearchResult[], marketSpecialization?: string): string {
  const snippets = combinedResults
    .map((result, index) => {
      return `[Source ${index + 1}: ${result.source?.toUpperCase() || 'UNKNOWN'}]
Title: ${result.title}
URL: ${result.url}
Content: ${result.text_snippet}
---`;
    })
    .join('\n\n');

  const specializationContext = marketSpecialization 
    ? ` The user's market specialization is: ${marketSpecialization.replace(/_/g, ' ')}. Ensure product ideas are suitable for entrepreneurs in this space.`
    : '';

  return `Analyze the following search results for the query: "${query}"${specializationContext}

${snippets}

**Your Task:**
Extract evidence of high revenue signals, strong trend indicators, and viable product opportunities from the search snippets above.

**Output Requirements:**
You MUST output ONLY a valid JSON array containing 4-6 distinct product ideas spanning 3+ different sub-sectors. Each idea must be a JSON object with the following exact structure:

{
  "title": "Concise, catchy product name/concept (e.g., 'Agentic CI/CD Optimization & Self-Healing Bot')",
  "niche": "The specific micro-niche user (e.g., 'DevOps and CI/CD Managers in Cross-Platform Enterprises')",
  "pain_point": "The single, high-value problem with QUANTIFIED METRICS (e.g., '40% of build pipeline failures require manual intervention across diverse target environments, costing teams 15+ hours/week.')",
  "monetization_strategy": "TWO realistic monetization options separated by ' OR ' (e.g., 'Usage-based subscription at $0.10/build-minute + $99/mo base OR Per-seat $49/user/month with volume discounts')",
  "market_proof": "One sentence with concrete market validation numbers (e.g., 'Agentic AI market projected to reach $15B by 2027 with 45% CAGR.')",
  "viability_score": 8,
  "core_features": [
    "Feature 1 that solves the pain point.",
    "Feature 2 that drives daily retention/habit loop."
  ]
}

**CRITICAL REQUIREMENTS:**
- Generate 4-6 ideas (not 3-5)
- Span at least 3 different sub-sectors (e.g., DevOps, Sales, Consumer, Healthcare, Finance, etc.)
- Every pain_point MUST include specific metrics/percentages/numbers
- Every monetization_strategy MUST include 2 options separated by " OR "
- Every idea MUST include market_proof with concrete numbers (market size, growth rate, etc.)

**Viability Score Calculation (1-10):**
- 8-10: Strong revenue signals, low competition, clear monetization path
- 5-7: Moderate signals, some competition, viable with execution
- 1-4: Weak signals, high competition, or unclear monetization

**Important:**
- Output ONLY the JSON array, no other text
- Ensure all JSON is valid and parseable
- Base viability scores on actual evidence from the snippets
- Each product idea must be distinct and actionable
- Focus on WHAT to build, not HOW to build it`;
}

/**
 * Utility function for exponential backoff retry
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parses JSON from LLM response, handling markdown code blocks and extra text
 */
function parseJsonResponse(text: string): ProductIdea[] {
  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  
  // Remove ```json or ``` markers
  cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  
  // Try to find JSON array in the text
  const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleanedText);
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not a JSON array');
    }
    
    // Validate each item has required fields
    const validated = parsed.map((item: Record<string, unknown>, index: number) => {
      if (!item.title || !item.niche || !item.pain_point || !item.monetization_strategy) {
        throw new Error(`Product idea at index ${index} is missing required fields`);
      }
      
      return {
        title: String(item.title),
        niche: String(item.niche),
        pain_point: String(item.pain_point),
        monetization_strategy: String(item.monetization_strategy),
        market_proof: item.market_proof ? String(item.market_proof) : undefined,
        viability_score: typeof item.viability_score === 'number' 
          ? Math.max(1, Math.min(10, Math.round(item.viability_score))) 
          : 5,
        core_features: Array.isArray(item.core_features) 
          ? item.core_features.map((f: unknown) => String(f))
          : [],
      } as ProductIdea;
    });
    
    return validated;
  } catch (error) {
    console.error('❌ Failed to parse JSON response:', error);
    console.error('Raw response text:', text.substring(0, 500));
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Product-Centric Report Generator
 * 
 * Generates a structured JSON array of viable product ideas using LLM synthesis
 * of combined search results, contextualized by user's market specialization.
 * 
 * @param query - The original search query
 * @param marketSpecialization - User's market specialization (e.g., 'Fullstack')
 * @param combinedResults - Combined search results from unifiedSearch
 * @returns JSON string containing array of ProductIdea objects
 */
export async function generateReport(
  query: string,
  marketSpecialization: string | undefined,
  combinedResults: SearchResult[]
): Promise<string> {
  const MAX_RETRIES = 5;
  const INITIAL_BACKOFF_MS = 1000; // Start with 1 second

  // Validate inputs
  if (!query || query.trim().length === 0) {
    throw new Error('Query is required');
  }

  if (!combinedResults || combinedResults.length === 0) {
    throw new Error('Combined results array is required and cannot be empty');
  }

  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  // Initialize Gemini client
  const gemini = new GoogleGenAI({ apiKey });

  // Build system instruction with specialization context
  const systemInstruction = buildSystemInstruction(marketSpecialization);

  // Build user query with all search snippets
  const userQuery = buildUserQuery(query, combinedResults, marketSpecialization);

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating product ideas (Attempt ${attempt + 1}/${MAX_RETRIES})...`);

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash-preview-09-2025",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\n${userQuery}`,
              },
            ],
          },
        ],
      });

      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('No response text from Gemini API');
      }

      // Parse and validate JSON response
      const productIdeas = parseJsonResponse(responseText);
      
      // Ensure we have 4-6 ideas
      if (productIdeas.length < 4) {
        throw new Error(`Only ${productIdeas.length} product ideas generated, need at least 4`);
      }
      
      // Limit to 6 ideas
      const limitedIdeas = productIdeas.slice(0, 6);
      
      // Convert back to JSON string for storage
      const jsonString = JSON.stringify(limitedIdeas, null, 2);

      console.log(`✅ Generated ${limitedIdeas.length} product ideas successfully`);
      return jsonString;

    } catch (error: unknown) {
      // Check if it's a retryable error (503, 429, or network errors)
      const apiError = error as { status?: number; code?: string; message?: string };
      const isRetryable = 
        apiError.status === 503 || 
        apiError.status === 429 || 
        apiError.status === 500 ||
        apiError.code === 'ECONNRESET' ||
        apiError.code === 'ETIMEDOUT';

      // Check if it's a JSON parsing error (don't retry, but log)
      const isJsonError = apiError.message?.includes('parse JSON') || apiError.message?.includes('not a JSON array');

      if (isJsonError) {
        console.error(`❌ JSON parsing error (not retrying):`, apiError.message);
        throw error;
      }

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        // Calculate exponential backoff: 1s, 2s, 4s, 8s, 16s
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(
          `⚠️ Attempt ${attempt + 1} failed with ${apiError.status || apiError.code}. ` +
          `Retrying in ${backoffTime / 1000}s...`
        );
        await delay(backoffTime);
        continue;
      }

      // If not retryable or last attempt, throw the error
      console.error(`❌ Report generation failed after ${attempt + 1} attempts:`, error);
      throw new Error(
        `Failed to generate report: ${apiError.message || 'Unknown error'} ` +
        `(Status: ${apiError.status || 'N/A'})`
      );
    }
  }

  // Should never reach here, but TypeScript requires it
  throw new Error('Report generation failed after all retry attempts');
}

// ============================================================================
// EXPORTS
// ============================================================================

// Note: exaSearch and linkUpSearch are not exported as they are internal functions
// Use unifiedSearch() for production use

