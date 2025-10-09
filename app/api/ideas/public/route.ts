import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { idea, bookmarkedIdea } from '@/db/schema';
import { eq, notInArray, sql } from 'drizzle-orm';

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

    const formattedIdeas = publicIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      summary: idea.summary,
      unmet_needs: idea.unmetNeeds,
      product_idea: idea.productIdea,
      proof_of_concept: idea.proofOfConcept,
      source_url: idea.sourceUrl,
      prompt_used: idea.promptUsed,
      createdAt: idea.createdAt.toISOString(),
      confidenceScore: idea.confidenceScore || 85,
      suggestedPlatforms: (idea.suggestedPlatforms && idea.suggestedPlatforms.length) ? idea.suggestedPlatforms : ["Web", "Mobile"],
      generatedBy: 'System', // Since no userId in idea table
    }));

    return NextResponse.json(formattedIdeas);
  } catch (err) {
    console.error("Public ideas error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}