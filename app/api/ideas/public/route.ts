import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { idea, bookmarkedIdea, vote } from '@/db/schema';
import { eq, notInArray, sql, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await optionalAuth(req);
    const userId = session?.user?.id;

    let publicIdeas;

    if (userId) {
      // Get bookmarked idea IDs for this user
      const bookmarkedIds = await db.select({ id: bookmarkedIdea.id }).from(bookmarkedIdea).where(eq(bookmarkedIdea.userId, userId));
      const excludedIds = bookmarkedIds.map(b => b.id);

      if (excludedIds.length > 0) {
        publicIdeas = await db.select().from(idea).where(notInArray(idea.id, excludedIds)).orderBy(idea.createdAt);
      } else {
        publicIdeas = await db.select().from(idea).orderBy(idea.createdAt);
      }
    } else {
      // No user, return all ideas
      publicIdeas = await db.select().from(idea).orderBy(idea.createdAt);
    }

    // Get all idea IDs
    const ideaIds = publicIdeas.map(i => i.id);

    // Get vote counts for all ideas
    const allVotes = ideaIds.length > 0 ? await db.select({
      ideaId: vote.ideaId,
      voteType: vote.voteType,
      userId: vote.userId,
      ipAddress: vote.ipAddress,
      userAgent: vote.userAgent,
    }).from(vote).where(inArray(vote.ideaId, ideaIds)) : [];

    // Get current user's vote info
    const ipAddress = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const formattedIdeas = publicIdeas.map((idea) => {
      const ideaVotes = allVotes.filter(v => v.ideaId === idea.id);
      const upVotes = ideaVotes.filter(v => v.voteType === 'up').length;
      const downVotes = ideaVotes.filter(v => v.voteType === 'down').length;

      // Check user's vote
      let userVote = null;
      if (userId) {
        const userVoteRecord = ideaVotes.find(v => v.userId === userId);
        if (userVoteRecord) {
          userVote = userVoteRecord.voteType;
        }
      }
      if (!userVote) {
        const ipVoteRecord = ideaVotes.find(v => v.ipAddress === ipAddress && v.userAgent === userAgent);
        if (ipVoteRecord) {
          userVote = ipVoteRecord.voteType;
        }
      }

      return {
        id: idea.id,
        title: idea.title,
        summary: idea.summary,
        unmet_needs: idea.unmetNeeds,
        product_idea: idea.productIdea,
        proof_of_concept: idea.proofOfConcept,
        source_url: idea.sourceUrl,
        prompt_used: idea.promptUsed,
        createdAt: idea.createdAt.toISOString(),
        confidenceScore: idea.confidenceScore,
        suggestedPlatforms: idea.suggestedPlatforms,
        generatedBy: 'System', // Since no userId in idea table
        votes: {
          up: upVotes,
          down: downVotes,
          total: upVotes + downVotes,
          userVote
        }
      };
    });

    return NextResponse.json(formattedIdeas);
  } catch (err) {
    console.error("Public ideas error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}