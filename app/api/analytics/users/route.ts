import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { userAnalytics } from '@/db/schema';

export async function GET(req: NextRequest) {
  try {
    // const session = await requireAuth(req);
    // await requireAdmin(req);

    const allUserAnalytics = await db.select().from(userAnalytics);

    const formattedAnalytics = allUserAnalytics.map((analytics) => ({
      userId: analytics.userId,
      route: analytics.route,
      method: analytics.method,
      timestamp: analytics.timestamp,
      ipAddress: analytics.ipAddress,
      userAgent: analytics.userAgent,
      sessionId: analytics.sessionId,
    }));

    return NextResponse.json({ userAnalytics: formattedAnalytics });
  } catch (err) {
    console.error("Error fetching user analytics:", err);
    return NextResponse.json({ error: "Failed to fetch user analytics" }, { status: 500 });
  }
}