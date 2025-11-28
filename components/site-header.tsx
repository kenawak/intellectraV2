"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {ModeToggle} from "@/components/mode-toggle"

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
  }
}

export function SiteHeader() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      }
    }

    fetchAnalytics()
  }, [])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex relative">
            <a
              href="/projects"
              className="dark:text-foreground flex items-center gap-2"
            >
              {/* {analytics ? `(${analytics.systemAnalytics.totalPublicIdeas}) Projects` : 'Projects'} */}
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
