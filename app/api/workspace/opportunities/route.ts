import { NextRequest, NextResponse } from 'next/server';
import { requireSubscription } from '@/lib/auth-utils';
import { saveOpportunity, getUserOpportunities } from '@/lib/workspace-service';
import type { SaveOpportunityPayload } from '@/types/workspace';

/**
 * POST /api/workspace/opportunities
 * Save an opportunity to workspace (Pro only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSubscription(req, 'pro');
    const userId = session.user.id;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const payload: SaveOpportunityPayload = await req.json();

    // Validate required fields
    if (!payload.opportunityName || !payload.persona || !payload.painPoint || !payload.monetization) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const opportunityId = await saveOpportunity(userId, payload);

    return NextResponse.json({
      success: true,
      id: opportunityId,
    });
  } catch (error) {
    console.error('Error saving opportunity:', error);
    
    if (error instanceof Error && error.message.includes('subscription required')) {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save opportunity' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/opportunities
 * Get all saved opportunities for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSubscription(req, 'pro');
    const userId = session.user.id;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const opportunities = await getUserOpportunities(userId);

    return NextResponse.json({
      opportunities: opportunities.map(opp => ({
        id: opp.id,
        topic: opp.topic,
        opportunityName: opp.opportunityName,
        persona: opp.persona,
        score: opp.score,
        painPoint: opp.painPoint,
        monetization: opp.monetization,
        coreFeatures: opp.coreFeatures,
        marketProof: opp.marketProof,
        starterPrompt: opp.starterPrompt,
        createdAt: opp.createdAt.toISOString(),
        updatedAt: opp.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    
    if (error instanceof Error && error.message.includes('subscription required')) {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

