import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db/drizzle';
import { bookmarkedIdea, tokenUsage, userprofile, userAnalytics } from '@/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { Content } from '@google/genai/server';

// --- Gemini Client Initialization ---
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

// --- Utility Functions for Robust API Calls (Retry Logic) ---

// Helper function to wait for a given duration
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a generateContent call with a retry mechanism for transient 503 errors.
 * Uses a simple exponential backoff strategy (2s, 4s, 8s, etc.).
 */
async function generateContentWithRetry(contents: Content[], maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: MODEL_NAME,
        contents: contents
      });
      // Success, return the response
      return response;
    } catch (err: any) {
      // Check for a 503 error (ApiError status code 503)
      if (err.status === 503 && attempt < maxRetries) {
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

    // --- Rate Limiting Logic ---
    // Get current user analytics for rate limiting
    const userAnalytic = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);
    const now = new Date();

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
          Unmet Needs: ${ideaData.unmetNeeds.join(', ')}
          Product Idea: ${ideaData.productIdea.join(', ')}
          Generate a requirements document with 3-5 user stories and acceptance criteria in markdown.
        `
      }]
    }];
    const requirementsRes = await generateContentWithRetry(requirementsContents);
    const requirements = requirementsRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');
    totalTokens += requirementsRes.usageMetadata?.totalTokenCount || 0;

    // Phase 2: Design (using retry function)
    const designContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Based on the requirements: ${requirements}
          And tech stack: ${techStack}
          Generate a high-level design document in markdown, including:
          - Component breakdown
          - API endpoints or functions
          - Data models
        `
      }]
    }];
    const designRes = await generateContentWithRetry(designContents);
    const design = designRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');
    totalTokens += designRes.usageMetadata?.totalTokenCount || 0;

    // Phase 3: Tasks (using retry function)
    const tasksContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Given the design: ${design}
          Generate a task list in markdown with:
          - 5-10 actionable tasks
          - Estimated effort (hours)
          - File or module mappings
        `
      }]
    }];
    const tasksRes = await generateContentWithRetry(tasksContents);
    const tasks = tasksRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');
    totalTokens += tasksRes.usageMetadata?.totalTokenCount || 0;

    // Phase 4: Code Scaffolding (using retry function)
    const codeContents: Content[] = [{
      role: 'user',
      parts: [{
        text: `
          Based on tasks: ${tasks}
          And tech stack: ${techStack}
          Generate code stubs for key components (e.g., API routes, React components) as JSON:
          { "files": [{ "path": "string", "content": "string" }] }
        `
      }]
    }];
    const codeRes = await generateContentWithRetry(codeContents);
    
    // The model might put code in a markdown block, so we clean it up before parsing.
    const rawCodeText = codeRes.candidates[0].content.parts[0].text;
    const cleanCodeText = rawCodeText.replace(/```json|```/g, '');
    const codeStubs = JSON.parse(cleanCodeText);

    totalTokens += codeRes.usageMetadata?.totalTokenCount || 0;

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
    }).onConflictDoUpdate({
      target: userAnalytics.userId,
      set: {
        generationAttemptsCount: attempts,
        generationAttemptsResetTime: attemptsResetTime,
        generationAttemptsIsRateLimited: attemptsRateLimited,
        tokensUsedThisHour: tokensUsed,
        tokensResetTime: tokensResetTime,
        isTokenRateLimited: finalTokensRateLimited,
      },
    });

    return NextResponse.json({ requirements, design, tasks, codeStubs });
  } catch (err) {
    console.error('Fatal error during spec generation:', err);
    // Return a 500 status code for any unhandled error, including a final failed API retry
    return NextResponse.json({ error: 'Internal server error or external AI service failed after retries.' }, { status: 500 });
  }
}