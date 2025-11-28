import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { unifiedSearch, SearchResult } from './unified-search-service';

/**
 * Idea Validation Result Interface
 */
export interface IdeaValidationResult {
  quickSummary: {
    clarifiedIdea: string;
    coreProblem: string;
  };
  platformRecommendation: {
    recommended: string[];
    reasoning: string;
  };
  marketValidation: {
    makesSense: boolean;
    demandLevel: 'low' | 'medium' | 'high';
    targetCustomers: string[];
    painPoints: string[];
  };
  competitiveAnalysis: {
    competitors: Array<{
      name: string;
      url: string;
      description: string;
      differentiation: string;
    }>;
  };
  profitability: {
    monetizationRoutes: string[];
    marketSize: string;
    technicalComplexity: 'low' | 'medium' | 'high';
    soloFounderFeasible: boolean;
  };
  executionRoadmap: {
    mvp: string[];
    keyFeatures: string[];
    futureFeatures: string[];
  };
  strengths: string[];
  redFlags: string[];
  assumptions: string[];
  links: Array<{
    title: string;
    url: string;
    source: string;
  }>;
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
function parseJsonResponse(text: string): IdeaValidationResult {
  // Remove markdown code blocks if present
  let cleanedText = text.trim();
  
  // Remove ```json or ``` markers
  cleanedText = cleanedText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
  
  // Try to find JSON object in the text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleanedText);
    return parsed as IdeaValidationResult;
  } catch (error) {
    console.error('❌ Failed to parse JSON response:', error);
    console.error('Raw response text:', text.substring(0, 500));
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Builds system instruction for idea validation
 */
function buildSystemInstruction(): string {
  return `You are INTELLECTRA Idea Validator, an AI expert trained to validate startup and product ideas using real-world information, backed by link-based evidence.

**Your Role:**
Analyze the user's idea conversationally and produce a comprehensive evaluation with structured sections.

**Critical Guidelines:**
1. Be confident and specific - never give generic or vague content
2. Base all analysis on the provided search results and links
3. Provide actionable, evidence-backed insights
4. Structure your response as valid JSON matching the IdeaValidationResult interface
5. Extract competitor information from the search results
6. Include all relevant links from the search results in the links section

**Output Format:**
You MUST output ONLY a valid JSON object matching this structure:
{
  "quickSummary": {
    "clarifiedIdea": "Clean, clarified version of the idea",
    "coreProblem": "The core user problem being solved"
  },
  "platformRecommendation": {
    "recommended": ["Web App", "Mobile App"],
    "reasoning": "Detailed reasoning based on target users, convenience, frequency, and capabilities"
  },
  "marketValidation": {
    "makesSense": true,
    "demandLevel": "high",
    "targetCustomers": ["Customer segment 1", "Customer segment 2"],
    "painPoints": ["Pain point 1", "Pain point 2"]
  },
  "competitiveAnalysis": {
    "competitors": [
      {
        "name": "Competitor Name",
        "url": "https://competitor.com",
        "description": "What they do",
        "differentiation": "How user's idea is different"
      }
    ]
  },
  "profitability": {
    "monetizationRoutes": ["Subscription", "Usage-based"],
    "marketSize": "Assessment of market size",
    "technicalComplexity": "medium",
    "soloFounderFeasible": true
  },
  "executionRoadmap": {
    "mvp": ["Feature 1", "Feature 2"],
    "keyFeatures": ["Feature 3", "Feature 4"],
    "futureFeatures": ["Feature 5", "Feature 6"]
  },
  "strengths": ["Strength 1", "Strength 2"],
  "redFlags": ["Risk 1", "Risk 2"],
  "assumptions": ["Assumption 1", "Assumption 2"],
  "links": [
    {
      "title": "Article Title",
      "url": "https://example.com",
      "source": "Exa"
    }
  ]
}`;
}

/**
 * Builds user query with idea and search results
 */
function buildUserQuery(idea: string, searchResults: SearchResult[]): string {
  const snippets = searchResults
    .map((result, index) => {
      return `[Source ${index + 1}: ${result.source?.toUpperCase() || 'UNKNOWN'}]
Title: ${result.title}
URL: ${result.url}
Content: ${result.text_snippet}
---`;
    })
    .join('\n\n');

  return `Analyze and validate this product idea: "${idea}"

**Search Results & Evidence:**
${snippets}

**Your Task:**
Provide a comprehensive validation of this idea using the search results above. Extract competitor information, market signals, and relevant links from the provided data.

**Requirements:**
1. **Quick Idea Summary**: Clarify the idea and identify the core problem
2. **Platform Recommendation**: Recommend Web App, Mobile App, Desktop App, or Multiplatform with reasoning
3. **Market Validation**: Assess if it makes sense today, demand level, target customers, and pain points
4. **Competitive Analysis**: Extract competitors from search results with names, URLs, descriptions, and differentiation
5. **Profitability & Feasibility**: Suggest monetization, assess market size, technical complexity, and solo founder feasibility
6. **Execution Roadmap**: Define MVP features, key features, and future features
7. **Strengths & Red Flags**: List what makes it strong and what could make it fail
8. **Assumptions**: List key assumptions that must be validated
9. **Links Section**: Include 5-12 high-quality links from the search results, formatted with title, URL, and source

**Important:**
- Output ONLY the JSON object, no other text
- Base all analysis on the provided search results
- Extract competitor URLs and information from the search results
- Be specific and evidence-backed, not generic
- Include all relevant links from search results in the links array`;
}

/**
 * Validates a product idea using search results and LLM analysis
 * 
 * @param idea - The product idea to validate
 * @param marketSpecialization - Optional market specialization for context
 * @returns Structured validation result
 */
export async function validateIdea(
  idea: string,
  marketSpecialization?: string
): Promise<IdeaValidationResult> {
  const MAX_RETRIES = 5;
  const INITIAL_BACKOFF_MS = 1000;

  // Validate inputs
  if (!idea || idea.trim().length === 0) {
    throw new Error('Idea is required');
  }

  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  // Initialize Gemini client
  const gemini = new GoogleGenAI({ apiKey });

  // Step 1: Run unified search to gather evidence
  console.log(`🔍 Searching for validation data for idea: "${idea}"`);
  const searchResults = await unifiedSearch(idea, marketSpecialization);
  
  if (searchResults.length === 0) {
    throw new Error('No search results found for idea validation');
  }

  console.log(`✅ Found ${searchResults.length} search results for validation`);

  // Step 2: Build prompts
  const systemInstruction = buildSystemInstruction();
  const userQuery = buildUserQuery(idea, searchResults);

  // Step 3: Generate validation with retry logic
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Generating idea validation (Attempt ${attempt + 1}/${MAX_RETRIES})...`);

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
      const validation = parseJsonResponse(responseText);
      
      console.log(`✅ Idea validation generated successfully`);
      return validation;

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
      const isJsonError = apiError.message?.includes('parse JSON') || apiError.message?.includes('not a JSON');

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
      console.error(`❌ Idea validation failed after ${attempt + 1} attempts:`, error);
      throw new Error(
        `Failed to validate idea: ${apiError.message || 'Unknown error'} ` +
        `(Status: ${apiError.status || 'N/A'})`
      );
    }
  }

  // Should never reach here, but TypeScript requires it
  throw new Error('Idea validation failed after all retry attempts');
}

