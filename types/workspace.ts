/**
 * Workspace Types
 * 
 * TypeScript interfaces for workspace saved items
 */

export interface WorkspaceOpportunity {
  id: string;
  userId: string;
  topic: string;
  opportunityName: string;
  persona: string;
  score: number;
  painPoint: string;
  monetization: string;
  coreFeatures: string[];
  marketProof?: string;
  starterPrompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceIdea {
  id: string;
  userId: string;
  ideaName: string;
  validationScore: number;
  targetMarket?: string;
  validationData?: Record<string, unknown>;
  starterPrompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveOpportunityPayload {
  topic: string;
  opportunityName: string;
  persona: string;
  score: number;
  painPoint: string;
  monetization: string;
  coreFeatures: string[];
  marketProof?: string;
}

export interface SaveIdeaPayload {
  ideaName: string;
  validationScore: number;
  targetMarket?: string;
  validationData?: Record<string, unknown>;
}

