'use client';

import { TokenUsageChart } from '@/components/admin/TokenUsageChart';
import { BookmarksChart } from '@/components/admin/BookmarksChart';
import { IdeasAnalytics } from '@/components/admin/IdeasAnalytics';

export default function AdminAnalyticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Platform usage and engagement metrics
        </p>
      </div>

      <IdeasAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TokenUsageChart />
        <BookmarksChart />
      </div>
    </div>
  );
}

