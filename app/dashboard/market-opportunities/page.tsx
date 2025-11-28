"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DeepReportViewer } from "@/components/deep-report-viewer"
import { Loader2 } from "lucide-react"

export default function MarketOpportunitiesPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/dashboard')
          return
        }

        const data = await response.json()
        const isPaid = 
          data.plan === 'pro' || 
          data.plan === 'enterprise' || 
          data.paid === true

        if (!isPaid) {
          router.push('/pricing')
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error checking access:', error)
        router.push('/dashboard')
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Checking access...</span>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-6">
      <DeepReportViewer />
    </div>
  )
}

