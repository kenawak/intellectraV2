"use client"

import { useState, useEffect } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { authClient } from "@/lib/auth-client"

export default function Page() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading or wait for components to load
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable />
    </>
  )
}
