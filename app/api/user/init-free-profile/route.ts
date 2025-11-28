import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { userprofile } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/user/init-free-profile
 * 
 * Initializes a free tier profile for the current user.
 * This is called when a user selects the free plan on the pricing page.
 * 
 * Response:
 * {
 *   success: boolean;
 *   message?: string;
 * }
 */
export async function POST(req: NextRequest) {
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

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      // Profile exists, update to free if needed
      if (existingProfile[0].plan !== 'free' || existingProfile[0].paid !== false) {
        await db
          .update(userprofile)
          .set({
            plan: 'free',
            paid: false,
            updatedAt: new Date(),
          })
          .where(eq(userprofile.userId, userId));
        
        console.log(`✅ Updated user ${userId} to free plan`);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Free plan activated',
      });
    }

    // Create new free profile
    await db.insert(userprofile).values({
      id: crypto.randomUUID(),
      userId,
      plan: 'free',
      paid: false,
      totalTokensSpent: 0,
      tokenLimit: 10000,
      onboardingComplete: false,
    });

    console.log(`🆕 Created free profile for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Free profile created successfully',
    });
  } catch (error) {
    console.error('Error initializing free profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

