'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AnalyticsResponse } from '@/lib/analytics-types';
import { formatNumber, getFeatureDisplayName } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

interface FeatureDonutProps {
  data: AnalyticsResponse | null;
  loading: boolean;
  onFeatureClick?: (feature: string) => void;
}

const COLORS = ['#a78bfa', '#f472b6', '#60a5fa', '#fbbf24', '#34d399'];

export function FeatureDonut({ data, loading, onFeatureClick }: FeatureDonutProps) {
  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.features.length) return null;

  // Prepare data for donut chart - map features to totalActions
  const chartData = data.features
    .map((feature, index) => ({
      name: getFeatureDisplayName(feature.feature),
      value: feature.summary.totalActions,
      feature: feature.feature,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4); // Top 4 features

  const totalActions = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { feature: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600">{formatNumber(payload[0].value)} actions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Top Features by Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => onFeatureClick?.(data.feature)}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-gray-900">{formatNumber(totalActions)}</div>
              <div className="text-sm text-gray-500">Total Actions</div>
            </div>
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onFeatureClick?.(item.feature)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

