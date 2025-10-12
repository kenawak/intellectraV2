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

async function analyzeTechStackWithAI(
  repoData: any,
  packageJson: any,
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
    let repoData, files;
    try {
      const [repoResponse, filesResponse] = await Promise.all([
        octokit.repos.get({ owner, repo }),
        octokit.repos.getContent({ owner, repo, path: '' })
      ]);
      repoData = repoResponse.data;
      files = filesResponse.data;
    } catch (githubErr: any) {
      console.error('GitHub API Error:', githubErr);
      if (githubErr.status === 404) {
        return NextResponse.json({ error: 'Repository not found. Please check if it still exists.' }, { status: 404 });
      }
      if (githubErr.status === 403) {
        return NextResponse.json({ error: 'Access denied. The repository might be private or you may have exceeded the rate limit.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to analyze repository. Please try again later.' }, { status: 500 });
    }

    // Analyze key files
    let packageJson = null;
    let requirementsTxt = null;
    const keyFiles: string[] = [];
    const filesArray = Array.isArray(files) ? files : [files];

    for (const file of filesArray) {
      keyFiles.push(file.name);

      if (file.name === 'package.json' && file.type === 'file') {
        try {
          const { data: content } = await octokit.repos.getContent({ owner, repo, path: 'package.json' });
          const fileContent = content as any;
          if (fileContent.content) {
            packageJson = JSON.parse(Buffer.from(fileContent.content, 'base64').toString());
          }
        } catch (e) {
          console.error('Error parsing package.json:', e);
        }
      } else if (file.name === 'requirements.txt' && file.type === 'file') {
        try {
          const { data: content } = await octokit.repos.getContent({ owner, repo, path: 'requirements.txt' });
          const fileContent = content as any;
          if (fileContent.content) {
            requirementsTxt = Buffer.from(fileContent.content, 'base64').toString();
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