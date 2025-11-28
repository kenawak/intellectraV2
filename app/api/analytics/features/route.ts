import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { featureAnalytics } from '@/db/schema';
import { eq, and, gte, lte, sql, count, sum, avg } from 'drizzle-orm';

/**
 * GET /api/analytics/features
 * 
 * Returns comprehensive analytics for all 4 core features:
 * - bookmark
 * - idea-validator
 * - market-opportunities
 * - new-project
 * 
 * Query Parameters:
 * - userId: optional, filter by specific user (admin only)
 * - startDate: optional, ISO date string
 * - endDate: optional, ISO date string
 * - feature: optional, filter by specific feature
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = req.nextUrl;
    
    // Parse query parameters
    const targetUserId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const featureFilter = searchParams.get('feature') as 'bookmark' | 'idea-validator' | 'market-opportunities' | 'new-project' | null;

    // Build where conditions
    const conditions = [];
    
    // If userId is provided and user is admin, allow filtering by that userId
    // Otherwise, only show current user's analytics
    if (targetUserId && session.user.role === 'admin') {
      conditions.push(eq(featureAnalytics.userId, targetUserId));
    } else {
      conditions.push(eq(featureAnalytics.userId, userId));
    }

    if (startDate) {
      conditions.push(gte(featureAnalytics.timestamp, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(featureAnalytics.timestamp, new Date(endDate)));
    }

    if (featureFilter) {
      conditions.push(eq(featureAnalytics.feature, featureFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get analytics for each feature
    const features: Array<'bookmark' | 'idea-validator' | 'market-opportunities' | 'new-project'> = 
      featureFilter ? [featureFilter] : ['bookmark', 'idea-validator', 'market-opportunities', 'new-project'];

    const analytics = await Promise.all(
      features.map(async (feature) => {
        // Total actions
        const totalActions = await db
          .select({ count: count() })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature))
              : eq(featureAnalytics.feature, feature)
          );

        // Successful actions
        const successfulActions = await db
          .select({ count: count() })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature), eq(featureAnalytics.status, 'success'))
              : and(eq(featureAnalytics.feature, feature), eq(featureAnalytics.status, 'success'))
          );

        // Failed actions
        const failedActions = await db
          .select({ count: count() })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature), eq(featureAnalytics.status, 'error'))
              : and(eq(featureAnalytics.feature, feature), eq(featureAnalytics.status, 'error'))
          );

        // Rate limited actions
        const rateLimitedActions = await db
          .select({ count: count() })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature), eq(featureAnalytics.status, 'rate_limited'))
              : and(eq(featureAnalytics.feature, feature), eq(featureAnalytics.status, 'rate_limited'))
          );

        // Token usage
        const tokenStats = await db
          .select({
            totalTokens: sum(featureAnalytics.tokensUsed),
            avgTokens: avg(featureAnalytics.tokensUsed),
            totalInputTokens: sum(featureAnalytics.inputTokens),
            totalOutputTokens: sum(featureAnalytics.outputTokens),
          })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature))
              : eq(featureAnalytics.feature, feature)
          );

        // Average duration
        const avgDuration = await db
          .select({ avg: avg(featureAnalytics.duration) })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature), sql`${featureAnalytics.duration} IS NOT NULL`)
              : and(eq(featureAnalytics.feature, feature), sql`${featureAnalytics.duration} IS NOT NULL`)
          );

        // Actions breakdown
        const actionsBreakdown = await db
          .select({
            action: featureAnalytics.action,
            count: count(),
          })
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature))
              : eq(featureAnalytics.feature, feature)
          )
          .groupBy(featureAnalytics.action);

        // Recent activity (last 10 actions)
        const recentActivity = await db
          .select()
          .from(featureAnalytics)
          .where(
            whereClause
              ? and(whereClause, eq(featureAnalytics.feature, feature))
              : eq(featureAnalytics.feature, feature)
          )
          .orderBy(sql`${featureAnalytics.timestamp} DESC`)
          .limit(10);

        return {
          feature,
          summary: {
            totalActions: Number(totalActions[0]?.count || 0),
            successfulActions: Number(successfulActions[0]?.count || 0),
            failedActions: Number(failedActions[0]?.count || 0),
            rateLimitedActions: Number(rateLimitedActions[0]?.count || 0),
            successRate: totalActions[0]?.count
              ? ((Number(successfulActions[0]?.count || 0) / Number(totalActions[0]?.count)) * 100).toFixed(2)
              : '0.00',
          },
          tokens: {
            total: Number(tokenStats[0]?.totalTokens || 0),
            average: Number(tokenStats[0]?.avgTokens || 0).toFixed(2),
            input: Number(tokenStats[0]?.totalInputTokens || 0),
            output: Number(tokenStats[0]?.totalOutputTokens || 0),
          },
          performance: {
            averageDurationMs: Number(avgDuration[0]?.avg || 0).toFixed(2),
          },
          actionsBreakdown: actionsBreakdown.map((a) => ({
            action: a.action,
            count: Number(a.count),
          })),
          recentActivity: recentActivity.map((activity) => ({
            id: activity.id,
            action: activity.action,
            status: activity.status,
            tokensUsed: activity.tokensUsed,
            timestamp: activity.timestamp.toISOString(),
            metadata: activity.metadata,
          })),
        };
      })
    );

    // Overall statistics
    const overallStats = await db
      .select({
        totalActions: count(),
        totalTokens: sum(featureAnalytics.tokensUsed),
        successfulActions: sql<number>`COUNT(CASE WHEN ${featureAnalytics.status} = 'success' THEN 1 END)`,
      })
      .from(featureAnalytics)
      .where(whereClause || undefined);

    return NextResponse.json({
      success: true,
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      overall: {
        totalActions: Number(overallStats[0]?.totalActions || 0),
        totalTokens: Number(overallStats[0]?.totalTokens || 0),
        successfulActions: Number(overallStats[0]?.successfulActions || 0),
      },
      features: analytics,
    });
  } catch (error) {
    console.error('Error fetching feature analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

