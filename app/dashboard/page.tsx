"use client"

import { useState, useEffect } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { authClient } from "@/lib/auth-client"

interface AnalyticsData {
  systemAnalytics: {
    bookmarks: number
    totalPublicIdeas: number
    avgConfidence: number
  }
  userAnalytics: {
    generationAttempts: number
    remainingAttempts: number
    resetTime: string | null
    avgConfidence: number
  }
}

interface TokenUsage {
  date: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
}

interface Idea {
  id: string
  title: string
  summary: string
  unmet_needs: string[]
  product_idea: string[]
  proof_of_concept: string
  source_url: string
  prompt_used: string
  createdAt: string
  confidenceScore: number
  suggestedPlatforms: string[]
  generatedBy: string
  votes: {
    up: number
    down: number
    total: number
    userVote: 'up' | 'down' | null
  }
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage[]>([])
  const [publicIdeas, setPublicIdeas] = useState<Idea[]>([])
  const [upvotedIdeas, setUpvotedIdeas] = useState<Idea[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch analytics
        const analyticsResponse = await fetch('/api/analytics')
        if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics')
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)

        // Fetch token usage
        const tokenResponse = await fetch('/api/analytics/token-usage', {
          credentials: 'include'
        })
        if (tokenResponse.ok) {
          const data = await tokenResponse.json()
          const tokenUsageData: TokenUsage[] = data.tokenUsage.sort((a: TokenUsage, b: TokenUsage) => a.date.localeCompare(b.date))
          setTokenUsage(tokenUsageData)
        }

        // Fetch public ideas
        const ideasResponse = await fetch('/api/ideas/public')
        if (ideasResponse.ok) {
          const ideas = await ideasResponse.json()
          const filtered = ideas.filter((idea: any) => idea.confidenceScore > 85)
          setPublicIdeas(filtered)
          // Filter upvoted
          const upvoted = ideas.filter((idea: any) => idea.votes.userVote === 'up')
          setUpvotedIdeas(upvoted)
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <SectionCards analytics={analytics} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive analytics={analytics} tokenUsage={tokenUsage} />
      </div>
      <DataTable publicIdeas={publicIdeas} upvotedIdeas={upvotedIdeas} />
    </>
  )
}
