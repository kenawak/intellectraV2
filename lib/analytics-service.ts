import { db } from '@/db/drizzle';
import { featureAnalytics } from '@/db/schema';
import crypto from 'crypto';

export type FeatureName = 'bookmark' | 'idea-validator' | 'market-opportunities' | 'new-project';
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'generate' | 'validate' | 'search';
export type StatusType = 'success' | 'error' | 'rate_limited';

interface TrackAnalyticsParams {
  userId: string;
  feature: FeatureName;
  action: ActionType;
  status: StatusType;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  metadata?: Record<string, unknown>;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track feature usage analytics
 */
export async function trackFeatureAnalytics(params: TrackAnalyticsParams): Promise<void> {
  try {
    await db.insert(featureAnalytics).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      feature: params.feature,
      action: params.action,
      status: params.status,
      tokensUsed: params.tokensUsed || 0,
      inputTokens: params.inputTokens || 0,
      outputTokens: params.outputTokens || 0,
      metadata: params.metadata || null,
      duration: params.duration || null,
      timestamp: new Date(),
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
  } catch (error) {
    // Don't fail the request if analytics tracking fails
    console.error('Failed to track feature analytics:', error);
  }
}

/**
 * Helper to extract IP and User-Agent from NextRequest
 */
export function extractRequestMetadata(req: { headers: Headers }): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const headers = req.headers;
  const ipAddress = 
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    null;
  const userAgent = headers.get('user-agent') || null;
  
  return { ipAddress, userAgent };
}

