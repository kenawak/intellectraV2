import dotenv from 'dotenv';
dotenv.config();
import { Exa } from "exa-js";
import { GoogleGenAI } from "@google/genai";
import { db } from '@/db/drizzle';
import { idea } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

const exa = new Exa(process.env.EXASEARCH_API_KEY);
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateDeveloperSaaSIdeas(formattedPosts: string) {
  const res = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{
          text: `
          You are an assistant helping identify SaaS or side project opportunities from real developer content.

          Below are recent posts from developers:\n\n${formattedPosts}\n\n

          For each post, return a JSON object in this format:

          {
            "title": "3–4 word concept label (e.g., 'Async Code Reviewer', 'DevOps Incident Mapper')",
            "summary": "<1–2 sentence summary of what the user is experiencing>",
            "unmet_needs": ["<1–2 key pain points or gaps developers are expressing>"],
            "product_idea": ["<1 original SaaS or tool idea to solve these>"],
            "proof_of_concept": "<Why this idea makes sense. Include 1 short quote or evidence from the post if possible.>",
            "source_url": "<URL to the original post>",

            "confidenceScore": <1–100, how strong this idea feels>,
            "suggestedPlatforms": ["Reddit", "X", "IndieHackers"],
            "creationDate": "<e.g. 'May 10, 2025'>",
            "ideaSource": "<e.g. 'Reddit comment thread', 'IndieHackers post', or 'Developer Portal Analysis'>"
          }

          Guidelines:
          - Focus on *developers* (indie hackers, devs, engineers).
          - Extract *non-obvious*, clearly stated or implied needs.
          - Be specific and concise.
          - Only return a raw JSON array. No text, markdown, or explanation.
          `
        }]
      }
    ]
  });
  console.log("res from gemini", res)
  const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log("text from gemini", text)
  if (!text) throw new Error("No response from Gemini");
  const cleanedResponse = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return { text: cleanedResponse, usage: res.usageMetadata };
}

async function fetchRecentDeveloperPosts(query: string) {
  const { results } = await exa.searchAndContents(query, {
    text: true,
    numResults: 5,
    site: ["reddit.com", "x.com", "indiehackers.com"],
    date: "past_30_days"
  });

  return results
    .filter(p => !p.url.includes("exa.ai"))
    .map((post, i) => {
      return `Post ${i + 1}:\n"${post.text}"\nURL: ${post.url}\n`;
    }).join("\n");
}

function saveContent(content: string) {
  try {
    fs.writeFile("./content_generated.json", content, err => {
      if (err) {
        console.log(err.message)
      }
      console.log("Content saved successfully.");
    });
  } catch (err) {
    console.error("Error writing to file:", err);
  }
}

export async function generateIdeas(query: string = "developer tool pain points") {
  try {
    const posts = await fetchRecentDeveloperPosts(query);
    const result = await generateDeveloperSaaSIdeas(posts);
    const { text: ideasJson, usage } = result;
    const parsedIdeas = JSON.parse(ideasJson);

    // First save ALL ideas to public collection (they'll be removed if bookmarked later)
    const sanitizedIdeas = parsedIdeas.map((idea: any) => ({
      id: crypto.randomUUID(),
      title: idea.title,
      summary: idea.summary,
      unmetNeeds: idea.unmet_needs ?? [],
      productIdea: idea.product_idea ?? [],
      proofOfConcept: idea.proof_of_concept ?? "",
      sourceUrl: idea.source_url ?? null,
      promptUsed: query,
      confidenceScore: idea.confidenceScore ?? null,
      suggestedPlatforms: idea.suggestedPlatforms ?? [],
      creationDate: idea.creationDate ?? "",
      ideaSource: idea.ideaSource ?? "",
    }));

    // Insert many, ignore duplicates on source_url
    for (const ideaData of sanitizedIdeas) {
      try {
        await db.insert(idea).values(ideaData).onConflictDoNothing();
      } catch (err) {
        // Ignore duplicate key errors
      }
    }

    return { ideas: parsedIdeas, usage };
  } catch (err) {
    console.error(err);
    throw err;
  }
}