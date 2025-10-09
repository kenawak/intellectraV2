import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth-utils';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { idea, bookmarkedIdea, userAnalytics } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    const userId = session?.user.id; 

    // System analytics
    const totalPublicIdeas = await db.select({ count: count() }).from(idea);
    const totalBookmarks = await db.select({ count: count() }).from(bookmarkedIdea);

    const systemData = {
      bookmarks: totalBookmarks[0].count,
      totalPublicIdeas: totalPublicIdeas[0].count,
    };

    // User analytics
    const userAnalytic = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);
    const userData = {
      generationAttempts: userAnalytic[0]?.generationAttemptsCount || 0,
      remainingAttempts: 5 - (userAnalytic[0]?.generationAttemptsCount || 0),
      resetTime: userAnalytic[0]?.generationAttemptsResetTime || null,
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