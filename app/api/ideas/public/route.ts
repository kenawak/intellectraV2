import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { idea, bookmarkedIdea } from '@/db/schema';
import { eq, ne, notInArray, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // const session = await optionalAuth(req);
    let query = sql`true`;

    // For testing, no exclusions
    const publicIdeas = await db.select().from(idea).where(query).orderBy(idea.createdAt);

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
    }));

    return NextResponse.json(formattedIdeas);
  } catch (err) {
    console.error("Public ideas error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}