import { NextRequest, NextResponse } from 'next/server';
import { requireSubscription } from '@/lib/auth-utils';
import { deleteOpportunity } from '@/lib/workspace-service';

/**
 * DELETE /api/workspace/opportunities/[id]
 * Delete an opportunity from workspace (Pro only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSubscription(req, 'pro');
    const userId = session.user.id;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const paramsData = await params;
    const id = paramsData.id;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteOpportunity(id, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    
    if (error instanceof Error && error.message.includes('subscription required')) {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete opportunity' },
      { status: 500 }
    );
  }
}

