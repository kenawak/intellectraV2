/**
 * Workspace Service
 * 
 * Functions for saving and retrieving workspace items (opportunities and validated ideas)
 */

import { randomUUID } from 'crypto';
import { db } from '@/db/drizzle';
import { workspaceOpportunity, workspaceIdea } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import type { SaveOpportunityPayload, SaveIdeaPayload } from '@/types/workspace';

/**
 * Generate starter prompt for an opportunity
 */
export function generateOpportunityStarterPrompt(
  opportunity: SaveOpportunityPayload
): string {
  const { opportunityName, persona, painPoint, monetization, coreFeatures } = opportunity;
  
  const featuresList = coreFeatures
    .map((feature, index) => `${index + 1}. ${feature} - Implementation details...`)
    .join('\n    ');

  return `Build ${opportunityName} MVP in Next.js 15+ TypeScript App Router. Target: ${persona}. Pain: ${painPoint}.

TECH STACK: Next.js, Supabase Auth/DB, shadcn/ui, Phosphor icons, Biome linting, Bun, PostHog analytics.
MONETIZATION: Integrate ${monetization} with Stripe/Supabase payments.

MVP FEATURES (Shippable in 1 week):
    ${featuresList}
    4. Landing page: Hero, Features, Pricing, Testimonials (Pro structure)
    5. User onboarding flow with role selection (Coach/Dev/Entrepreneur)
    6. Workspace integration for saved opportunities

OUTPUT: Complete file structure + key components (layout.tsx, page.tsx, api routes).
Include: SEO metadata, responsive design, Pro gating, PostHog events for saved tracking.`;
}

/**
 * Generate starter prompt for a validated idea
 */
export function generateIdeaStarterPrompt(
  idea: SaveIdeaPayload,
  validationData?: Record<string, unknown>
): string {
  const { ideaName, validationScore, targetMarket } = idea;
  
  const marketInfo = targetMarket ? ` for ${targetMarket}` : '';
  
  // Safely access nested properties with proper type checking
  const profitability = validationData?.profitability as Record<string, unknown> | undefined;
  const competitiveAnalysis = validationData?.competitiveAnalysis as Record<string, unknown> | undefined;
  
  const marketSize = (profitability?.marketSize as string | undefined) || 'TBD';
  const monetizationRoutes = profitability?.monetizationRoutes as string[] | undefined;
  const monetizationRoute = monetizationRoutes && monetizationRoutes.length > 0 
    ? monetizationRoutes[0] 
    : 'recommended pricing';
  const technicalComplexity = (profitability?.technicalComplexity as string | undefined) || 'medium';
  const soloFounderFeasible = (profitability?.soloFounderFeasible as boolean | undefined) ?? false;
  
  const competitors = competitiveAnalysis?.competitors as Array<unknown> | undefined;
  const competitionGap = competitors ? competitors.length : 0;
  
  return `Ship ${ideaName} - Market validated ${validationScore}/10${marketInfo}.

PRIORITY 1 MVP (Next.js + Supabase, 5 days):
- Core value prop implementation from validation
- Stripe integration for ${monetizationRoute}
- Landing page with social proof placeholders
- User auth + workspace sync
- PostHog events for all key flows

TECHNICAL ARCHITECTURE:
[Detailed Next.js monorepo structure matching Intellectra stack]
- Next.js 15 App Router with TypeScript
- Supabase for auth and database
- shadcn/ui components
- PostHog analytics
- Vercel deployment

SUCCESS METRICS FROM VALIDATION:
- Market size: ${marketSize}
- Competition gap: ${competitionGap} competitors identified
- Technical complexity: ${technicalComplexity}
- Solo founder feasible: ${soloFounderFeasible ? 'Yes' : 'No'}

Generate: Full project scaffold, docker-compose, deployment script to Vercel.`;
}

/**
 * Save opportunity to workspace
 */
export async function saveOpportunity(
  userId: string,
  payload: SaveOpportunityPayload
): Promise<string> {
  const starterPrompt = generateOpportunityStarterPrompt(payload);
  
  const [saved] = await db
    .insert(workspaceOpportunity)
    .values({
      id: randomUUID(),
      userId,
      topic: payload.topic,
      opportunityName: payload.opportunityName,
      persona: payload.persona,
      score: payload.score,
      painPoint: payload.painPoint,
      monetization: payload.monetization,
      coreFeatures: payload.coreFeatures,
      marketProof: payload.marketProof,
      starterPrompt,
    })
    .returning({ id: workspaceOpportunity.id });

  return saved.id;
}

/**
 * Save validated idea to workspace
 */
export async function saveIdea(
  userId: string,
  payload: SaveIdeaPayload
): Promise<string> {
  const starterPrompt = generateIdeaStarterPrompt(payload, payload.validationData);
  
  const [saved] = await db
    .insert(workspaceIdea)
    .values({
      id: randomUUID(),
      userId,
      ideaName: payload.ideaName,
      validationScore: payload.validationScore,
      targetMarket: payload.targetMarket,
      validationData: payload.validationData || {},
      starterPrompt,
    })
    .returning({ id: workspaceIdea.id });

  return saved.id;
}

/**
 * Get all opportunities for a user
 */
export async function getUserOpportunities(userId: string) {
  return await db
    .select()
    .from(workspaceOpportunity)
    .where(eq(workspaceOpportunity.userId, userId))
    .orderBy(desc(workspaceOpportunity.createdAt));
}

/**
 * Get all validated ideas for a user
 */
export async function getUserIdeas(userId: string) {
  return await db
    .select()
    .from(workspaceIdea)
    .where(eq(workspaceIdea.userId, userId))
    .orderBy(desc(workspaceIdea.createdAt));
}

/**
 * Delete an opportunity
 */
export async function deleteOpportunity(opportunityId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(workspaceOpportunity)
    .where(
      and(
        eq(workspaceOpportunity.id, opportunityId),
        eq(workspaceOpportunity.userId, userId)
      )
    );
  
  return result.rowCount ? result.rowCount > 0 : false;
}

/**
 * Delete a validated idea
 */
export async function deleteIdea(ideaId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(workspaceIdea)
    .where(
      and(
        eq(workspaceIdea.id, ideaId),
        eq(workspaceIdea.userId, userId)
      )
    );
  
  return result.rowCount ? result.rowCount > 0 : false;
}

