import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/db/drizzle';
import { githubProject, tokenUsage, userprofile, userAnalytics } from '@/db/schema';
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
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined
});

interface RepoData {
  name: string;
  description?: string | null;
  language?: string | null;
}

async function analyzeTechStackWithAI(
  repoData: RepoData,
  packageJson: Record<string, unknown> | null,
  requirementsTxt: string | null,
  keyFiles: string[]
): Promise<string> {
  const prompt = `
    Analyze this GitHub repository and determine its tech stack. Be specific and comprehensive.

    Repository Info:
    - Name: ${repoData.name}
    - Description: ${repoData.description || 'No description'}
    - Primary Language: ${repoData.language}
    - Key Files: ${keyFiles.join(', ')}

    Dependencies (package.json):
    ${packageJson ? JSON.stringify(packageJson, null, 2) : 'No package.json found'}

    Requirements (requirements.txt):
    ${requirementsTxt || 'No requirements.txt found'}

    Based on the files and dependencies above, provide a concise but comprehensive tech stack description.
    Include frameworks, languages, databases, and key tools. Format as a comma-separated list.
    Examples: "Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma"
             "Django, Python, PostgreSQL, Redis"
             "React, TypeScript, Node.js, Express, MongoDB"

    Only return the tech stack string, no explanation.
  `;

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Unknown';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user analytics for rate limiting
    const userAnalytic = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);
    const now = new Date();

    // Handle analysis attempts rate limiting
    let attempts = userAnalytic[0]?.generationAttemptsCount || 0;
    let attemptsResetTime = userAnalytic[0]?.generationAttemptsResetTime;
    if (!attemptsResetTime || now > attemptsResetTime) {
      attempts = 0;
      attemptsResetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
    attempts += 1;
    const attemptsRateLimited = attempts > 10; // Allow more attempts for analysis

    // Handle token rate limiting
    let tokensUsed = userAnalytic[0]?.tokensUsedThisHour || 0;
    let tokensResetTime = userAnalytic[0]?.tokensResetTime;
    const tokenLimit = userAnalytic[0]?.tokenLimitPerHour || 100000;
    const estimatedTokens = 2000; // Estimate for tech stack analysis
    if (!tokensResetTime || now > tokensResetTime) {
      tokensUsed = 0;
      tokensResetTime = new Date(now.getTime() + 60 * 60 * 1000);
    }
    const tokensRateLimited = tokensUsed + estimatedTokens >= tokenLimit;

    if (attemptsRateLimited || tokensRateLimited) {
      const errorMsg = attemptsRateLimited ? 'Analysis attempts rate limit exceeded (10 per hour)' : 'Token rate limit exceeded';
      await db.insert(userAnalytics).values({
        id: crypto.randomUUID(),
        userId,
        route: '/api/github-projects/[id]/analyze',
        method: 'POST',
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

    const { id } = await params;

    // Get the project
    const [project] = await db.select().from(githubProject).where(eq(githubProject.id, id)).limit(1);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if recent analysis exists (cache for 24 hours)
    if (project.isAnalyzed && project.lastAnalyzedAt) {
      const lastAnalyzed = new Date(project.lastAnalyzedAt);
      const hoursSinceAnalysis = (now.getTime() - lastAnalyzed.getTime()) / (1000 * 60 * 60);

      if (hoursSinceAnalysis < 24) {
        return NextResponse.json({
          repoLanguage: project.repoLanguage,
          inferredTechStack: project.inferredTechStack,
          packageJson: project.packageJson,
          requirementsTxt: project.requirementsTxt,
          keyFiles: project.keyFiles,
          isAnalyzed: true,
          cached: true
        });
      }
    }

    // Parse repo URL
    const [, , , owner, repo] = project.repoUrl.split('/');

    // Fetch repo metadata and files
    let repoData;
    let filesData: unknown;
    try {
      const [repoResponse, filesResponse] = await Promise.all([
        octokit.repos.get({ owner, repo }),
        octokit.repos.getContent({ owner, repo, path: '' })
      ]);
      repoData = repoResponse.data;
      filesData = filesResponse.data;
    } catch (githubErr: unknown) {
      console.error('GitHub API Error:', githubErr);
      const apiError = githubErr as { status?: number };
      if (apiError.status === 404) {
        return NextResponse.json({ error: 'Repository not found. Please check if it still exists.' }, { status: 404 });
      }
      if (apiError.status === 403) {
        return NextResponse.json({ error: 'Access denied. The repository might be private or you may have exceeded the rate limit.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to analyze repository. Please try again later.' }, { status: 500 });
    }

    // Analyze key files
    let packageJson = null;
    let requirementsTxt = null;
    const keyFiles: string[] = [];
    
    // Ensure we have a directory listing (array of files)
    if (!isDirectoryListing(filesData)) {
      return NextResponse.json({ error: 'Expected directory listing but received single file' }, { status: 500 });
    }

    for (const file of filesData) {
      if ('name' in file && typeof file.name === 'string') {
        keyFiles.push(file.name);
      }

      if (file.type === 'file' && file.name === 'package.json') {
        try {
          const { data: contentData } = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
          if (isFileWithContent(contentData)) {
            packageJson = JSON.parse(Buffer.from(contentData.content, 'base64').toString());
          }
        } catch (e) {
          console.error('Error parsing package.json:', e);
        }
      } else if (file.type === 'file' && file.name === 'requirements.txt') {
        try {
          const { data: contentData } = await octokit.repos.getContent({ owner, repo, path: 'requirements.txt' });
          if (isFileWithContent(contentData)) {
            requirementsTxt = Buffer.from(contentData.content, 'base64').toString();
          }
        } catch (e) {
          console.error('Error parsing requirements.txt:', e);
        }
      }
    }

    // Use AI to determine tech stack
    let inferredTechStack = 'Unknown';
    let aiTokensUsed = 0;

    try {
      inferredTechStack = await analyzeTechStackWithAI(repoData, packageJson, requirementsTxt, keyFiles);
      aiTokensUsed = 2000; // Estimate, will be updated with actual usage
    } catch (aiError) {
      console.error('AI tech stack analysis failed:', aiError);
      // Fallback to basic language detection
      inferredTechStack = repoData.language || 'Unknown';
    }

    // Track token usage if AI was used
    if (inferredTechStack !== (repoData.language || 'Unknown')) {
      const totalTokens = 2000; // Estimate for now

      await db.insert(tokenUsage).values({
        id: crypto.randomUUID(),
        userId,
        tokensUsed: totalTokens,
        operation: 'github_tech_stack_analysis',
        inputTokens: 0,
        outputTokens: totalTokens,
        totalTokens,
      });

      await db.update(userprofile)
        .set({ totalTokensSpent: sql`${userprofile.totalTokensSpent} + ${totalTokens}` })
        .where(eq(userprofile.userId, userId));

      // Update analytics
      tokensUsed += totalTokens;
      const finalTokensRateLimited = tokensUsed >= tokenLimit;

      await db.insert(userAnalytics).values({
        id: crypto.randomUUID(),
        userId,
        route: '/api/github-projects/[id]/analyze',
        method: 'POST',
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
    }

    // Update the project with analysis data
    await db.update(githubProject)
      .set({
        repoLanguage: repoData.language || null,
        inferredTechStack,
        packageJson,
        requirementsTxt,
        keyFiles,
        isAnalyzed: true,
        lastAnalyzedAt: sql`NOW()`,
      })
      .where(eq(githubProject.id, id));

    return NextResponse.json({
      repoLanguage: repoData.language,
      inferredTechStack,
      packageJson,
      requirementsTxt,
      keyFiles,
      isAnalyzed: true,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}