/**
 * TypeScript interfaces matching the /api/analytics/features response
 */

export type FeatureName = 'bookmark' | 'idea-validator' | 'market-opportunities' | 'new-project';

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'generate' | 'validate' | 'search';

export type StatusType = 'success' | 'error' | 'rate_limited';

export interface FeatureSummary {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  rateLimitedActions: number;
  successRate: string;
}

export interface TokenStats {
  total: number;
  average: string;
  input: number;
  output: number;
}

export interface PerformanceStats {
  averageDurationMs: string;
}

export interface ActionBreakdown {
  action: ActionType;
  count: number;
}

export interface RecentActivity {
  id: string;
  action: ActionType;
  status: StatusType;
  tokensUsed: number;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface FeatureAnalytics {
  feature: FeatureName;
  summary: FeatureSummary;
  tokens: TokenStats;
  performance: PerformanceStats;
  actionsBreakdown: ActionBreakdown[];
  recentActivity: RecentActivity[];
}

export interface AnalyticsPeriod {
  startDate: string | null;
  endDate: string | null;
}

export interface OverallStats {
  totalActions: number;
  totalTokens: number;
  successfulActions: number;
}

export interface AnalyticsResponse {
  success: boolean;
  period: AnalyticsPeriod;
  overall: OverallStats;
  features: FeatureAnalytics[];
}

