import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { userprofile } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/onboarding/complete
 * 
 * Completes the user onboarding process by saving their market specialization
 * and specialization path to their userprofile.
 * 
 * Request Body:
 * {
 *   marketSpecialization: string;  // Clean, readable specialization name
 *   specializationPath: string[]; // Full path through the hierarchy
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   message?: string;
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
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

    // Parse request body
    const body = await req.json();
    const { marketSpecialization, specializationPath } = body;

    // Validate required fields
    if (!marketSpecialization || !specializationPath || !Array.isArray(specializationPath)) {
      return NextResponse.json(
        { error: 'Missing required fields: marketSpecialization and specializationPath' },
        { status: 400 }
      );
    }

    // Check if userprofile exists
    const existingProfile = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      // Update existing profile
      await db
        .update(userprofile)
        .set({
          marketSpecialization,
          specializationPath,
          onboardingComplete: true,
          updatedAt: new Date(),
        })
        .where(eq(userprofile.userId, userId));

      console.log(`✅ Updated onboarding for user ${userId}: ${marketSpecialization}`);
    } else {
      // Create new profile with onboarding data
      await db.insert(userprofile).values({
        id: crypto.randomUUID(),
        userId,
        marketSpecialization,
        specializationPath,
        onboardingComplete: true,
        paid: false,
        plan: 'free',
        totalTokensSpent: 0,
        tokenLimit: 10000,
      });

      console.log(`🆕 Created profile with onboarding for user ${userId}: ${marketSpecialization}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onboarding/status
 * 
 * Check if the current user has completed onboarding.
 * 
 * Response:
 * {
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
        onboardingComplete: userprofile.onboardingComplete,
        marketSpecialization: userprofile.marketSpecialization,
        specializationPath: userprofile.specializationPath,
      })
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      // No profile exists, onboarding not complete
      return NextResponse.json({
        onboardingComplete: false,
      });
    }

    return NextResponse.json({
      onboardingComplete: profile[0].onboardingComplete || false,
      marketSpecialization: profile[0].marketSpecialization || null,
      specializationPath: profile[0].specializationPath || null,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

