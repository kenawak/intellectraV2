import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db/drizzle'
import { tokenUsage } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    // ✅ get session *inside* the route using the request headers
    const session = await auth.api.getSession({ headers: req.headers })

    console.log("Session in token usage route:", session)

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const dateExpr = sql<string>`DATE(${tokenUsage.timestamp})`
    const tokenUsageData = await db
      .select({
        date: dateExpr,
        totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
        inputTokens: sql<number>`SUM(${tokenUsage.inputTokens})`,
        outputTokens: sql<number>`SUM(${tokenUsage.outputTokens})`,
      })
      .from(tokenUsage)
      .where(sql`${tokenUsage.userId} = ${userId}`)
      .groupBy(dateExpr)
      .orderBy(dateExpr)

    return NextResponse.json({ tokenUsage: tokenUsageData })
  } catch (error) {
    console.error("Error fetching token usage:", error)
    return NextResponse.json({ error: "Failed to fetch token usage" }, { status: 500 })
  }
}
