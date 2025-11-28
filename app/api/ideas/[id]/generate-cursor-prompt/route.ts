import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db/drizzle';
import { bookmarkedIdea, tokenUsage, userprofile, userAnalytics } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { Octokit } from '@octokit/rest';

/**
 * Type guard to check if GitHub content response is a file with content property
 */
type GitHubContentItem = {
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  name: string;
  path: string;
  content?: string;
  encoding?: string;
  [key: string]: unknown;
};

type GitHubFileContent = {
  type: 'file';
  content: string;
  encoding?: string;
  name?: string;
  [key: string]: unknown;
};

// Octokit can return an array (directory listing) or a single item (file)
type GitHubContentResponse = GitHubContentItem[] | GitHubContentItem;

function isFileWithContent(
  content: unknown
): content is GitHubFileContent {
  return (
    !Array.isArray(content) &&
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    content.type === 'file' &&
    'content' in content &&
    typeof content.content === 'string' &&
    content.content.length > 0
  );
}

function isDirectoryListing(
  content: unknown
): content is GitHubContentItem[] {
  return Array.isArray(content) && content.length > 0;
}

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

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
    const repoUrl = req.nextUrl.searchParams.get('repoUrl');
    const techStack = req.nextUrl.searchParams.get('techStack');
    const userPrompt = req.nextUrl.searchParams.get('userPrompt');

    if (!repoUrl) {
      return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 });
    }

    // Validate GitHub URL
    const githubUrlRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
    if (!githubUrlRegex.test(repoUrl)) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
    }

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
        route: '/api/ideas/[id]/generate-cursor-prompt',
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
    const [ideaData] = await db.select().from(bookmarkedIdea).where(sql`${bookmarkedIdea.id} = ${id} AND ${bookmarkedIdea.userId} = ${userId}`);
    if (!ideaData) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if cursor prompt is already generated
    if (ideaData.cursorPrompt) {
      return NextResponse.json({ cursorPrompt: ideaData.cursorPrompt });
    }

    // Parse repo URL
    const [, , , owner, repo] = repoUrl.split('/');

    // Fetch repo metadata
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    if (repoData.private) {
      return NextResponse.json({ error: 'Private repositories are not supported. Please make the repository public and try again.' }, { status: 403 });
    }

    // Fetch file structure (top level)
    const { data: filesDataRaw } = await octokit.repos.getContent({ owner, repo, path: '' });
    const filesData = filesDataRaw as unknown;

    // Ensure files is a directory listing (array)
    if (!isDirectoryListing(filesData)) {
      return NextResponse.json({ error: 'Expected directory listing but received single file' }, { status: 500 });
    }

    // Analyze key files
    let packageJson = null;
    let requirementsTxt = null;
    let inferredTechStack = techStack || 'Next.js, TypeScript, Tailwind CSS';

    for (const file of filesData) {
      if (file.type === 'file' && file.name === 'package.json') {
        try {
          const { data: contentData } = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
          
          if (isFileWithContent(contentData)) {
            packageJson = JSON.parse(Buffer.from(contentData.content, 'base64').toString());
            // Infer tech stack from dependencies
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (deps.next) inferredTechStack = 'Next.js, TypeScript, Tailwind CSS';
            else if (deps.react) inferredTechStack = 'React, TypeScript, CSS';
            else if (deps.express) inferredTechStack = 'Express.js, Node.js, MongoDB';
            else if (deps.django) inferredTechStack = 'Django, Python, PostgreSQL';
            else if (deps.flask) inferredTechStack = 'Flask, Python, SQLite';
          }
        } catch (e) {
          // Ignore parsing errors
        }
      } else if (file.type === 'file' && file.name === 'requirements.txt') {
        try {
          const { data: contentData } = await octokit.repos.getContent({ owner, repo, path: 'requirements.txt' });
          
          if (isFileWithContent(contentData)) {
            requirementsTxt = Buffer.from(contentData.content, 'base64').toString();
            inferredTechStack = 'Flask, Python, SQLite'; // Default for Python repos
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    // Generate Cursor prompt
    const promptRes = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `
            Based on the following GitHub repository analysis, generate a Cursor-compatible prompt for code generation or refactoring.

            Repository: ${repoData.name}
            Description: ${repoData.description || 'No description'}
            Language: ${repoData.language}
            Inferred Tech Stack: ${inferredTechStack}
            Key Files: ${filesData.map(f => f.name || 'unknown').join(', ')}

            Idea Details:
            Title: ${ideaData.title}
            Summary: ${ideaData.summary}
            Unmet Needs: ${Array.isArray(ideaData.unmetNeeds) ? ideaData.unmetNeeds.join(', ') : 'None'}
            Product Idea: ${Array.isArray(ideaData.productIdea) ? ideaData.productIdea.join(', ') : 'None'}

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

    const cursorPromptText = promptRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!cursorPromptText) {
      return NextResponse.json({ error: 'Failed to generate cursor prompt' }, { status: 500 });
    }
    const cursorPrompt = cursorPromptText.replace(/```markdown|```/g, '');

    // Calculate tokens used
    const totalTokens = promptRes.usageMetadata?.totalTokenCount || estimatedTokens;

    // Save to database
    await db.update(bookmarkedIdea)
      .set({ cursorPrompt })
      .where(sql`${bookmarkedIdea.id} = ${id} AND ${bookmarkedIdea.userId} = ${userId}`);

    // Insert token usage
    await db.insert(tokenUsage).values({
      id: crypto.randomUUID(),
      userId,
      tokensUsed: totalTokens,
      operation: 'cursor_prompt_generation',
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
      route: '/api/ideas/[id]/generate-cursor-prompt',
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
  } catch (err: unknown) {
    console.error(err);
    const error = err as { status?: number };
    if (error.status === 404) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}