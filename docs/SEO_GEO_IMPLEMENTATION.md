# SEO/GEO Implementation Guide

## Overview

Comprehensive AI-first SEO and Generative Engine Optimization (GEO) implementation for Intellectra to rank #1 for target keywords in AI search engines (Perplexity, Grok, ChatGPT Search) and Google.

## Target Keywords

- "ai product opportunity generator"
- "startup idea validator ai"
- "market analysis ai tool"
- "ship ai saas product"
- "ai saas boilerplate prompts"

## Implementation Checklist

### ✅ 1. llm.txt (AI Crawler Standard)
- **File**: `/public/llm.txt`
- **API Route**: `/api/llm-txt` (served via rewrite)
- **Purpose**: Standard format for AI search engines to understand site structure
- **Content**: Site description, key pages, features, statistics

### ✅ 2. robots.txt
- **File**: `/public/robots.txt`
- **Purpose**: Allow all AI crawlers (GPTBot, Google-Extended, PerplexityBot, etc.)
- **Features**: 
  - Allows all user agents
  - Specific rules for AI crawlers
  - Sitemap reference

### ✅ 3. Sitemap
- **API Route**: `/api/sitemap` (served as `/sitemap.xml` via rewrite)
- **Purpose**: Help search engines discover all pages
- **Pages Included**:
  - Homepage (priority 1.0)
  - Market Opportunities (priority 0.9)
  - Idea Validator (priority 0.9)
  - Workspace (priority 0.8)
  - Pricing (priority 0.8)
  - Auth pages (priority 0.5)

### ✅ 4. Structured Data (Schema.org)
- **Component**: `components/SEO/StructuredData.tsx`
- **Library**: `lib/seo.ts`
- **Types**:
  - SoftwareApplication schema for key pages
  - Organization schema
  - WebSite schema with search action
  - FAQ schema (ready for use)
  - BreadcrumbList schema (ready for use)

### ✅ 5. Page Metadata
- **Root Layout**: `app/layout.tsx` - Global metadata
- **Page Layouts**:
  - `app/dashboard/market-opportunities/layout.tsx`
  - `app/dashboard/idea-validator/layout.tsx`
  - `app/dashboard/workspace/layout.tsx`
  - `app/pricing/layout.tsx`

### ✅ 6. Next.js Configuration
- **File**: `next.config.ts`
- **Rewrites**:
  - `/llm.txt` → `/api/llm-txt`
  - `/sitemap.xml` → `/api/sitemap`

### ✅ 7. SEO Components
- **StructuredData**: Injects JSON-LD structured data
- **FeaturedSnippet**: Optimizes for featured snippets + PostHog tracking

### ✅ 8. PostHog GEO Tracking
- **Event**: `GEO Page Viewed`
- **Properties**: `page`, `keywords`, `title`
- **Implementation**: `components/SEO/FeaturedSnippet.tsx`

## Key Page Optimizations

### Market Opportunities Page
- **Title**: "AI Market Opportunities: Generate 9/10 Ideas Instantly"
- **Description**: "Enter any topic → Get 4-6 scored product ideas with personas, pain points, monetization. Pro: Save + shippable prompts."
- **Keywords**: ai product ideas, market opportunities ai, startup validation
- **Structured Data**: SoftwareApplication schema

### Idea Validator Page
- **Title**: "Validate Startup Ideas with AI → Market Proof + Ship"
- **Description**: "Generate 5 ideas → Pick 1 → Get market validation + shipping roadmap. Pro workspace integration."
- **Keywords**: validate startup idea, ai idea generator, product market fit ai
- **Structured Data**: SoftwareApplication schema

### Workspace Page
- **Title**: "Pro Workspace - Ship AI Products"
- **Description**: "Saved opportunities + validated ideas with complete Next.js starter prompts. Built for Pro users."
- **Keywords**: ai saas boilerplate, ship ai product, startup mvp prompt
- **Structured Data**: SoftwareApplication schema

### Pricing Page
- **Title**: "Pro: Unlimited Saves + Shippable Prompts | $29/mo"
- **Description**: "Pro plan unlocks workspace saves, complete starter prompts, and faster MVP shipping."
- **Keywords**: ai saas pricing, product discovery pro
- **Structured Data**: SoftwareApplication schema

## Statistics for Authority

- "4 opportunities from 'ai trends' → 2 scored 9/10"
- "Pro users ship MVPs 3x faster with starter prompts"
- "Next.js + Supabase monorepo architecture"
- "Real-time market analysis from multiple sources"

## Testing Checklist

1. **llm.txt Access**
   ```bash
   curl https://intellectra.kenawak.works/llm.txt
   ```

2. **Sitemap Access**
   ```bash
   curl https://intellectra.kenawak.works/sitemap.xml
   ```

3. **robots.txt Access**
   ```bash
   curl https://intellectra.kenawak.works/robots.txt
   ```

4. **Structured Data Validation**
   - Use [Google Rich Results Test](https://search.google.com/test/rich-results)
   - Use [Schema.org Validator](https://validator.schema.org/)

5. **AI Search Engine Testing**
   - Search Perplexity.ai: "ai product ideas"
   - Search Grok: "startup idea validator"
   - Search ChatGPT Search: "market analysis ai tool"

6. **PostHog Events**
   - Verify `GEO Page Viewed` events are firing
   - Check event properties in PostHog dashboard

## Deployment Checklist

- [x] llm.txt file created
- [x] robots.txt updated
- [x] Sitemap API route created
- [x] Next.js rewrites configured
- [x] Structured data components created
- [x] Page metadata added to layouts
- [x] PostHog GEO tracking implemented
- [ ] Deploy to production
- [ ] Submit sitemap to Google Search Console
- [ ] Test all URLs
- [ ] Monitor PostHog events
- [ ] Track rankings in AI search engines

## Future Enhancements

1. **FAQ Schema**: Add FAQ sections to key pages
2. **Breadcrumb Schema**: Add breadcrumb navigation
3. **Article Schema**: For blog posts (if added)
4. **Review Schema**: For user testimonials
5. **Video Schema**: For product demos (if added)

## Resources

- [llm.txt Specification](https://llmtext.org/)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)

