'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { usePostHog } from '@posthog/react';
import { useRouter } from 'next/navigation';
import type { ProductIdea } from '@/lib/unified-search-service';

interface SaveOpportunityButtonProps {
  opportunity: ProductIdea;
  topic: string;
  isPro: boolean;
}

export function SaveOpportunityButton({ opportunity, topic, isPro }: SaveOpportunityButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const posthog = usePostHog();
  const router = useRouter();

  const handleSave = async () => {
    if (!isPro) {
      toast.error('Upgrade to Pro to save opportunities to your workspace');
      router.push('/pricing');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/workspace/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          topic,
          opportunityName: opportunity.title,
          persona: opportunity.niche,
          score: opportunity.viability_score,
          painPoint: opportunity.pain_point,
          monetization: opportunity.monetization_strategy,
          coreFeatures: opportunity.core_features,
          marketProof: opportunity.market_proof,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save opportunity');
      }

      // Track PostHog event
      posthog?.capture('Opportunity Saved', {
        opportunity_name: opportunity.title,
        score: opportunity.viability_score,
        topic,
      });

      posthog?.capture('Pro Feature Used: Opportunity Saved', {
        opportunity_name: opportunity.title,
        score: opportunity.viability_score,
        topic,
      });

      toast.success('Opportunity saved to workspace!');
      
      // Redirect to workspace after a short delay
      setTimeout(() => {
        router.push('/dashboard/workspace');
      }, 1000);
    } catch (error) {
      console.error('Error saving opportunity:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save opportunity');
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
          toast.error('Upgrade to Pro to save opportunities');
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

