import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AuthGuard } from "@/components/auth-guard"
import { PlanAcquisitionGuard } from "@/components/plan-acquisition-guard"
import { OnboardingGuard } from "@/components/onboarding-guard"
import { PlanReminder } from "@/components/plan-reminder"
import { OnboardingReminder } from "@/components/onboarding-reminder"
import { PostHogPageview } from "@/components/PostHogPageview"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * DashboardLayout with proper flow:
 * 1. AuthGuard - Ensures user is authenticated
 * 2. PlanAcquisitionGuard - Non-blocking, allows dashboard access
 * 3. OnboardingGuard - Optional, non-blocking (allows dashboard access)
 * 4. PlanReminder - Shows reminder modal if plan/paid not set
 * 5. OnboardingReminder - Shows reminder modal if onboarding incomplete
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      <PlanAcquisitionGuard>
        <OnboardingGuard optional={true}>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                <PostHogPageview />
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <PlanReminder />
                    <OnboardingReminder />
                    {children}
                  </div>
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </OnboardingGuard>
      </PlanAcquisitionGuard>
    </AuthGuard>
  )
}