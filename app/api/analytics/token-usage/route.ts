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

    // Generate date range for the last 90 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 90)

    const dateRange: string[] = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(d.toISOString().split('T')[0])
    }

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

    // Create a map of existing data for quick lookup
    const usageMap = new Map(tokenUsageData.map(item => [item.date, item]))

    // Fill in missing dates with 0 values
    const completeTokenUsage = dateRange.map(date => {
      const existing = usageMap.get(date)
      return existing || {
        date,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0
      }
    })

    return NextResponse.json({ tokenUsage: completeTokenUsage })
  } catch (error) {
    console.error("Error fetching token usage:", error)
    return NextResponse.json({ error: "Failed to fetch token usage" }, { status: 500 })
  }
}
