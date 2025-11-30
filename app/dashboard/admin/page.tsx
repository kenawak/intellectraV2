'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, TrendingUp, Bookmark, Lightbulb, DollarSign } from 'lucide-react';
import { usePostHog } from '@posthog/react';
import { TokenUsageChart } from '@/components/admin/TokenUsageChart';
import { BookmarksChart } from '@/components/admin/BookmarksChart';
import { IdeasAnalytics } from '@/components/admin/IdeasAnalytics';
import type { AdminStats } from '@/types/admin';

export default function AdminDashboardPage() {
  const posthog = usePostHog();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Track admin dashboard view
    posthog?.capture('Admin Dashboard Viewed', {
      admin_id: 'OMp4mdqfTj4U1jFUHTJO4eXbtjyafCz3',
    });
  }, [posthog]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of users, analytics, and platform metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.proUsers || 0} Pro, {stats?.freeUsers || 0} Free
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTokensUsed.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All time usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIdeas.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Generated ideas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBookmarks.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Saved by users</p>
          </CardContent>
        </Card>
      </div>

      {/* Ideas Analytics */}
      <IdeasAnalytics />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenUsageChart />
        <BookmarksChart />
      </div>
    </div>
  );
}

