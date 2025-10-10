"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFolder,
  IconInnerShadowTop,
  IconPlus,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"

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

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "New Project",
    url: "/dashboard/new-project",
    icon: IconPlus,
  },
  {
    title: "Bookmarks",
    url: "/dashboard/projects",
    icon: IconFolder,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null)

  React.useEffect(() => {
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

  const user = session ? {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image || "/avatars/shadcn.jpg",
  } : {
    name: "Guest",
    email: "guest@example.com",
    avatar: "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {analytics && (
          <div className="mx-3 my-2 space-y-3">
            {/* <Card>
              <CardHeader>
                <CardTitle className="text-xs text-muted-foreground">
                  Bookmarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">
                  {analytics.systemAnalytics.bookmarks} saved
                </Badge>
              </CardContent>
            </Card> */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xs text-muted-foreground">
                  Remaining Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(analytics.userAnalytics.remainingAttempts / 5) * 100}%` }}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {analytics.userAnalytics.remainingAttempts}/5
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}