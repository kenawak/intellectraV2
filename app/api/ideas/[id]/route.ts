import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { bookmarkedIdea } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });
    const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [ideaData] = await db.select().from(bookmarkedIdea).where(and(eq(bookmarkedIdea.id, id), eq(bookmarkedIdea.userId, userId)));

    if (!ideaData) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Return the idea data
    return NextResponse.json({
      id: ideaData.id,
      title: ideaData.title,
      summary: ideaData.summary,
      unmet_needs: ideaData.unmetNeeds,
      product_idea: ideaData.productIdea,
      proof_of_concept: ideaData.proofOfConcept,
      source_url: ideaData.sourceUrl,
      prompt_used: ideaData.promptUsed,
      confidenceScore: ideaData.confidenceScore,
      suggestedPlatforms: ideaData.suggestedPlatforms,
      createdAt: ideaData.createdAt,
      generatedBy: "User",
      requirements: ideaData.requirements,
      design: ideaData.design,
      tasks: ideaData.tasks,
      codeStubs: ideaData.codeStubs,
      cursorPrompt: ideaData.cursorPrompt,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}