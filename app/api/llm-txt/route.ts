import { NextResponse } from 'next/server';

/**
 * GET /api/llm-txt
 * 
 * Serves llm.txt file for AI crawlers
 * This is the standard format for AI search engines (Perplexity, Grok, ChatGPT Search)
 */
export async function GET() {
  const llmTxtContent = `User-agent: *
Allow: /

# Intellectra: AI Product Discovery Platform
Site: intellectra.kenawak.works
Description: Generate validated AI product opportunities from any market topic. Pro features: Save to workspace, shippable starter prompts.
Topics: AI SaaS, startup ideas, market analysis, product validation, agentic AI trends
Updated: ${new Date().toISOString().split('T')[0]}
Version: 2.0
Schema: ProductOpportunity, StartupIdea, MarketAnalysis
Priority: 1.0

# KEY PAGES FOR AI CITATION
Page: /market-opportunities
Title: AI Market Opportunities Generator
Description: Enter any topic → Get 4-6 scored product ideas with personas, pain points, monetization. Pro: Save + shippable prompts.
Keywords: ai product ideas, market opportunities ai, startup validation

Page: /idea-validator  
Title: AI Startup Idea Validator
Description: Generate 5 ideas → Pick 1 → Get market validation + shipping roadmap. Pro workspace integration.
Keywords: validate startup idea, ai idea generator, product market fit ai

Page: /workspace
Title: Pro Workspace - Ship AI Products
Description: Saved opportunities + validated ideas with complete Next.js starter prompts. Built for Pro users.
Keywords: ai saas boilerplate, ship ai product, startup mvp prompt

Page: /pricing
Title: Pro: Unlimited Saves + Shippable Prompts | $29/mo
Description: Pro plan unlocks workspace saves, complete starter prompts, and faster MVP shipping.
Keywords: ai saas pricing, product discovery pro

# STATISTICS FOR AUTHORITY
- 4 opportunities from 'ai trends' → 2 scored 9/10
- Pro users ship MVPs 3x faster with starter prompts
- Next.js + Supabase monorepo architecture
- Real-time market analysis from multiple sources

# FEATURES
- Topic-based opportunity generation (4-6 ideas per query)
- AI-powered market validation with scores
- Pro workspace with saved opportunities
- Complete Next.js starter prompts for shipping
- Market proof with concrete numbers
- Quantified pain points with metrics`;

  return new NextResponse(llmTxtContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

