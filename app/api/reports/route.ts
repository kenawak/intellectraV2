import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchReportsByUserId } from '@/lib/report-persistence-service';

/**
 * GET /api/reports
 * 
 * Retrieves all saved reports for the current authenticated user.
 * Returns a list of report summaries sorted by creation date (most recent first).
 * 
 * Response:
 * {
 *   reports: ReportArtifactSummary[];
 *   count: number;
 * }
 */
export async function GET(req: NextRequest) {
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

    // Fetch user's reports
    const reports = await fetchReportsByUserId(userId);

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error) {
    console.error('❌ Error fetching reports:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

