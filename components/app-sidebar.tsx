"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFolder,
  IconPlus,
  IconTrendingUp,
  IconChecklist,
} from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image"
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

// Removed old analytics interface - using new comprehensive analytics system

// Base navigation items (always visible)
const baseNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Idea Validator",
    url: "/dashboard/idea-validator",
    icon: IconChecklist,
  },
  {
    title: "Workspace",
    url: "/dashboard/projects",
    icon: IconFolder,
  },
]

// Paid feature navigation items
const paidNavItems = [
  {
    title: "Market Opportunities",
    url: "/dashboard/market-opportunities",
    icon: IconTrendingUp,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const [userProfile, setUserProfile] = React.useState<{
    plan: string | null;
    paid: boolean | null;
  } | null>(null)

  React.useEffect(() => {
    // Only fetch profile if session exists
    if (!session?.user) return;
    
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setUserProfile({
            plan: data.plan || null,
            paid: data.paid ?? null,
          })
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }

    fetchUserProfile()
  }, [session])

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
                <Image
                  src="/intelectra.png"
                  alt="Intellectra"
                  width={48}
                  height={48}
                />
                <span className="text-base font-semibold">Intellectra.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={baseNavItems} />
        {/* Show Market Opportunities only for paid users */}
        {userProfile && (userProfile.plan === 'pro' || userProfile.plan === 'enterprise' || userProfile.paid === true) && (
          <NavMain items={paidNavItems} />
        )}
      </SidebarContent>
      <SidebarFooter className="flex items-center justify-between p-3 border-t gap-2">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}