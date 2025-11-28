'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnalyticsResponse } from '@/lib/analytics-types';
import { formatNumber, formatDuration, getFeatureDisplayName } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

interface PerformanceLineProps {
  data: AnalyticsResponse | null;
  loading: boolean;
}

export function PerformanceLine({ data, loading }: PerformanceLineProps) {
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

  // Prepare data: map features to performance metrics
  const chartData = data.features.map((feature) => ({
    feature: getFeatureDisplayName(feature.feature),
    duration: parseFloat(feature.performance.averageDurationMs) || 0,
    avgTokens: parseFloat(feature.tokens.average) || 0,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || '#6b7280' }}>
              {entry.name}: {entry.name === 'Duration' ? formatDuration(entry.value) : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">API Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="feature"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Avg Tokens', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="duration"
              stroke="#a78bfa"
              strokeWidth={2}
              name="Duration"
              dot={{ fill: '#a78bfa', r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgTokens"
              stroke="#f472b6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Avg Tokens"
              dot={{ fill: '#f472b6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

