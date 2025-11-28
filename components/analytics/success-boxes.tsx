'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AnalyticsResponse } from '@/lib/analytics-types';
import { formatPercentage, getFeatureDisplayName } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

interface SuccessBoxesProps {
  data: AnalyticsResponse | null;
  loading: boolean;
}

export function SuccessBoxes({ data, loading }: SuccessBoxesProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || !data.features.length) return null;

  // Sort by totalActions and take top 4
  const topFeatures = [...data.features]
    .sort((a, b) => b.summary.totalActions - a.summary.totalActions)
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {topFeatures.map((feature) => {
        const successRate = parseFloat(feature.summary.successRate) || 0;
        const failedCount = feature.summary.failedActions;
        const totalCount = feature.summary.totalActions;
        const successBarWidth = totalCount > 0 ? (successRate / 100) * 100 : 0;

        return (
          <Card
            key={feature.feature}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 hover:shadow-xl transition-shadow"
          >
            <CardContent className="p-6">
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-1">
                  {getFeatureDisplayName(feature.feature)}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatPercentage(successRate)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  {failedCount} failed out of {totalCount}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                    style={{ width: `${successBarWidth}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

