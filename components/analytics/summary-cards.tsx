'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatNumber, formatDateRange } from '@/lib/format';
import { AnalyticsResponse } from '@/lib/analytics-types';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardsProps {
  data: AnalyticsResponse | null;
  loading: boolean;
}

export function SummaryCards({ data, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { overall, period } = data;
  const avgTokensPerAction = overall.totalActions > 0
    ? Math.round(overall.totalTokens / overall.totalActions)
    : 0;

  const cards = [
    {
      label: 'Total Actions',
      value: formatNumber(overall.totalActions),
      subtitle: `${overall.successfulActions} successful`,
      color: 'bg-blue-50 border-blue-100',
      icon: '📊',
    },
    {
      label: 'Successful Actions',
      value: formatNumber(overall.successfulActions),
      subtitle: `${((overall.successfulActions / overall.totalActions) * 100).toFixed(1)}% success rate`,
      color: 'bg-green-50 border-green-100',
      icon: '✅',
    },
    {
      label: 'Total Tokens Used',
      value: formatNumber(overall.totalTokens),
      subtitle: `~${formatNumber(avgTokensPerAction)} per action`,
      color: 'bg-purple-50 border-purple-100',
      icon: '🔑',
    },
    {
      label: 'Period',
      value: formatDateRange(period.startDate, period.endDate),
      subtitle: 'Date range',
      color: 'bg-pink-50 border-pink-100',
      icon: '📅',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`${card.color} rounded-2xl shadow-lg border-2 hover:shadow-xl transition-shadow`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-sm font-medium text-gray-600">{card.label}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

