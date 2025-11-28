'use client';

import { useState, useEffect } from 'react';
import { AnalyticsResponse } from './analytics-types';
import { mockAnalyticsData } from './mock-analytics-data';

interface UseDashboardDataOptions {
  startDate?: string;
  endDate?: string;
  feature?: string;
}

export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.startDate) params.append('startDate', options.startDate);
        if (options.endDate) params.append('endDate', options.endDate);
        if (options.feature) params.append('feature', options.feature);

        const response = await fetch(`/api/analytics/features?${params.toString()}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.statusText}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        // Fallback to mock data for development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock data as fallback');
          setData(mockAnalyticsData);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [options.startDate, options.endDate, options.feature]);

  return { data, loading, error };
}

