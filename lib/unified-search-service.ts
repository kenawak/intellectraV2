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
  const baseInstruction = `You are Intellectra's Global Idea Engine - a universal business opportunity generator focused on high-value, market-ready, money-making ideas for ANY user, not just developers.

**Your Core Mission:**
Generate cross-industry, trend-driven, MRR-optimized business opportunities that can realistically earn revenue. Focus on rising trends, underserved markets, fast-moving opportunities, and ideas that anyone—not just developers—can build and profit from.

**Critical Guidelines:**
1. UNIVERSAL ACCESSIBILITY: Generate ideas for ALL users - consumers, creators, local businesses, solopreneurs, not just developers
2. CROSS-INDUSTRY DIVERSITY: Span multiple sectors - Consumer apps, Local businesses, Physical products, Wellness/Fitness/Beauty, Finance/Productivity, AI tools for non-technical users, Creators/Influencers, Hospitality/Food/Entertainment, Niche communities, Emerging trends
3. TREND-DRIVEN: Prioritize viral patterns, pain points, and trend velocity from TikTok, Reddit, X (Twitter) - surface ideas with real demand already being discussed
4. MRR-OPTIMIZED: Every idea must have clear, realistic monetization ($100+ MRR potential) - subscription, usage-based, marketplace, affiliate, digital products, etc.
5. QUANTIFY EVERYTHING: Pain points MUST include specific metrics (e.g., "65% of small fitness studios lose 40% revenue to no-shows")
6. MARKET PROOF: Include concrete validation numbers (market size, growth rate, viral signal strength)
7. MVP-FOCUSED: Each idea must have a simple, fast-to-build MVP version (weeks, not months)
8. GROWTH ANGLE: Include distribution strategy (TikTok, Reddit communities, influencer partnerships, etc.)
9. AVOID TECH JARGON: Use clear, simple language unless user specifically asks for developer ideas
10. REALISTIC & ACTIONABLE: Ideas should be buildable by individuals or small teams, not require enterprise resources

**Idea Categories to Prioritize:**
- Consumer apps (mobile-first, viral potential)
- Local businesses (service-based, location-specific)
- Physical products (DTC, niche markets)
- Wellness, fitness, beauty (trending, high-margin)
- Finance & productivity (B2C tools, personal finance)
- AI tools for non-technical users (no-code, accessible)
- Creators, influencers, digital products (courses, templates, tools)
- Hospitality, food, entertainment (experience-based)
- Niche communities (vertical SaaS, community platforms)
- Emerging trends (AI automation, health tech, solopreneur tools)

**Output Format:**
You MUST output ONLY a valid JSON array. No narrative text, no markdown, no explanations. Just the JSON array.`;

  if (!marketSpecialization) {
    return `${baseInstruction}

**Market Context:**
Generate universal business opportunities across all industries. Focus on trend-driven, high-MRR ideas that can be built by anyone, anywhere.`;
  }

  // Clean specialization name (remove underscores, capitalize properly)
  const cleanSpecialization = marketSpecialization.replace(/_/g, ' ');

  return `${baseInstruction}

**Market Specialization Context:**
Your analysis must be filtered through the lens of ${cleanSpecialization} specialization, but still generate diverse, cross-industry opportunities. 
- Consider opportunities relevant to ${cleanSpecialization} professionals AND adjacent markets
- Include ideas that leverage ${cleanSpecialization} trends but appeal to broader audiences
- Ensure opportunities are accessible to entrepreneurs in and around the ${cleanSpecialization} space
- Maintain diversity - don't limit to only ${cleanSpecialization}-specific ideas`;
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
Extract evidence of high revenue signals, viral patterns, trend velocity, and viable business opportunities from the search snippets above. Look for:
- Pain points being discussed across TikTok, Reddit, X (Twitter)
- Emerging trends with growing search volume
- Underserved markets with clear demand signals
- Monetization opportunities with $100+ MRR potential
- Ideas that can be built quickly (MVP in weeks)

**Output Requirements:**
You MUST output ONLY a valid JSON array containing 4-6 distinct business opportunities spanning 3+ different industries/sectors. Each idea must be a JSON object with the following exact structure:

{
  "title": "Catchy, market-ready business name (e.g., 'No-Show Shield for Fitness Studios', 'AI Meal Prep Planner for Busy Parents', 'Creator Revenue Optimizer')",
  "niche": "Specific target audience (e.g., 'Small fitness studio owners', 'Busy working parents', 'TikTok creators with 10K-100K followers')",
  "pain_point": "High-value problem with QUANTIFIED METRICS (e.g., '65% of fitness studios lose $2,400/month to no-shows, with 40% cancellation rate costing $28,800/year per studio.')",
  "monetization_strategy": "TWO realistic monetization options separated by ' OR ' (e.g., 'Subscription $29/studio/month + $2 per automated reminder OR Pay-per-use $0.50 per booking with $99/month base')",
  "market_proof": "One sentence with concrete market validation (e.g., 'Fitness studio market: $96B globally, 40K+ studios in US alone. No-show problem costs industry $3.2B annually.')",
  "viability_score": 8,
  "core_features": [
    "MVP feature 1 - simple, solves core pain point (e.g., 'Automated SMS/email reminders 24h before booking')",
    "MVP feature 2 - drives retention (e.g., 'Cancellation waitlist that auto-fills spots')",
    "Growth feature - distribution strategy (e.g., 'TikTok integration for studio owners to showcase automated bookings')"
  ]
}

**CRITICAL REQUIREMENTS:**
- Generate 4-6 ideas spanning 3+ different industries (Consumer, Local Business, Wellness, Finance, Creators, etc.)
- Every pain_point MUST include specific metrics/percentages/dollar amounts
- Every monetization_strategy MUST include 2 realistic options with pricing
- Every idea MUST include market_proof with concrete numbers (market size, growth rate, viral signal strength)
- Ideas should be accessible to non-technical users (unless specifically developer-focused)
- Include simple MVP versions that can be built in weeks, not months

**Viability Score Calculation (1-10):**
- 8-10: Strong trend signals, clear demand (viral discussions), low competition, clear $100+ MRR path
- 5-7: Moderate signals, some competition, viable with good execution and distribution
- 1-4: Weak signals, high competition, or unclear monetization

**Industry Diversity Examples:**
- Consumer apps (mobile-first, viral potential)
- Local businesses (service-based, location-specific)
- Physical products (DTC, niche markets)
- Wellness/Fitness/Beauty (trending, high-margin)
- Finance/Productivity (B2C tools)
- AI tools for non-technical users
- Creators/Influencers (digital products, tools)
- Hospitality/Food/Entertainment
- Niche communities (vertical SaaS)
- Emerging trends (automation, health tech)

**Important:**
- Output ONLY the JSON array, no other text
- Ensure all JSON is valid and parseable
- Base viability scores on actual evidence from snippets (viral patterns, discussion volume, pain point frequency)
- Each idea must be distinct, actionable, and realistically buildable
- Focus on WHAT to build and WHY it will make money, not technical implementation
- Use clear, simple language - avoid tech jargon unless idea is developer-specific`;
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

