'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsResponse } from '@/lib/analytics-types';
import { formatNumber, getFeatureDisplayName } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface TokensListProps {
  data: AnalyticsResponse | null;
  loading: boolean;
  onFeatureClick?: (feature: string) => void;
}

export function TokensList({ data, loading, onFeatureClick }: TokensListProps) {
  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.features.length) return null;

  // Sort features by total tokens descending, take top 5
  const sortedFeatures = [...data.features]
    .sort((a, b) => b.tokens.total - a.tokens.total)
    .slice(0, 5);

  const maxTokens = sortedFeatures[0]?.tokens.total || 1;

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Highest Token Consumption</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedFeatures.map((feature, index) => {
            const percentage = (feature.tokens.total / maxTokens) * 100;
            return (
              <div
                key={feature.feature}
                className="p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all cursor-pointer"
                onClick={() => onFeatureClick?.(feature.feature)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-purple-600">#{index + 1}</span>
                    <span className="font-semibold text-gray-800">
                      {getFeatureDisplayName(feature.feature)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatNumber(feature.tokens.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {formatNumber(parseFloat(feature.tokens.average))}
                    </div>
                  </div>
                </div>
                <Progress value={percentage} className="h-2 mt-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

