import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { auth } from '@/lib/auth';
import { getUserWithAnalytics } from '@/lib/admin-queries';
import { db } from '@/db/drizzle';
import { user } from '@/db/schema';
import { desc } from 'drizzle-orm';

const ADMIN_USER_ID = 'OMp4mdqfTj4U1jFUHTJO4eXbtjyafCz3';

/**
 * GET /api/admin/users
 * List all users with analytics (Admin only)
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

    // Get users directly from database (Better Auth stores in user table)
    const users = await db
      .select()
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(100);

    // Merge with analytics data
    const usersWithAnalytics = await Promise.all(
      users.map(async (dbUser) => {
        const analytics = await getUserWithAnalytics(dbUser.id);
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          emailVerified: dbUser.emailVerified,
          image: dbUser.image,
          createdAt: dbUser.createdAt,
          role: dbUser.role,
          ...analytics,
        };
      })
    );

    return NextResponse.json({
      users: usersWithAnalytics,
      total: usersWithAnalytics.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

