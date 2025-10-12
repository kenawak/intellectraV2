import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db/drizzle';
import { githubProject, tokenUsage, userprofile, userAnalytics } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Octokit } from '@octokit/rest';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined
});

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
    const userPrompt = req.nextUrl.searchParams.get('userPrompt');

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
    const estimatedTokens = 5000; // Estimate for cursor prompt generation
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
        route: '/api/github-projects/[id]/generate-cursor-prompt',
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

    // Get the GitHub project
    const [project] = await db.select().from(githubProject).where(sql`${githubProject.id} = ${id} AND ${githubProject.userId} = ${userId}`);
    if (!project) {
      return NextResponse.json({ error: 'GitHub project not found' }, { status: 404 });
    }

    // Check if cursor prompt is already generated
    if (project.cursorPrompt) {
      return NextResponse.json({ cursorPrompt: project.cursorPrompt });
    }

    // Check if project has been analyzed
    if (!project.isAnalyzed) {
      return NextResponse.json({ error: 'Project must be analyzed first. Please analyze the project before generating prompts.' }, { status: 400 });
    }

    // Use pre-analyzed data
    const inferredTechStack = project.inferredTechStack || 'Unknown';
    const keyFiles = project.keyFiles || [];

    // Generate Cursor prompt using pre-analyzed data
    const promptRes = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `
            Based on the following GitHub repository analysis, generate a Cursor-compatible prompt for code generation or refactoring.

            Repository: ${project.repoName}
            Description: ${project.repoDescription || 'No description'}
            Language: ${project.repoLanguage || 'Unknown'}
            Inferred Tech Stack: ${inferredTechStack}
            Key Files: ${keyFiles.join(', ')}

            ${userPrompt ? `Custom Instructions: ${userPrompt}` : ''}

            Generate a markdown-formatted Cursor prompt with:
            - Clear objective
            - Repo context (tech stack, key files, inferred functionality)
            - Specific instructions for Cursor (file paths, example code)
            - Desired functionality
          `
        }]
      }]
    });

    const cursorPrompt = promptRes.candidates[0].content.parts[0].text.replace(/```markdown|```/g, '');

    // Calculate tokens used
    const totalTokens = promptRes.usageMetadata?.totalTokenCount || estimatedTokens;

    // Save to database
    await db.update(githubProject)
      .set({ cursorPrompt, inferredTechStack })
      .where(sql`${githubProject.id} = ${id} AND ${githubProject.userId} = ${userId}`);

    // Insert token usage
    await db.insert(tokenUsage).values({
      id: crypto.randomUUID(),
      userId,
      tokensUsed: totalTokens,
      operation: 'github_cursor_prompt_generation',
      inputTokens: 0,
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
      route: '/api/github-projects/[id]/generate-cursor-prompt',
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

    return NextResponse.json({ cursorPrompt });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}