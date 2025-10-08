import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { tokenUsage } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    // Get token usage aggregated by date for the current user
    const tokenUsageData = await db
      .select({
        date: sql<string>`DATE(${tokenUsage.timestamp})`,
        totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
        inputTokens: sql<number>`SUM(${tokenUsage.inputTokens})`,
        outputTokens: sql<number>`SUM(${tokenUsage.outputTokens})`,
      })
      .from(tokenUsage)
      .where(sql`${tokenUsage.userId} = ${session.user.id}`)
      .groupBy(sql`DATE(${tokenUsage.timestamp})`)
      .orderBy(sql`DATE(${tokenUsage.timestamp})`);

    return NextResponse.json({ tokenUsage: tokenUsageData });
  } catch (err) {
    console.error("Error fetching token usage:", err);
    return NextResponse.json({ error: "Failed to fetch token usage" }, { status: 500 });
  }
}