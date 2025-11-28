import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { bookmarkedIdea } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const bookmarks = await db.select().from(bookmarkedIdea).where(eq(bookmarkedIdea.userId, userId)).orderBy(bookmarkedIdea.createdAt);

    const formattedBookmarks = bookmarks.map((b) => ({
      id: b.id,
      title: b.title,
      summary: b.summary,
      unmet_needs: b.unmetNeeds,
      product_idea: b.productIdea,
      proof_of_concept: b.proofOfConcept,
      source_url: b.sourceUrl,
      prompt_used: b.promptUsed,
      createdAt: b.createdAt.toISOString(),
      confidenceScore: b.confidenceScore,
      suggestedPlatforms: b.suggestedPlatforms ? (() => {
        try {
          return JSON.parse(b.suggestedPlatforms as string)
        } catch {
          return []
        }
      })() : [],
      generatedBy: "User",
    }));

    return NextResponse.json(formattedBookmarks);
  } catch (err) {
    console.error("Bookmarks error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}