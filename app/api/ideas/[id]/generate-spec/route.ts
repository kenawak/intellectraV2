import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db/drizzle';
import { idea, bookmarkedIdea, tokenUsage, userprofile, userAnalytics } from '@/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const techStack = req.nextUrl.searchParams.get('techStack') || 'Next.js, TypeScript, Tailwind CSS';

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

    // Phase 1: Requirements
    const requirementsRes = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `
            Given the idea: ${ideaData.title} - ${ideaData.summary}
            Unmet Needs: ${ideaData.unmetNeeds.join(', ')}
            Product Idea: ${ideaData.productIdea.join(', ')}
            Generate a requirements document with 3-5 user stories and acceptance criteria in markdown.
          `
        }]
      }]
    });
    const requirements = requirementsRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');

    // Phase 2: Design
    const designRes = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
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
      }]
    });
    const design = designRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');

    // Phase 3: Tasks
    const tasksRes = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
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
      }]
    });
    const tasks = tasksRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');

    // Phase 4: Code Scaffolding
    const codeRes = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `
            Based on tasks: ${tasks}
            And tech stack: ${techStack}
            Generate code stubs for key components (e.g., API routes, React components) as JSON:
            { "files": [{ "path": "string", "content": "string" }] }
          `
        }]
      }]
    });
    const codeStubs = JSON.parse(codeRes.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));

    // Calculate total tokens used
    const totalTokens = (requirementsRes.usageMetadata?.totalTokenCount || 0) +
                       (designRes.usageMetadata?.totalTokenCount || 0) +
                       (tasksRes.usageMetadata?.totalTokenCount || 0) +
                       (codeRes.usageMetadata?.totalTokenCount || 0);

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
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}