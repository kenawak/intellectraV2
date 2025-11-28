import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { userprofile } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/profile
 * 
 * Get current user's profile information including plan and paid status.
 * Used by PlanAcquisitionGuard to check if plan acquisition is complete.
 * 
 * Response:
 * {
 *   plan: string;
 *   paid: boolean;
 *   onboardingComplete: boolean;
 *   marketSpecialization?: string;
 *   specializationPath?: string[];
 * }
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

    const profile = await db
      .select({
        plan: userprofile.plan,
        paid: userprofile.paid,
        onboardingComplete: userprofile.onboardingComplete,
        marketSpecialization: userprofile.marketSpecialization,
        specializationPath: userprofile.specializationPath,
      })
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      // No profile exists - plan acquisition not complete
      return NextResponse.json({
        plan: null,
        paid: null,
        onboardingComplete: false,
        marketSpecialization: null,
        specializationPath: null,
      });
    }

    return NextResponse.json({
      plan: profile[0].plan || null,
      paid: profile[0].paid ?? null,
      onboardingComplete: profile[0].onboardingComplete || false,
      marketSpecialization: profile[0].marketSpecialization || null,
      specializationPath: profile[0].specializationPath || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

