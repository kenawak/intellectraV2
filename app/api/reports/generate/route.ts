import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { userprofile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { unifiedSearch, generateReport } from '@/lib/unified-search-service';
import { getSubscriptionStatus } from '@/lib/polar-utils';
import { saveReport } from '@/lib/report-persistence-service';
import { trackFeatureAnalytics, extractRequestMetadata } from '@/lib/analytics-service';

/**
 * POST /api/reports/generate
 * 
 * Generates a deep search report by:
 * 1. Fetching user's market specialization
 * 2. Running unified search across multiple sources
 * 3. Synthesizing results into a comprehensive report using LLM
 * 
 * Request Body:
 * {
 *   query: string;  // Search query
 * }
 * 
 * Response:
 * {
 *   report: string;  // Markdown-formatted report
 *   resultsCount: number;
 *   specialization?: string;
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
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check subscription status - Deep Reports are a paid feature
    const subscriptionStatus = await getSubscriptionStatus(userId, false);
    
    if (subscriptionStatus !== 'pro' && subscriptionStatus !== 'enterprise') {
      // Allow free users to generate reports (they'll see paywall on frontend)
      // But we still generate the report so they can see the teaser
      console.log(`ℹ️ Free user ${userId} generating report - will show paywall on frontend`);
    }

    // Fetch user's market specialization from profile
    const profile = await db
      .select({
        marketSpecialization: userprofile.marketSpecialization,
        specializationPath: userprofile.specializationPath,
        plan: userprofile.plan,
        paid: userprofile.paid,
      })
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    const marketSpecialization = profile[0]?.marketSpecialization || undefined;

    console.log(`📊 Generating report for user ${userId}, query: "${query}", specialization: ${marketSpecialization || 'none'}`);

    // Step 1: Run unified search
    const combinedResults = await unifiedSearch(query, marketSpecialization);

    if (combinedResults.length === 0) {
      return NextResponse.json(
        { error: 'No search results found for the given query' },
        { status: 404 }
      );
    }

    // Step 2: Generate deep report using LLM
    const reportContent = await generateReport(query, marketSpecialization, combinedResults);
    const duration = Date.now() - startTime;

    // Estimate token usage (report length is a proxy)
    const estimatedTokens = Math.ceil(reportContent.length / 4); // Rough estimate: 4 chars per token

    console.log(`✅ Report generated successfully for user ${userId}`);

    // Step 3: Persist report artifact
    let savedReportId: string | null = null;
    try {
      const savedReport = await saveReport({
        userId,
        query,
        marketSpecialization: marketSpecialization || null,
        reportContent,
        resultsCount: combinedResults.length,
      });
      savedReportId = savedReport.reportId;
      console.log(`💾 Report persisted: ${savedReportId}`);
    } catch (error) {
      // Log error but don't fail the request - report generation succeeded
      console.error('⚠️ Failed to persist report:', error);
    }

    // Track analytics
    await trackFeatureAnalytics({
      userId,
      feature: 'market-opportunities',
      action: 'generate',
      status: 'success',
      tokensUsed: estimatedTokens,
      metadata: {
        query,
        resultsCount: combinedResults.length,
        marketSpecialization: marketSpecialization || null,
        reportId: savedReportId,
        hasFullAccess: subscriptionStatus === 'pro' || subscriptionStatus === 'enterprise',
      },
      duration,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({
      success: true,
      report: reportContent,
      reportId: savedReportId,
      resultsCount: combinedResults.length,
      specialization: marketSpecialization || null,
      hasFullAccess: subscriptionStatus === 'pro' || subscriptionStatus === 'enterprise',
    });
  } catch (error) {
    console.error('❌ Error generating report:', error);
    
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
          feature: 'market-opportunities',
          action: 'generate',
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

