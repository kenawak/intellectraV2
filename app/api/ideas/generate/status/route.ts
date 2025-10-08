import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { userAnalytics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // const session = await requireAuth(req);
    // const userId = session.user.id;
    const userId = 'VOeNpacxjN1pLXXxgzvLmyG8y9PeEwb6'; // Real user ID

    const userAnalytic = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);

    if (!userAnalytic.length) {
      return NextResponse.json({
        remainingAttempts: 5,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
        isRateLimited: false,
      });
    }

    const { generationAttemptsCount, generationAttemptsResetTime } = userAnalytic[0];
    const now = new Date();
    const resetTime = generationAttemptsResetTime || new Date(now.getTime() + 60 * 60 * 1000);

    if (resetTime < now) {
      // Reset
      await db.update(userAnalytics).set({
        generationAttemptsCount: 0,
        generationAttemptsResetTime: new Date(now.getTime() + 60 * 60 * 1000),
        generationAttemptsIsRateLimited: false,
      }).where(eq(userAnalytics.userId, userId));
      return NextResponse.json({
        remainingAttempts: 5,
        resetTime: new Date(now.getTime() + 60 * 60 * 1000),
        isRateLimited: false,
      });
    }

    return NextResponse.json({
      remainingAttempts: 5 - (generationAttemptsCount || 0),
      resetTime,
      isRateLimited: (generationAttemptsCount || 0) >= 5,
    });
  } catch (err) {
    console.error("Generate status error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}