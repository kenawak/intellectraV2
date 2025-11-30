/**
 * Admin Queries
 * 
 * Better Auth admin API wrappers and Supabase analytics queries
 */

import { db } from '@/db/drizzle';
import { userprofile, bookmarkedIdea, idea, tokenUsage, workspaceOpportunity, workspaceIdea } from '@/db/schema';
import { eq, desc, sql, count, inArray } from 'drizzle-orm';
import type { AdminUser, TokenUsageStats, BookmarkStats, IdeasAnalytics, AdminStats } from '@/types/admin';

/**
 * Get user profile data merged with analytics
 */
export async function getUserWithAnalytics(userId: string): Promise<Partial<AdminUser>> {
  const [profile] = await db
    .select()
    .from(userprofile)
    .where(eq(userprofile.userId, userId))
    .limit(1);

  // Get token usage
  const tokenStats = await db
    .select({
      total: sql<number>`COALESCE(SUM(${tokenUsage.tokensUsed}::bigint), 0)`,
    })
    .from(tokenUsage)
    .where(eq(tokenUsage.userId, userId));

  // Get bookmarked ideas count
  const bookmarkCount = await db
    .select({ count: count() })
    .from(bookmarkedIdea)
    .where(eq(bookmarkedIdea.userId, userId));

  // Get workspace items count
  const [workspaceOpps] = await db
    .select({ count: count() })
    .from(workspaceOpportunity)
    .where(eq(workspaceOpportunity.userId, userId));

  const [workspaceIdeas] = await db
    .select({ count: count() })
    .from(workspaceIdea)
    .where(eq(workspaceIdea.userId, userId));

  return {
    plan: (profile?.plan as 'free' | 'pro' | 'enterprise') || 'free',
    paid: profile?.paid || false,
    totalTokensUsed: Number(tokenStats[0]?.total || 0),
    ideasBookmarked: bookmarkCount[0]?.count || 0,
    ideasAnalyzed: (workspaceOpps?.count || 0) + (workspaceIdeas?.count || 0),
  };
}

/**
 * Get token usage statistics grouped by user
 */
export async function getTokenUsageStats(limit: number = 50): Promise<TokenUsageStats[]> {
  const stats = await db
    .select({
      userId: tokenUsage.userId,
      totalTokensUsed: sql<number>`COALESCE(SUM(${tokenUsage.tokensUsed}::bigint), 0)`,
    })
    .from(tokenUsage)
    .groupBy(tokenUsage.userId)
    .orderBy(desc(sql`COALESCE(SUM(${tokenUsage.tokensUsed}::bigint), 0)`))
    .limit(limit);

  // Merge with user profiles for plan tier
  const userIds = stats.map(s => s.userId);
  const profiles = userIds.length > 0
    ? await db
        .select()
        .from(userprofile)
        .where(inArray(userprofile.userId, userIds))
    : [];

  const profileMap = new Map(profiles.map(p => [p.userId, p]));

  return stats.map(stat => ({
    userId: stat.userId,
    planTier: (profileMap.get(stat.userId)?.plan as 'free' | 'pro') || 'free',
    totalTokensUsed: Number(stat.totalTokensUsed),
  }));
}

/**
 * Get bookmark statistics by user
 */
export async function getBookmarkStats(limit: number = 10): Promise<BookmarkStats[]> {
  const stats = await db
    .select({
      userId: bookmarkedIdea.userId,
      count: count(),
    })
    .from(bookmarkedIdea)
    .groupBy(bookmarkedIdea.userId)
    .orderBy(desc(count()))
    .limit(limit);

  return stats.map(stat => ({
    userId: stat.userId,
    count: stat.count,
  }));
}

/**
 * Get ideas analytics
 */
export async function getIdeasAnalytics(): Promise<IdeasAnalytics> {
  const [totalIdeas] = await db
    .select({ count: count() })
    .from(idea);

  const [totalBookmarked] = await db
    .select({ count: count() })
    .from(bookmarkedIdea);

  const [totalWorkspace] = await db
    .select({ count: count() })
    .from(workspaceIdea);

  // Top users by bookmarks
  const topUsers = await db
    .select({
      userId: bookmarkedIdea.userId,
      count: count(),
    })
    .from(bookmarkedIdea)
    .groupBy(bookmarkedIdea.userId)
    .orderBy(desc(count()))
    .limit(10);

  return {
    totalIdeas: totalIdeas.count,
    totalBookmarked: totalBookmarked.count,
    totalValidated: totalWorkspace.count,
    topUsers: topUsers.map(u => ({
      userId: u.userId,
      count: u.count,
    })),
  };
}

/**
 * Get overall admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const [totalUsers] = await db
    .select({ count: count() })
    .from(userprofile);

  const proUsersList = await db
    .select({ count: count() })
    .from(userprofile)
    .where(
      sql`(${userprofile.plan} = 'pro' OR ${userprofile.plan} = 'enterprise' OR ${userprofile.paid} = true)`
    );
  const [proUsers] = proUsersList;

  const freeUsersList = await db
    .select({ count: count() })
    .from(userprofile)
    .where(
      sql`(${userprofile.plan} = 'free' AND (${userprofile.paid} = false OR ${userprofile.paid} IS NULL))`
    );
  const [freeUsers] = freeUsersList;

  const totalTokensList = await db
    .select({
      total: sql<number>`COALESCE(SUM(${tokenUsage.tokensUsed}::bigint), 0)`,
    })
    .from(tokenUsage);
  const [totalTokens] = totalTokensList;

  const [totalIdeas] = await db
    .select({ count: count() })
    .from(idea);

  const [totalBookmarks] = await db
    .select({ count: count() })
    .from(bookmarkedIdea);

  return {
    totalUsers: totalUsers.count,
    proUsers: proUsers.count,
    freeUsers: freeUsers.count,
    totalTokensUsed: Number(totalTokens.total || 0),
    totalIdeas: totalIdeas.count,
    totalBookmarks: totalBookmarks.count,
  };
}

