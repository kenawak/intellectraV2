import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import { db } from '@/db/drizzle';
import { idea } from '@/db/schema';
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
              You are Intellectra's Global Idea Engine - analyzing real user posts from TikTok, Reddit, X (Twitter) to surface high-value, trend-driven, money-making business opportunities.

              Below are recent posts from users across social platforms. Each post includes its source site:\n\n${formattedPosts}\n\n

              For each post, return a JSON object in this format:

              {
                "title": "Catchy, market-ready business name (e.g., 'No-Show Shield', 'AI Meal Prep Planner', 'Creator Revenue Optimizer', 'Local Service Booking App')",
                "summary": "<1–2 sentence summary of the pain point, trend, or opportunity being discussed. Be SPECIFIC - what problem are people expressing? What trend is emerging? Focus on real demand signals.>",
                "unmet_needs": ["<1–2 SPECIFIC pain points, gaps, or opportunities people are expressing. Can be technical, business, consumer, or lifestyle-related. Focus on what people are actively complaining about or requesting.>"],
                "product_idea": ["<1 SPECIFIC business idea that solves this problem. Can be: app, service, physical product, digital product, tool, platform, etc. Be concrete about what it does and who it serves. Include simple MVP approach if applicable.>"],
                "proof_of_concept": "<Why this idea makes sense NOW. Include 1 short DIRECT quote from the post if possible. Reference the specific source site. Mention trend velocity, viral signal, or demand strength.>",
                "source_url": "<EXACT URL from the post above>",
                "source_site": "<Extract the domain/site name from the source_url (e.g., 'reddit.com', 'tiktok.com', 'x.com')>",

                "confidenceScore": <1–100, how strong this idea feels based on: discussion volume, pain point clarity, monetization potential, trend velocity>,
                "suggestedPlatforms": [{"name": "Platform Name", "link": "https://example.com"}, ...],
                "creationDate": "<Current date in format 'Month Day, Year'>",
                "ideaSource": "<Format: 'Source Site Name - Post Type' (e.g., 'Reddit - r/entrepreneur', 'TikTok - Business Tips', 'X - Startup Discussion')>"
              }

              CRITICAL Guidelines for UNIVERSAL BUSINESS IDEAS:
              - Focus on ANY user - consumers, creators, local businesses, solopreneurs, not just developers
              - PRIORITIZE: Viral patterns, trending pain points, emerging opportunities, underserved markets, fast-moving trends
              - EXTRACT: Real demand signals from posts - what are people complaining about? What are they requesting? What trends are gaining momentum?
              - INDUSTRY DIVERSITY: Include ideas from Consumer apps, Local businesses, Physical products, Wellness/Fitness/Beauty, Finance/Productivity, AI tools for non-technical users, Creators/Influencers, Hospitality/Food/Entertainment, Niche communities, Emerging trends
              - MONETIZATION: Every idea should have clear revenue potential ($100+ MRR) - subscription, usage-based, marketplace, affiliate, digital products, etc.
              - MVP-FOCUSED: Ideas should be buildable in weeks, not months - simple, fast-to-market
              - AVOID: Over-technical jargon (unless post is specifically developer-focused), generic "app ideas", hard-to-monetize hobby concepts, overcomplicated enterprise solutions
              - TONE: Honest, data-driven, trend-aware, clear, simple, actionable
              - IMPORTANT: The source_url MUST match exactly one of the URLs provided in the posts above
              - Extract source_site from the URL (the domain name)
              - ideaSource should clearly indicate WHERE the opportunity was found
              - For suggestedPlatforms, suggest relevant platforms based on idea type (Product Hunt, TikTok, Reddit communities, industry-specific platforms, etc.)
              - Only return ideas from posts that show REAL demand, pain points, or trending opportunities
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

    } catch (error: unknown) {
      // The API error you were experiencing has a 'status' property of 503
      // We check for it and if we have retries left
      const apiError = error as { status?: number };
      if (apiError.status === 503 && attempt < MAX_RETRIES - 1) {
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
    const sanitizedIdeas = parsedIdeas.map((idea: Record<string, unknown>) => {
      // Extract source_site if not provided, fallback to extracting from source_url
      let sourceSite = typeof idea.source_site === 'string' ? idea.source_site : "";
      if (!sourceSite && typeof idea.source_url === 'string' && idea.source_url) {
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
      } catch (err: unknown) {
        // Ignore duplicate key errors (unique constraint on sourceUrl)
        // Error code 23505 is PostgreSQL's unique constraint violation
        const dbError = err as { code?: string; constraint?: string };
        if (dbError.code === '23505' || dbError.constraint === 'idea_source_url_unique') {
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