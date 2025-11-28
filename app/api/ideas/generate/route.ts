import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/lib/auth'
import { generateIdeas } from '@/lib/idea-generation';
import { SearchProvider } from '@/lib/search-providers';
import { db } from '@/db/drizzle';
import { userAnalytics, tokenUsage, userprofile, idea } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { trackFeatureAnalytics, extractRequestMetadata } from '@/lib/analytics-service';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await auth.api.getSession({
          headers: req.headers
      })
    const userId = session?.user.id;
    const { ipAddress, userAgent } = extractRequestMetadata(req);
    // const userId = 'VOeNpacxjN1pLXXxgzvLmyG8y9PeEwb6'; // Real user ID
    console.log("user id", userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user analytics
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

    // Handle token rate limiting (pre-check with estimated max tokens)
    let tokensUsed = userAnalytic[0]?.tokensUsedThisHour || 0;
    let tokensResetTime = userAnalytic[0]?.tokensResetTime;
    const tokenLimit = userAnalytic[0]?.tokenLimitPerHour || 100000;
    // Get last token usage as estimate for this request
    const lastUsage = await db.select().from(tokenUsage).where(eq(tokenUsage.userId, userId)).orderBy(desc(tokenUsage.timestamp)).limit(1);
    const estimatedTokens = lastUsage[0]?.totalTokens || 20000; // Use last usage or default estimate
    if (!tokensResetTime || now > tokensResetTime) {
      tokensUsed = 0;
      tokensResetTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
    }
    const tokensRateLimited = tokensUsed + estimatedTokens >= tokenLimit;

    // If attempts or tokens rate limited, return early
    if (attemptsRateLimited || tokensRateLimited) {
      const errorMsg = attemptsRateLimited ? 'Generation attempts rate limit exceeded (5 per hour)' : 'Token rate limit exceeded';
      
      // Track rate limit analytics
      await trackFeatureAnalytics({
        userId,
        feature: 'new-project',
        action: 'generate',
        status: 'rate_limited',
        metadata: {
          reason: attemptsRateLimited ? 'attempts_limit' : 'token_limit',
          attempts,
          tokensUsed,
          tokenLimit,
        },
        duration: Date.now() - startTime,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      });
      
      // Still update analytics
      await db.insert(userAnalytics).values({
        id: crypto.randomUUID(),
        userId,
        route: '/api/ideas/generate',
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

    // Get search parameters from query string
    const prompt = req.nextUrl.searchParams.get('prompt') || 'developer side project ideas coding problems';
    const providerParam = req.nextUrl.searchParams.get('provider') || 'exa';
    const provider: SearchProvider = (['exa', 'tavily', 'serper'].includes(providerParam) ? providerParam : 'exa') as SearchProvider;
    const sitesParam = req.nextUrl.searchParams.get('sites');
    const sites = sitesParam ? sitesParam.split(',').filter(s => s.trim().length > 0) : undefined;
    const numResults = parseInt(req.nextUrl.searchParams.get('numResults') || '5', 10);

    const result = await generateIdeas(prompt, provider, sites, numResults);
    const { ideas, usage } = result;
    const duration = Date.now() - startTime;

    // Note: generateIdeas() already inserts ideas into the database with conflict handling.
    // The ideas are returned here for the API response. No need to insert again.

    const totalTokens = usage?.totalTokenCount || 0;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;

    // Track analytics
    await trackFeatureAnalytics({
      userId,
      feature: 'new-project',
      action: 'generate',
      status: 'success',
      tokensUsed: totalTokens,
      inputTokens,
      outputTokens,
      metadata: {
        prompt,
        provider,
        sites: sites || [],
        numResults,
        ideasGenerated: ideas.length,
      },
      duration,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    // Insert token usage
    await db.insert(tokenUsage).values({
      id: crypto.randomUUID(),
      userId,
      tokensUsed: totalTokens,
      operation: 'idea_generation',
      inputTokens,
      outputTokens,
      totalTokens,
    });

    // Update userprofile totalTokensSpent
    await db.update(userprofile)
      .set({
        totalTokensSpent: sql`${userprofile.totalTokensSpent} + ${totalTokens}`,
      })
      .where(eq(userprofile.userId, userId));

    // Update token rate limiting
    tokensUsed += totalTokens;
    const finalTokensRateLimited = tokensUsed >= tokenLimit;

    // Update user analytics with all
    await db.insert(userAnalytics).values({
      id: crypto.randomUUID(),
      userId,
      route: '/api/ideas/generate',
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

    if (tokensRateLimited) {
      return NextResponse.json({ error: 'Token rate limit exceeded' }, { status: 429 });
    }

    return NextResponse.json({ ideas, usage });
  } catch (err) {
    console.error(err);
    
    // Track error analytics
    try {
      const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
      if (session?.user?.id) {
        const { ipAddress, userAgent } = extractRequestMetadata(req);
        const duration = Date.now() - startTime;
        await trackFeatureAnalytics({
          userId: session.user.id,
          feature: 'new-project',
          action: 'generate',
          status: 'error',
          metadata: {
            error: err instanceof Error ? err.message : 'Unknown error',
          },
          duration,
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        });
      }
    } catch (analyticsError) {
      console.error('Failed to track error analytics:', analyticsError);
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}