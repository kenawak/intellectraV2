import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { generateIdeas } from '@/lib/idea-generation';
import { db } from '@/db/drizzle';
import { userAnalytics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    console.log(req)
    // const session = await requireAuth(req);
    // const userId = session.user.id;
    const userId = 'VOeNpacxjN1pLXXxgzvLmyG8y9PeEwb6'; // Real user ID

    // Update user analytics for generation attempts
    const userAnalytic = await db.select().from(userAnalytics).where(eq(userAnalytics.userId, userId)).limit(1);
    let attempts = userAnalytic[0]?.generationAttemptsCount || 0;
    attempts += 1;
    const resetTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(userAnalytics).values({
      id: crypto.randomUUID(),
      userId,
      route: '/api/ideas/generate',
      method: 'GET',
      generationAttemptsCount: attempts,
      generationAttemptsResetTime: resetTime,
      generationAttemptsIsRateLimited: attempts >= 5,
    }).onConflictDoUpdate({
      target: userAnalytics.userId,
      set: {
        generationAttemptsCount: attempts,
        generationAttemptsResetTime: resetTime,
        generationAttemptsIsRateLimited: attempts >= 5,
      },
    });

    const ideas = await generateIdeas(req.nextUrl.searchParams.get('prompt') || 'developer tool pain points');

    return NextResponse.json(ideas);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}