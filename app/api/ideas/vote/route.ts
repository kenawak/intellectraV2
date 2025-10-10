import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { vote } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await optionalAuth(req);
    const userId = session?.user?.id;

    const { ideaId, voteType } = await req.json();

    if (!ideaId || !voteType || !['up', 'down'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Get client IP and user agent for anonymous voting restriction
    const ipAddress = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check if this IP/device has already voted on this idea
    const existingVote = await db.select().from(vote).where(
      and(
        eq(vote.ideaId, ideaId),
        eq(vote.ipAddress, ipAddress),
        eq(vote.userAgent, userAgent)
      )
    ).limit(1);

    if (existingVote.length > 0) {
      // If same vote type, remove the vote (toggle off)
      if (existingVote[0].voteType === voteType) {
        await db.delete(vote).where(eq(vote.id, existingVote[0].id));
        return NextResponse.json({ message: 'Vote removed', action: 'removed' });
      } else {
        // If different vote type, update the vote
        await db.update(vote)
          .set({ voteType, createdAt: new Date() })
          .where(eq(vote.id, existingVote[0].id));
        return NextResponse.json({ message: 'Vote updated', action: 'updated' });
      }
    } else {
      // Insert new vote
      await db.insert(vote).values({
        id: crypto.randomUUID(),
        userId,
        ideaId,
        voteType,
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ message: 'Vote added', action: 'added' });
    }
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json({ error: 'ideaId is required' }, { status: 400 });
    }

    // Get vote counts for the idea
    const votes = await db.select().from(vote).where(eq(vote.ideaId, ideaId));

    const upVotes = votes.filter(v => v.voteType === 'up').length;
    const downVotes = votes.filter(v => v.voteType === 'down').length;

    // Check if current user/IP has voted
    const session = await optionalAuth(req);
    const userId = session?.user?.id;
    const ipAddress = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    let userVote = null;
    if (userId) {
      // Check by userId first
      const userVoteRecord = votes.find(v => v.userId === userId);
      if (userVoteRecord) {
        userVote = userVoteRecord.voteType;
      }
    }
    if (!userVote) {
      // Check by IP/device
      const ipVoteRecord = votes.find(v => v.ipAddress === ipAddress && v.userAgent === userAgent);
      if (ipVoteRecord) {
        userVote = ipVoteRecord.voteType;
      }
    }

    return NextResponse.json({
      upVotes,
      downVotes,
      totalVotes: upVotes + downVotes,
      userVote
    });
  } catch (err) {
    console.error("Get votes error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}