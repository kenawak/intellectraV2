'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TokenUsageStats } from '@/types/admin';

export function TokenUsageChart() {
  const [data, setData] = useState<TokenUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.tokenUsage || []);
      }
    } catch (error) {
      console.error('Error fetching token usage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 10).map((stat) => ({
    userId: stat.userId.substring(0, 8) + '...',
    tokens: stat.totalTokensUsed,
    plan: stat.planTier,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage by User</CardTitle>
        <CardDescription>Top 10 users by token consumption</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="userId" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tokens" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

