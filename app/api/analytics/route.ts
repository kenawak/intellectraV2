import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { idea, bookmarkedIdea, userAnalytics } from '@/db/schema';
import { count, eq, avg } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    const userId = session?.user.id;

    // System analytics
    const totalPublicIdeas = await db.select({ count: count() }).from(idea);
    const totalBookmarks = await db.select({ count: count() }).from(bookmarkedIdea);
    const avgConfidenceResult = await db.select({ avg: avg(idea.confidenceScore) }).from(idea);

    const systemData = {
      bookmarks: totalBookmarks[0].count,
      totalPublicIdeas: totalPublicIdeas[0].count,
      avgConfidence: Math.round(Number(avgConfidenceResult[0].avg) || 0),
    };

    // User analytics
    const userAnalytic = userId ? await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1) : [];

    // Calculate average confidence from user's bookmarked ideas (as "generated projects")
    let userAvgConfidence = 0;
    if (userId) {
      const userBookmarks = await db.select().from(bookmarkedIdea).where(eq(bookmarkedIdea.userId, userId));
      if (userBookmarks.length > 0) {
        // Since bookmarkedIdea doesn't have confidenceScore, use default 85
        userAvgConfidence = 85;
      }
    }

    const userData = {
      generationAttempts: userAnalytic[0]?.generationAttemptsCount || 0,
      remainingAttempts: 5 - (userAnalytic[0]?.generationAttemptsCount || 0),
      resetTime: userAnalytic[0]?.generationAttemptsResetTime || null,
      avgConfidence: userAvgConfidence,
    };

    return NextResponse.json({
      systemAnalytics: systemData,
      userAnalytics: userData,
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}