'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AnalyticsResponse, RecentActivity } from '@/lib/analytics-types';
import { formatTimestamp, formatNumber, getFeatureDisplayName, getStatusColor, getActionDisplayName } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { DetailDrawer } from './detail-drawer';

interface RecentActivityTableProps {
  data: AnalyticsResponse | null;
  loading: boolean;
  selectedFeature?: string | null;
}

export function RecentActivityTable({ data, loading, selectedFeature }: RecentActivityTableProps) {
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity & { feature: string } | null>(null);

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.features.length) return null;

  // Collect all recent activities, optionally filter by selectedFeature
  const allActivities: Array<RecentActivity & { feature: string }> = [];
  data.features.forEach((feature) => {
    if (!selectedFeature || feature.feature === selectedFeature) {
      feature.recentActivity.forEach((activity) => {
        allActivities.push({ ...activity, feature: feature.feature });
      });
    }
  });

  // Sort by timestamp descending and take latest 6
  const recentActivities = allActivities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const getMetadataSummary = (metadata: Record<string, unknown> | null): string => {
    if (!metadata) return '—';
    if (metadata.title) return String(metadata.title);
    if (metadata.query) return String(metadata.query);
    if (metadata.prompt) return String(metadata.prompt).substring(0, 50) + '...';
    return '—';
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent activity</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <TableCell className="font-medium">
                      {getFeatureDisplayName(activity.feature)}
                    </TableCell>
                    <TableCell>{getActionDisplayName(activity.action)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(activity.status)}
                      >
                        {activity.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(activity.tokensUsed)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {getMetadataSummary(activity.metadata)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedActivity && (
        <DetailDrawer
          activity={selectedActivity}
          open={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </>
  );
}

