'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { usePostHog } from '@posthog/react';
import { useRouter } from 'next/navigation';

interface IdeaValidationResult {
  quickSummary: {
    clarifiedIdea: string;
    coreProblem: string;
  };
  platformRecommendation: {
    recommended: string[];
    reasoning: string;
  };
  marketValidation: {
    makesSense: boolean;
    demandLevel: 'low' | 'medium' | 'high';
    targetCustomers: string[];
    painPoints: string[];
  };
  profitability: {
    monetizationRoutes: string[];
    marketSize: string;
    technicalComplexity: 'low' | 'medium' | 'high';
    soloFounderFeasible: boolean;
  };
  executionRoadmap: {
    mvp: string[];
    keyFeatures: string[];
    futureFeatures: string[];
  };
  strengths: string[];
  redFlags: string[];
  assumptions: string[];
  links: Array<{
    title: string;
    url: string;
    source: string;
  }>;
  competitiveAnalysis: {
    competitors: Array<{
      name: string;
      url: string;
      description: string;
      differentiation: string;
    }>;
  };
}

interface SaveValidatedIdeaButtonProps {
  ideaName: string;
  validation: IdeaValidationResult;
  validationScore: number;
  isPro: boolean;
}

export function SaveValidatedIdeaButton({
  ideaName,
  validation,
  validationScore,
  isPro,
}: SaveValidatedIdeaButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const posthog = usePostHog();
  const router = useRouter();

  const handleSave = async () => {
    if (!isPro) {
      toast.error('Upgrade to Pro to save validated ideas to your workspace');
      router.push('/pricing');
      return;
    }

    setIsSaving(true);

    try {
      const targetMarket = validation.marketValidation.targetCustomers.join(', ') || undefined;

      const response = await fetch('/api/workspace/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ideaName,
          validationScore,
          targetMarket,
          validationData: validation,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save idea');
      }

      // Track PostHog events
      posthog?.capture('Idea Validated And Saved', {
        idea_name: ideaName,
        validation_score: validationScore,
      });

      posthog?.capture('Pro Feature Used: Idea Validated Saved', {
        idea_name: ideaName,
        validation_score: validationScore,
      });

      toast.success('Validated idea saved to workspace!');
      
      // Redirect to workspace after a short delay
      setTimeout(() => {
        router.push('/dashboard/workspace');
      }, 1000);
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save idea');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isPro) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          toast.error('Upgrade to Pro to save validated ideas');
          router.push('/pricing');
        }}
        className="gap-2"
      >
        <Lock className="h-4 w-4" />
        Save to Workspace
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={isSaving}
      className="gap-2"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          Save to Workspace
        </>
      )}
    </Button>
  );
}

