import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchReportById, deleteReportById } from '@/lib/report-persistence-service';

/**
 * GET /api/reports/[id]
 * 
 * Retrieves a specific report by ID for the current authenticated user.
 * Ensures user can only access their own reports.
 * 
 * Response:
 * {
 *   report: ReportArtifact;
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: reportId } = await params;

    // Fetch the specific report
    const report = await fetchReportById(userId, reportId);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('❌ Error fetching report:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 :
                      errorMessage.includes('Access denied') ? 403 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * 
 * Deletes a specific report by ID for the current authenticated user.
 * Ensures user can only delete their own reports.
 * 
 * Response:
 * {
 *   success: boolean;
 * }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: reportId } = await params;

    // Delete the report
    const result = await deleteReportById(userId, reportId);

    return NextResponse.json({
      success: result.success,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = errorMessage.includes('not found') ? 404 :
                      errorMessage.includes('Access denied') ? 403 : 500;

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

