import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db/drizzle';
import { bookmarkedIdea, tokenUsage, userprofile, userAnalytics } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { decrypt } from '@/lib/encryption';
import crypto from 'crypto';

// Content type from Google GenAI
type Content = {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
};

// --- Gemini Client Initialization ---
// Will use user's API key if available, otherwise fallback to system key
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Get Gemini client instance - uses user's API key if available, otherwise system key
 */
function getGeminiClient(userApiKey?: string | null): GoogleGenAI {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No Gemini API key available');
  }
  return new GoogleGenAI({ apiKey });
}

// --- Utility Functions for Robust API Calls (Retry Logic) ---

// Helper function to wait for a given duration
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robustly parses JSON from AI response, handling markdown code blocks and malformed JSON
 */
function parseJsonResponse(text: string): { files: Array<{ path: string; content: string }> } {
  // Step 1: Remove markdown code blocks
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Step 2: Try to extract JSON object if there's extra text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Step 3: Fix common JSON issues
  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Step 4: Try parsing
  try {
    return JSON.parse(cleaned);
  } catch (parseError: unknown) {
    // Step 5: If still fails, try a different approach - manually construct valid JSON
    const parseErrorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    console.error('Initial JSON parse failed, attempting manual reconstruction...', parseErrorMessage);
    
    try {
      // Try to extract files array manually - handle cases where content has unescaped newlines
      const filesArrayMatch = cleaned.match(/"files"\s*:\s*\[\s*([\s\S]*)\s*\]/);
      if (filesArrayMatch) {
        const filesContent = filesArrayMatch[1];
        const files: Array<{ path: string; content: string }> = [];
        
        // Split by file object boundaries (looking for "path" followed by "content")
        // This regex finds file objects even with unescaped newlines in content
        const fileObjectRegex = /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)"\s*\}/g;
        let fileMatch;
        
        while ((fileMatch = fileObjectRegex.exec(filesContent)) !== null) {
          let [, path, content] = fileMatch;
          
          // If we have more content after this match, check if it's part of the same string
          // (handles cases where content spans multiple lines with unescaped newlines)
          const matchEnd = fileMatch.index + fileMatch[0].length;
          const nextMatch = fileObjectRegex.exec(filesContent);
          fileObjectRegex.lastIndex = matchEnd; // Reset for next iteration
          
          // Clean up path (remove any escape sequences)
          path = path.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          
          // Clean up content - handle escaped sequences properly
          content = content
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          
          files.push({ path, content });
          
          if (nextMatch) {
            fileObjectRegex.lastIndex = nextMatch.index;
          }
        }
        
        // Alternative approach: try to find path and content separately if the above failed
        if (files.length === 0) {
          const pathRegex = /"path"\s*:\s*"([^"]+)"/g;
          const contentRegex = /"content"\s*:\s*"([\s\S]*?)"\s*[,}]/g;
          
          const pathMatches: Array<RegExpMatchArray> = [];
          const contentMatches: Array<RegExpMatchArray> = [];
          let match;
          
          while ((match = pathRegex.exec(filesContent)) !== null) {
            pathMatches.push(match);
          }
          
          while ((match = contentRegex.exec(filesContent)) !== null) {
            contentMatches.push(match);
          }
          
          if (pathMatches.length > 0 && contentMatches.length > 0 && pathMatches.length === contentMatches.length) {
            for (let i = 0; i < pathMatches.length; i++) {
              const path = pathMatches[i][1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              const content = contentMatches[i][1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
              files.push({ path, content });
            }
          }
        }
        
        if (files.length > 0) {
          console.log(`Successfully reconstructed ${files.length} specification files from malformed JSON`);
          return { files };
        }
      }
    } catch (reconstructionError) {
      console.error('Manual reconstruction also failed:', reconstructionError);
    }
    
    // If all else fails, throw with more context
      const finalErrorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      throw new Error(`Failed to parse JSON response from AI: ${finalErrorMessage}. Response preview: ${cleaned.substring(0, 500)}...`);
  }
}

/**
 * Executes a generateContent call with a retry mechanism for transient 503 errors.
 * Uses a simple exponential backoff strategy (2s, 4s, 8s, etc.).
 */
async function generateContentWithRetry(geminiClient: GoogleGenAI, contents: Content[], maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await geminiClient.models.generateContent({
        model: MODEL_NAME,
        contents: contents
      });
      // Success, return the response
      return response;
    } catch (err: unknown) {
      // Check for a 503 error (ApiError status code 503)
      const apiError = err as { status?: number };
      if (apiError.status === 503 && attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s...
        console.warn(`Attempt ${attempt} failed with 503 UNAVAILABLE. Retrying in ${waitTime / 1000} seconds...`);
        await delay(waitTime); 
        continue; // Go to the next attempt
      }
      
      // For all other errors (like 400, 401, or the last 503 attempt), re-throw
      throw err;
    }
  }
  // Should be unreachable if maxRetries > 0, but good for type safety
  throw new Error('All retry attempts failed to generate content.');
}

// --- Next.js Route Handler ---
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const techStackParam = req.nextUrl.searchParams.get('techStack') || 'Next.js, TypeScript, Tailwind CSS';
    
    // Parse tech stack - can be either JSON object or string
    let techStackString = techStackParam;
    try {
      const techStackObj = JSON.parse(techStackParam);
      // If it's a structured object, format it to string for the AI prompt
      const parts = [
        techStackObj.frontend,
        techStackObj.backend,
        techStackObj.database,
        techStackObj.styling,
      ].filter(Boolean);
      techStackString = parts.join(', ') || techStackParam;
    } catch {
      // Not JSON, use as-is (backward compatible)
      techStackString = techStackParam;
    }
    const techStack = techStackString;

    // --- Check User Profile and API Key ---
    const [userProfile] = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    // Check daily spec generation limit (3 free per day)
    const userAnalytic = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let specGenerationsToday = userAnalytic[0]?.specGenerationsToday || 0;
    let specGenerationsResetDate = userAnalytic[0]?.specGenerationsResetDate;

    // Reset daily count if it's a new day
    if (!specGenerationsResetDate || new Date(specGenerationsResetDate) < today) {
      specGenerationsToday = 0;
      specGenerationsResetDate = today;
    }

    // Decrypt user's API key if available
    let userApiKey: string | null = null;
    if (userProfile?.geminiApiKeyEncrypted && userProfile?.geminiApiKeyIv) {
      try {
        userApiKey = decrypt(userProfile.geminiApiKeyEncrypted, userProfile.geminiApiKeyIv);
      } catch (err) {
        console.error('Failed to decrypt user API key:', err);
      }
    }

    // Validate user's API key if provided (test it works)
    if (userApiKey) {
      try {
        const testGemini = new GoogleGenAI({ apiKey: userApiKey });
        // Quick validation call
        await testGemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: 'test' }]
          }]
        });
      } catch (validateErr: unknown) {
        // If user's API key is invalid, require them to add a valid one
        const validateError = validateErr as { message?: string };
        console.error('User API key validation failed:', validateError?.message || validateErr);
        return NextResponse.json(
          {
            error: 'Invalid API key',
            message: 'Your saved API key is invalid or has expired. Please update it in Settings to use the workspace feature.',
            requiresApiKey: true,
            invalidKey: true,
          },
          { status: 400 }
        );
      }
    }

    // WORKSPACE FEATURE REQUIRES API KEY - No free tier for workspace
    if (!userApiKey) {
      return NextResponse.json(
        {
          error: 'API key required',
          message: 'The workspace feature requires your own Gemini API key. Please add it in Settings to generate project specifications.',
          requiresApiKey: true,
        },
        { status: 403 }
      );
    }

    // Get Gemini client (user's key if available, otherwise system key)
    const gemini = getGeminiClient(userApiKey);

    // --- Rate Limiting Logic ---
    // Handle generation attempts rate limiting
    let attempts = userAnalytic[0]?.generationAttemptsCount || 0;
    let attemptsResetTime = userAnalytic[0]?.generationAttemptsResetTime;
    if (!attemptsResetTime || now > attemptsResetTime) {
      attempts = 0;
      attemptsResetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
    attempts += 1;
    const attemptsRateLimited = attempts > 5;

    // Handle token rate limiting
    let tokensUsed = userAnalytic[0]?.tokensUsedThisHour || 0;
    let tokensResetTime = userAnalytic[0]?.tokensResetTime;
    const tokenLimit = userAnalytic[0]?.tokenLimitPerHour || 100000;
    const estimatedTokens = 10000; // Estimate for spec generation
    if (!tokensResetTime || now > tokensResetTime) {
      tokensUsed = 0;
      tokensResetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
    const tokensRateLimited = tokensUsed + estimatedTokens >= tokenLimit;

    if (attemptsRateLimited || tokensRateLimited) {
      const errorMsg = attemptsRateLimited ? 'Generation attempts rate limit exceeded (5 per hour)' : 'Token rate limit exceeded';
      await db.insert(userAnalytics).values({
        id: crypto.randomUUID(),
        userId,
        route: '/api/ideas/[id]/generate-spec',
        method: 'GET',
        generationAttemptsCount: attempts,
        generationAttemptsResetTime: attemptsResetTime,
        generationAttemptsIsRateLimited: attemptsRateLimited,
        tokensUsedThisHour: tokensUsed,
        tokensResetTime: tokensResetTime,
        isTokenRateLimited: tokensRateLimited,
        tokenLimitPerHour: tokenLimit,
      }).onConflictDoUpdate({
        target: userAnalytics.userId,
        set: {
          generationAttemptsCount: attempts,
          generationAttemptsResetTime: attemptsResetTime,
          generationAttemptsIsRateLimited: attemptsRateLimited,
          tokensUsedThisHour: tokensUsed,
          tokensResetTime: tokensResetTime,
          isTokenRateLimited: tokensRateLimited,
        },
      });
      return NextResponse.json({ error: errorMsg }, { status: 429 });
    }

    // Get the bookmarked idea
    const [ideaData] = await db.select().from(bookmarkedIdea).where(and(eq(bookmarkedIdea.id, id), eq(bookmarkedIdea.userId, userId)));
    if (!ideaData) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if specs are already generated
    if (ideaData.requirements && ideaData.design && ideaData.tasks && ideaData.codeStubs) {
      return NextResponse.json({
        requirements: ideaData.requirements,
        design: ideaData.design,
        tasks: ideaData.tasks,
        codeStubs: ideaData.codeStubs,
      });
    }

    let totalTokens = 0;

    // Phase 1: Requirements (using retry function)
    const requirementsContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Given the idea: ${ideaData.title} - ${ideaData.summary}
          Unmet Needs: ${(ideaData.unmetNeeds || []).join(', ')}
          Product Idea: ${(ideaData.productIdea || []).join(', ')}
          
          Generate a comprehensive requirements document in markdown format that includes:
          
          1. **Overview** - Brief description of what the feature/product will do
          2. **User Stories** - 3-5 detailed user stories following the format:
             - As a [user type], I want [goal] so that [benefit]
             - Include acceptance criteria for each story
             - Include edge cases and error scenarios
          3. **Functional Requirements** - Detailed list of functional requirements
          4. **Non-Functional Requirements** - Performance, security, accessibility, etc.
          5. **Constraints** - Technical or business constraints
          6. **Assumptions** - Any assumptions made about the requirements
          
          Make this document detailed and actionable for developers and AI assistants.
        `
      }]
    }];
    const requirementsRes = await generateContentWithRetry(gemini, requirementsContents);
    const requirementsText = requirementsRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!requirementsText) {
      throw new Error('Failed to generate requirements');
    }
    const requirements = requirementsText.replace(/```markdown|```/g, '');
    totalTokens += requirementsRes.usageMetadata?.totalTokenCount || 0;

    // Phase 2: Design (using retry function)
    const designContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Based on the requirements: ${requirements}
          And tech stack: ${techStack}
          
          Generate a comprehensive design document in markdown that includes:
          
          1. **System Architecture** - High-level architecture overview
          2. **Component Breakdown** - Detailed breakdown of UI components/modules:
             - Component hierarchy
             - Component responsibilities
             - Component dependencies
          3. **API Design** - Detailed API/endpoint specifications:
             - Endpoint URLs and methods
             - Request/response structures
             - Authentication/authorization requirements
             - Error response formats
          4. **Data Models** - Database schema or data structures:
             - Entities and their relationships
             - Field types and constraints
             - Indexes and optimization considerations
          5. **State Management** - How state will be managed (if applicable)
          6. **Integration Points** - External services or APIs to integrate with
          7. **Technology Decisions** - Rationale for key technology choices
          8. **Security Considerations** - Security design and considerations
          
          Make this design document detailed enough for developers or AI assistants to understand the architecture and make implementation decisions.
        `
      }]
    }];
    const designRes = await generateContentWithRetry(gemini, designContents);
    const designText = designRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!designText) {
      throw new Error('Failed to generate design');
    }
    const design = designText.replace(/```markdown|```/g, '');
    totalTokens += designRes.usageMetadata?.totalTokenCount || 0;

    // Phase 3: Tasks (using retry function)
    const tasksContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Given the design: ${design}
          
          Generate a detailed implementation task list in markdown with:
          
          1. **Task Breakdown** - 8-15 actionable, well-defined tasks organized by:
             - Setup/Configuration tasks
             - Backend/API tasks
             - Frontend/UI tasks
             - Integration tasks
             - Testing tasks
             - Deployment tasks
          
          2. **For each task, include:**
             - Task title and description
          - Estimated effort (hours)
             - Priority (High/Medium/Low)
             - Dependencies (which tasks must be completed first)
             - File paths or module names where work will be done
             - Acceptance criteria for the task
             - Notes or considerations
          
          3. **Task Ordering** - Suggest a recommended implementation order
          
          4. **Milestones** - Group tasks into logical milestones or phases
          
          Make tasks specific, actionable, and suitable for developers or AI assistants to implement step by step.
        `
      }]
    }];
    const tasksRes = await generateContentWithRetry(gemini, tasksContents);
    const tasksText = tasksRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!tasksText) {
      throw new Error('Failed to generate tasks');
    }
    const tasks = tasksText.replace(/```markdown|```/g, '');
    totalTokens += tasksRes.usageMetadata?.totalTokenCount || 0;

    // Phase 4: Implementation Specifications (using retry function)
    const specsContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Based on requirements: ${requirements}
          Design: ${design}
          Tasks: ${tasks}
          Tech stack: ${techStack}
          
          Generate detailed implementation specifications as JSON that break down the feature into actionable specs for AI assistants or developers. 
          
          Create specifications for each major component/module that include:
          1. Component/Module Specifications - For each UI component or module:
             - Purpose and responsibility
             - Props/Inputs expected (with types)
             - State management requirements
             - UI/UX behavior and interactions
             - Integration points with other components
             - File location and naming convention
             
          2. API/Function Specifications - For each API endpoint or function:
             - Purpose and HTTP method (if applicable)
             - Request/Response structure (with field types)
             - Validation requirements
             - Error handling requirements
             - Dependencies (database queries, external services)
             - File location and naming convention
             
          3. Data Model Specifications - For each data model/schema:
             - Fields with types and constraints
             - Relationships to other models
             - Validation rules
             - Indexes or optimization needs
             - File location and naming convention
             
          4. Integration Specifications - For integrations:
             - External services/APIs to integrate with
             - Configuration needed
             - Error handling strategy
             - Authentication/Authorization requirements
             
          5. File Structure Specifications - Recommended project structure:
             - Directory organization
             - File naming conventions
             - Import/export patterns
             
          Format as VALID JSON (no markdown code blocks, no trailing commas) with files array where each file is a specification document in markdown:
          { 
            "files": [
              { 
                "path": "specs/component-specs.md", 
                "content": "# Component Specifications\n\n## Component 1: [Name]\n\n### Purpose\n...\n### Props/Inputs\n...\n### Behavior\n...\n### Integration\n..." 
              },
              { 
                "path": "specs/api-specs.md", 
                "content": "# API Specifications\n\n..." 
              },
              { 
                "path": "specs/data-model-specs.md", 
                "content": "# Data Model Specifications\n\n..." 
              },
              { 
                "path": "specs/integration-specs.md", 
                "content": "# Integration Specifications\n\n..." 
              },
              { 
                "path": "specs/file-structure.md", 
                "content": "# File Structure\n\n..." 
              }
            ] 
          }
          
          IMPORTANT: 
          - Return ONLY valid JSON, no markdown code blocks, no explanatory text before or after
          - Escape all newlines in content strings as \\n
          - Escape all quotes in content strings as \\"
          - Do NOT include trailing commas
          - Ensure all strings are properly quoted
          
          Make these specifications detailed enough for an AI assistant (like Claude) to implement the code, but do NOT include actual code - only specifications.
        `
      }]
    }];
    const specsRes = await generateContentWithRetry(gemini, specsContents);
    
    // The model might put JSON in a markdown block, so we clean it up before parsing.
    const rawSpecsText = specsRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawSpecsText) {
      throw new Error('Failed to generate implementation specifications');
    }
    
    // Use robust JSON parser
    let codeStubs;
    try {
      codeStubs = parseJsonResponse(rawSpecsText);
    } catch (parseError: unknown) {
      // If parsing fails, log the error and provide a fallback structure
      console.error('Failed to parse specifications JSON:', parseError);
      console.error('Raw response:', rawSpecsText.substring(0, 1000));
      
      // Create a fallback structure with error message
      codeStubs = {
        files: [{
          path: 'specs/parsing-error.md',
          content: `# Error Parsing Specifications\n\nThere was an error parsing the generated specifications. The AI response may have contained malformed JSON.\n\n**Error:** ${(parseError as { message?: string }).message || 'Unknown error'}\n\n**Raw Response (first 2000 chars):**\n\`\`\`\n${rawSpecsText.substring(0, 2000)}\n\`\`\`\n\nPlease try regenerating the specifications.`
        }]
      };
    }
    
    // Validate the structure
    if (!codeStubs || !Array.isArray(codeStubs.files)) {
      throw new Error('Invalid specifications structure: expected object with files array');
    }

    totalTokens += specsRes.usageMetadata?.totalTokenCount || 0;

    // Save artifacts to database
    await db.update(bookmarkedIdea)
      .set({ requirements, design, tasks, codeStubs })
      .where(and(eq(bookmarkedIdea.id, id), eq(bookmarkedIdea.userId, userId)));

    // Insert token usage
    await db.insert(tokenUsage).values({
      id: crypto.randomUUID(),
      userId,
      tokensUsed: totalTokens,
      operation: 'spec_generation',
      inputTokens: 0, // Would need to calculate properly
      outputTokens: totalTokens,
      totalTokens,
    });

    // Update userprofile totalTokensSpent
    await db.update(userprofile)
      .set({
        totalTokensSpent: sql`${userprofile.totalTokensSpent} + ${totalTokens}`,
      })
      .where(eq(userprofile.userId, userId));

    // Update analytics
    tokensUsed += totalTokens;
    const finalTokensRateLimited = tokensUsed >= tokenLimit;

    // Update spec generation count
    specGenerationsToday += 1;

    await db.insert(userAnalytics).values({
      id: crypto.randomUUID(),
      userId,
      route: '/api/ideas/[id]/generate-spec',
      method: 'GET',
      generationAttemptsCount: attempts,
      generationAttemptsResetTime: attemptsResetTime,
      generationAttemptsIsRateLimited: attemptsRateLimited,
      tokensUsedThisHour: tokensUsed,
      tokensResetTime: tokensResetTime,
      isTokenRateLimited: finalTokensRateLimited,
      tokenLimitPerHour: tokenLimit,
      specGenerationsToday,
      specGenerationsResetDate,
    }).onConflictDoUpdate({
      target: userAnalytics.userId,
      set: {
        generationAttemptsCount: attempts,
        generationAttemptsResetTime: attemptsResetTime,
        generationAttemptsIsRateLimited: attemptsRateLimited,
        tokensUsedThisHour: tokensUsed,
        tokensResetTime: tokensResetTime,
        isTokenRateLimited: finalTokensRateLimited,
        specGenerationsToday,
        specGenerationsResetDate,
      },
    });

    return NextResponse.json({
      requirements,
      design,
      tasks,
      codeStubs,
      usedApiKey: !!userApiKey,
    });
  } catch (err) {
    console.error('Fatal error during spec generation:', err);
    // Return a 500 status code for any unhandled error, including a final failed API retry
    return NextResponse.json({ error: 'Internal server error or external AI service failed after retries.' }, { status: 500 });
  }
}