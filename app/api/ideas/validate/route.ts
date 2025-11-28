import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { userprofile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateIdea } from '@/lib/idea-validator-service';
import { trackFeatureAnalytics, extractRequestMetadata } from '@/lib/analytics-service';

/**
 * POST /api/ideas/validate
 * 
 * Validates a product idea using search results and AI analysis.
 * 
 * Request Body:
 * {
 *   idea: string;  // The product idea to validate
 * }
 * 
 * Response:
 * {
 *   validation: IdeaValidationResult;
 *   success: boolean;
 * }
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
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
    const { ipAddress, userAgent } = extractRequestMetadata(req);

    // Parse request body
    const body = await req.json();
    const { idea } = body;

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return NextResponse.json(
        { error: 'Idea is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Fetch user's market specialization from profile (optional context)
    const profile = await db
      .select({
        marketSpecialization: userprofile.marketSpecialization,
      })
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    const marketSpecialization = profile[0]?.marketSpecialization || undefined;

    console.log(`📊 Validating idea for user ${userId}, idea: "${idea}", specialization: ${marketSpecialization || 'none'}`);

    // Validate the idea
    const validation = await validateIdea(idea, marketSpecialization);
    const duration = Date.now() - startTime;

    // Extract token usage from validation result if available
    const tokensUsed = (validation as { tokensUsed?: number }).tokensUsed || 0;
    const inputTokens = (validation as { inputTokens?: number }).inputTokens || 0;
    const outputTokens = (validation as { outputTokens?: number }).outputTokens || 0;

    // Track analytics
    await trackFeatureAnalytics({
      userId,
      feature: 'idea-validator',
      action: 'validate',
      status: 'success',
      tokensUsed,
      inputTokens,
      outputTokens,
      metadata: {
        ideaLength: idea.length,
        marketSpecialization: marketSpecialization || null,
        hasLinks: validation.links && validation.links.length > 0,
        linksCount: validation.links?.length || 0,
      },
      duration,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    console.log(`✅ Idea validation completed successfully for user ${userId}`);

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error('❌ Error validating idea:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('Unauthorized') ? 401 :
                      errorMessage.includes('required') ? 400 :
                      errorMessage.includes('not configured') ? 500 : 500;

    // Track error analytics
    try {
      const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
      if (session?.user?.id) {
        const { ipAddress, userAgent } = extractRequestMetadata(req);
        const duration = Date.now() - startTime;
        await trackFeatureAnalytics({
          userId: session.user.id,
          feature: 'idea-validator',
          action: 'validate',
          status: 'error',
          metadata: {
            error: errorMessage,
          },
          duration,
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        });
      }
    } catch (analyticsError) {
      console.error('Failed to track error analytics:', analyticsError);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

