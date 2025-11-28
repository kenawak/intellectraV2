/**
 * Mock analytics data for development/fallback
 * Matches the structure from ANALYTICS_JSON_EXAMPLE.md
 */
import { AnalyticsResponse } from './analytics-types';

export const mockAnalyticsData: AnalyticsResponse = {
  success: true,
  period: {
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-01-31T23:59:59.999Z',
  },
  overall: {
    totalActions: 1247,
    totalTokens: 245893,
    successfulActions: 1189,
  },
  features: [
    {
      feature: 'bookmark',
      summary: {
        totalActions: 342,
        successfulActions: 338,
        failedActions: 3,
        rateLimitedActions: 1,
        successRate: '98.83',
      },
      tokens: {
        total: 0,
        average: '0.00',
        input: 0,
        output: 0,
      },
      performance: {
        averageDurationMs: '45.23',
      },
      actionsBreakdown: [
        { action: 'create', count: 312 },
        { action: 'delete', count: 30 },
      ],
      recentActivity: [
        {
          id: 'abc123-def456-ghi789',
          action: 'create',
          status: 'success',
          tokensUsed: 0,
          timestamp: '2025-01-31T14:23:45.123Z',
          metadata: {
            ideaId: 'idea-xyz-123',
            title: 'AI-Powered Code Review Tool',
            sourceUrl: 'https://example.com/idea',
          },
        },
        {
          id: 'jkl012-mno345-pqr678',
          action: 'delete',
          status: 'success',
          tokensUsed: 0,
          timestamp: '2025-01-31T13:15:22.456Z',
          metadata: {
            sourceUrl: 'https://example.com/idea',
            title: 'Old Idea',
          },
        },
      ],
    },
    {
      feature: 'idea-validator',
      summary: {
        totalActions: 189,
        successfulActions: 175,
        failedActions: 12,
        rateLimitedActions: 2,
        successRate: '92.59',
      },
      tokens: {
        total: 45678,
        average: '241.68',
        input: 12345,
        output: 33333,
      },
      performance: {
        averageDurationMs: '3421.56',
      },
      actionsBreakdown: [
        { action: 'validate', count: 189 },
      ],
      recentActivity: [
        {
          id: 'stu901-vwx234-yza567',
          action: 'validate',
          status: 'success',
          tokensUsed: 523,
          timestamp: '2025-01-31T15:30:12.789Z',
          metadata: {
            ideaLength: 156,
            marketSpecialization: 'Fullstack',
            hasLinks: true,
            linksCount: 8,
          },
        },
      ],
    },
    {
      feature: 'market-opportunities',
      summary: {
        totalActions: 267,
        successfulActions: 251,
        failedActions: 14,
        rateLimitedActions: 2,
        successRate: '94.01',
      },
      tokens: {
        total: 123456,
        average: '462.57',
        input: 45678,
        output: 77778,
      },
      performance: {
        averageDurationMs: '15234.89',
      },
      actionsBreakdown: [
        { action: 'generate', count: 267 },
      ],
      recentActivity: [
        {
          id: 'klm789-nop012-qrs345',
          action: 'generate',
          status: 'success',
          tokensUsed: 892,
          timestamp: '2025-01-31T16:12:45.234Z',
          metadata: {
            query: 'AI tools for developers',
            resultsCount: 12,
            marketSpecialization: 'Software Development',
            reportId: 'report-abc-123',
            hasFullAccess: true,
          },
        },
      ],
    },
    {
      feature: 'new-project',
      summary: {
        totalActions: 449,
        successfulActions: 425,
        failedActions: 18,
        rateLimitedActions: 6,
        successRate: '94.65',
      },
      tokens: {
        total: 76759,
        average: '170.96',
        input: 23456,
        output: 53303,
      },
      performance: {
        averageDurationMs: '8934.12',
      },
      actionsBreakdown: [
        { action: 'generate', count: 449 },
      ],
      recentActivity: [
        {
          id: 'cde567-fgh890-ijk123',
          action: 'generate',
          status: 'success',
          tokensUsed: 234,
          timestamp: '2025-01-31T17:45:30.890Z',
          metadata: {
            prompt: 'developer tool pain points',
            provider: 'exa',
            sites: ['reddit.com', 'x.com', 'indiehackers.com'],
            numResults: 5,
            ideasGenerated: 5,
          },
        },
      ],
    },
  ],
};

