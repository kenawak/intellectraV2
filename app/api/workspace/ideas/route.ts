import { NextRequest, NextResponse } from 'next/server';
import { requireSubscription } from '@/lib/auth-utils';
import { saveIdea, getUserIdeas } from '@/lib/workspace-service';
import type { SaveIdeaPayload } from '@/types/workspace';

/**
 * POST /api/workspace/ideas
 * Save a validated idea to workspace (Pro only)
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

    const payload: SaveIdeaPayload = await req.json();

    // Validate required fields
    if (!payload.ideaName || typeof payload.validationScore !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const ideaId = await saveIdea(userId, payload);

    return NextResponse.json({
      success: true,
      id: ideaId,
    });
  } catch (error) {
    console.error('Error saving idea:', error);
    
    if (error instanceof Error && error.message.includes('subscription required')) {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save idea' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspace/ideas
 * Get all saved validated ideas for the current user
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

    const ideas = await getUserIdeas(userId);

    return NextResponse.json({
      ideas: ideas.map(idea => ({
        id: idea.id,
        ideaName: idea.ideaName,
        validationScore: idea.validationScore,
        targetMarket: idea.targetMarket,
        validationData: idea.validationData,
        starterPrompt: idea.starterPrompt,
        createdAt: idea.createdAt.toISOString(),
        updatedAt: idea.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    
    if (error instanceof Error && error.message.includes('subscription required')) {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

