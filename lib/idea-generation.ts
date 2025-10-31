import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { db } from '@/db/drizzle';
import { idea } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import { SearchProviderFactory, SearchProvider, SearchOptions } from './search-providers';

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Utility function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateDeveloperSaaSIdeas(formattedPosts: string) {
  const MAX_RETRIES = 5; // Maximum number of times to retry the API call

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempting to generate content (Attempt ${attempt + 1}/${MAX_RETRIES})...`);

      const res = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{
              text: `
              You are an assistant helping developers discover cool side project ideas based on real developer problems and needs.

              Below are recent posts from developers. Each post includes its source site:\n\n${formattedPosts}\n\n

              For each post, return a JSON object in this format:

              {
                "title": "3–4 word concept label (e.g., 'Async Code Reviewer', 'DevOps Incident Mapper', 'CLI Tool for X')",
                "summary": "<1–2 sentence summary of what the developer is experiencing or the technical problem they're facing. Be SPECIFIC and concrete, not vague. Focus on actual coding/development pain points.>",
                "unmet_needs": ["<1–2 SPECIFIC technical pain points or gaps developers are expressing related to building, coding, or development workflow. Avoid business/marketing/sales concerns.>"],
                "product_idea": ["<1 SPECIFIC side project or developer tool idea that solves these technical problems. Be concrete about what the tool/app does, what tech it uses, and how it helps developers build something cool. Focus on buildable projects, not business concepts.>"],
                "proof_of_concept": "<Why this idea makes sense for developers to build. Include 1 short DIRECT quote from the post if possible. Reference the specific source site.>",
                "source_url": "<EXACT URL from the post above>",
                "source_site": "<Extract the domain/site name from the source_url (e.g., 'reddit.com', 'indiehackers.com')>",

                "confidenceScore": <1–100, how strong this idea feels based on concrete evidence>,
                "suggestedPlatforms": [{"name": "Platform Name", "link": "https://example.com"}, ...],
                "creationDate": "<Current date in format 'Month Day, Year'>",
                "ideaSource": "<Format: 'Source Site Name - Post Type' (e.g., 'Reddit - r/SideProject', 'Indie Hackers - Forum Post', 'Hacker News - Discussion')>"
              }

              CRITICAL Guidelines for DEVELOPER SIDE PROJECTS:
              - Focus EXCLUSIVELY on *developers, engineers, and indie hackers* who want to BUILD something cool or solve technical problems.
              - IGNORE and SKIP: generic business content, entrepreneurship tips, marketing advice, fundraising, business strategy, founder stories, or anything not directly related to BUILDING/CODING.
              - PRIORITIZE: technical problems, coding challenges, development workflow pain points, missing tools/libraries, automation needs, developer productivity issues, or cool unique features developers want to build.
              - Extract *SPECIFIC, concrete TECHNICAL* needs - focus on what developers struggle with when BUILDING things, not when running businesses.
              - product_idea should be a BUILDABLE side project (CLI tool, API, library, web app, browser extension, etc.) that a developer can create, not a business plan.
              - Be SPECIFIC in product ideas - what exactly does the tool/app do? What tech stack would work? How does it help developers build something unique?
              - IMPORTANT: The source_url MUST match exactly one of the URLs provided in the posts above.
              - Extract source_site from the URL (the domain name).
              - ideaSource should clearly indicate WHERE the problem was found (e.g., "Reddit - r/SideProject", "Indie Hackers - Forum Discussion").
              - Only return ideas from posts that have ACTUAL developer technical problems or coding pain points clearly expressed.
              - For suggestedPlatforms, suggest developer-focused platforms (GitHub, Product Hunt, Dev.to, etc.) where side projects can be shared.
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

      // Successful response, return the result
      return { text: cleanedResponse, usage: res.usageMetadata };

    } catch (error: any) {
      // The API error you were experiencing has a 'status' property of 503
      // We check for it and if we have retries left
      if (error.status === 503 && attempt < MAX_RETRIES - 1) {
        // Calculate exponential backoff time: (2^attempt) * 1000 milliseconds
        // e.g., 1st retry: 2^1 * 1s = 2s, 2nd: 2^2 * 1s = 4s, 3rd: 2^3 * 1s = 8s
        const backoffTime = Math.pow(2, attempt + 1) * 1000;
        console.warn(`[API_ERROR] Attempt ${attempt + 1} failed with status 503 (Service Unavailable). Retrying in ${backoffTime / 1000}s...`);
        await delay(backoffTime);
        continue; // Continue to the next loop iteration (retry)
      }

      // If it's a different error, or the last retry failed, log and re-throw it
      console.error(`[FATAL_ERROR] All retries failed or a non-503 error occurred on attempt ${attempt + 1}.`);
      throw error;
    }
  }

  // Should be unreachable if MAX_RETRIES > 0, but good for type safety
  throw new Error("Failed to generate content after all retries.");
}


async function fetchRecentDeveloperPosts(
  query: string,
  provider: SearchProvider = 'exa',
  sites?: string[],
  numResults: number = 5
) {
  const searchProvider = SearchProviderFactory.getProvider(provider);
  
  const searchOptions: SearchOptions = {
    sites: sites && sites.length > 0 ? sites : undefined, // If no sites specified, search all
    numResults,
    date: "past_30_days"
  };

  const results = await searchProvider.search(query, searchOptions);

  // Extract domain from URL for better source identification
  const formatSource = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Fallback: extract domain manually
      const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
      return match ? match[1] : 'unknown';
    }
  };

  return results
    .map((post, i) => {
      const source = formatSource(post.url);
      return `Post ${i + 1} [Source: ${source}]:\n"${post.text}"\nURL: ${post.url}\n---\n`;
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

export async function generateIdeas(
  query: string = "developer side project ideas coding problems",
  provider: SearchProvider = 'exa',
  sites?: string[],
  numResults: number = 5
) {
  try {
    const posts = await fetchRecentDeveloperPosts(query, provider, sites, numResults);
    // This call now includes the retry logic
    const result = await generateDeveloperSaaSIdeas(posts); 
    const { text: ideasJson, usage } = result;
    const parsedIdeas = JSON.parse(ideasJson);

    // First save ALL ideas to public collection (they'll be removed if bookmarked later)
    const sanitizedIdeas = parsedIdeas.map((idea: any) => {
      // Extract source_site if not provided, fallback to extracting from source_url
      let sourceSite = idea.source_site || "";
      if (!sourceSite && idea.source_url) {
        try {
          const urlObj = new URL(idea.source_url);
          sourceSite = urlObj.hostname.replace(/^www\./, '');
        } catch {
          // Fallback extraction
          const match = idea.source_url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
          sourceSite = match ? match[1] : 'unknown';
        }
      }
      
      return {
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
        ideaSource: idea.ideaSource ?? (sourceSite || 'Unknown'),
      };
    });

    // Insert many, ignore duplicates on source_url
    for (const ideaData of sanitizedIdeas) {
      try {
        await db.insert(idea).values(ideaData).onConflictDoNothing();
      } catch (err: any) {
        // Ignore duplicate key errors (unique constraint on sourceUrl)
        // Error code 23505 is PostgreSQL's unique constraint violation
        if (err?.code === '23505' || err?.constraint === 'idea_source_url_unique') {
          console.log(`Skipping duplicate idea with source_url: ${ideaData.sourceUrl}`);
          continue;
        }
        // Re-throw other errors
        throw err;
      }
    }

    return { ideas: parsedIdeas, usage };
  } catch (err) {
    console.error(err);
    throw err;
  }
}