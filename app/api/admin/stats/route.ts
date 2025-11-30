import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { getAdminStats, getTokenUsageStats, getBookmarkStats, getIdeasAnalytics } from '@/lib/admin-queries';

const ADMIN_USER_ID = 'OMp4mdqfTj4U1jFUHTJO4eXbtjyafCz3';

/**
 * GET /api/admin/stats
 * Get overall admin statistics (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    
    if (session.user.id !== ADMIN_USER_ID) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const [stats, tokenStats, bookmarkStats, ideasStats] = await Promise.all([
      getAdminStats(),
      getTokenUsageStats(20),
      getBookmarkStats(10),
      getIdeasAnalytics(),
    ]);

    return NextResponse.json({
      stats,
      tokenUsage: tokenStats,
      bookmarks: bookmarkStats,
      ideas: ideasStats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

