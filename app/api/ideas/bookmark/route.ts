import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUser } from '@/lib/auth-utils';
import { db } from '@/db/drizzle';
import { bookmarkedIdea, idea } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // const session = await requireAuth(req);
    // const userId = session.user.id;
    const userId = 'VOeNpacxjN1pLXXxgzvLmyG8y9PeEwb6'; // Real user ID

    const ideaData = await req.json();

    // Delete from public ideas if exists
    await db.delete(idea).where(eq(idea.sourceUrl, ideaData.source_url));

    const validFields = [
      "title",
      "summary",
      "unmet_needs",
      "product_idea",
      "proof_of_concept",
      "source_url",
      "prompt_used",
    ];

    const filteredData = Object.fromEntries(Object.entries(ideaData).filter(([key]) => validFields.includes(key))) as any;

    if (!filteredData.title || !filteredData.summary) {
      return NextResponse.json({ error: "title and summary are required" }, { status: 400 });
    }

    const dataToSave = {
      id: crypto.randomUUID(),
      userId,
      title: filteredData.title,
      summary: filteredData.summary,
      unmetNeeds: filteredData.unmet_needs || [],
      productIdea: filteredData.product_idea || [],
      proofOfConcept: filteredData.proof_of_concept || "",
      sourceUrl: filteredData.source_url || null,
      promptUsed: filteredData.prompt_used || null,
    } as typeof bookmarkedIdea.$inferInsert;

    const saved = await db.insert(bookmarkedIdea).values(dataToSave).returning();

    const formattedIdea = {
      ...saved[0],
      createdAt: saved[0].createdAt.toISOString(),
      confidenceScore: 85,
      suggestedPlatforms: ["Web", "Mobile"],
    };

    return NextResponse.json({ message: "Bookmarked successfully", idea: formattedIdea }, { status: 201 });
  } catch (err) {
    console.error("Bookmark error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // const session = await requireAuth(req);
    // const userId = session.user.id;
    const userId = 'VOeNpacxjN1pLXXxgzvLmyG8y9PeEwb6'; // Real user ID
    const { source_url, title } = await req.json();

    if (!source_url || !title) {
      return NextResponse.json({ error: "source_url and title are required" }, { status: 400 });
    }

    const result = await db.delete(bookmarkedIdea).where(and(eq(bookmarkedIdea.userId, userId), eq(bookmarkedIdea.sourceUrl, source_url), eq(bookmarkedIdea.title, title)));

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    // Restore to public if title and summary provided
    const ideaData = await req.json();
    if (ideaData.title && ideaData.summary) {
      const publicIdea = {
        id: crypto.randomUUID(),
        title: ideaData.title,
        summary: ideaData.summary,
        unmetNeeds: ideaData.unmet_needs || [],
        productIdea: ideaData.product_idea || [],
        proofOfConcept: ideaData.proof_of_concept || "",
        sourceUrl: ideaData.source_url || "",
        promptUsed: ideaData.prompt_used || "",
        createdAt: new Date(),
      };
      await db.insert(idea).values(publicIdea);
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
      confidenceScore: 85,
      suggestedPlatforms: ["Web", "Mobile"],
    }));

    return NextResponse.json(formattedBookmarks);
  } catch (err) {
    console.error("Error in DELETE bookmark:", err);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}