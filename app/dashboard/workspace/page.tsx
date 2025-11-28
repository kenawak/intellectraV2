'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Play, FileText, Target, Sparkles, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePostHog } from '@posthog/react';

interface WorkspaceOpportunity {
  id: string;
  topic: string;
  opportunityName: string;
  persona: string;
  score: number;
  painPoint: string;
  monetization: string;
  coreFeatures: string[];
  marketProof?: string;
  starterPrompt: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceIdea {
  id: string;
  ideaName: string;
  validationScore: number;
  targetMarket?: string;
  validationData?: Record<string, unknown>;
  starterPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [opportunities, setOpportunities] = useState<WorkspaceOpportunity[]>([]);
  const [ideas, setIdeas] = useState<WorkspaceIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      const [oppsResponse, ideasResponse] = await Promise.all([
        fetch('/api/workspace/opportunities', { credentials: 'include' }),
        fetch('/api/workspace/ideas', { credentials: 'include' }),
      ]);

      if (oppsResponse.ok) {
        const oppsData = await oppsResponse.json();
        setOpportunities(oppsData.opportunities || []);
      }

      if (ideasResponse.ok) {
        const ideasData = await ideasResponse.json();
        setIdeas(ideasData.ideas || []);
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      toast.error('Failed to load workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = async (prompt: string, name: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Starter prompt copied to clipboard!');
      
      posthog?.capture('Workspace: Prompt Copied', {
        item_name: name,
      });
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleStartBuilding = (prompt: string, name: string) => {
    handleCopyPrompt(prompt, name);
    
    // Track event
    posthog?.capture('Workspace: Start Building', {
      item_name: name,
    });

    toast.success('Prompt copied! Open Cursor/VSCode to start building.');
  };

  const handleDeleteOpportunity = async (id: string) => {
    try {
      const response = await fetch(`/api/workspace/opportunities/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setOpportunities(prev => prev.filter(opp => opp.id !== id));
        toast.success('Opportunity deleted');
        posthog?.capture('Workspace: Opportunity Deleted');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete opportunity');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      const response = await fetch(`/api/workspace/ideas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setIdeas(prev => prev.filter(idea => idea.id !== id));
        toast.success('Idea deleted');
        posthog?.capture('Workspace: Idea Deleted');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete idea');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Workspace</h1>
        <p className="text-muted-foreground">
          Your saved opportunities and validated ideas ready to build
        </p>
      </div>

      {/* Saved Opportunities Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Saved Opportunities
          </h2>
          <span className="text-sm text-muted-foreground">
            {opportunities.length} saved
          </span>
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No saved opportunities yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Save opportunities from Market Opportunities to get started
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/market-opportunities')}
                  >
                    Browse Opportunities
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{opp.opportunityName}</CardTitle>
                      <CardDescription className="text-xs">{opp.persona}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOpportunity(opp.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className={cn(
                    "inline-block px-2 py-1 rounded text-xs font-bold mt-2",
                    opp.score >= 8 ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                    opp.score >= 5 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                    "bg-red-500/20 text-red-600 dark:text-red-400"
                  )}>
                    Score: {opp.score}/10
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Pain Point</p>
                    <p className="text-sm line-clamp-2">{opp.painPoint}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Monetization</p>
                    <p className="text-sm line-clamp-2">{opp.monetization}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleStartBuilding(opp.starterPrompt, opp.opportunityName)}
                    >
                      <Play className="h-4 w-4" />
                      Start Building
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPrompt(opp.starterPrompt, opp.opportunityName)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Saved Validated Ideas Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Validated Ideas
          </h2>
          <span className="text-sm text-muted-foreground">
            {ideas.length} saved
          </span>
        </div>

        {ideas.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No validated ideas yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Validate ideas in Idea Validator and save them here
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/idea-validator')}
                  >
                    Validate Ideas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <Card key={idea.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{idea.ideaName}</CardTitle>
                      {idea.targetMarket && (
                        <CardDescription className="text-xs">{idea.targetMarket}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className={cn(
                    "inline-block px-2 py-1 rounded text-xs font-bold mt-2",
                    idea.validationScore >= 80 ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                    idea.validationScore >= 60 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                    "bg-red-500/20 text-red-600 dark:text-red-400"
                  )}>
                    Score: {idea.validationScore}/100
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleStartBuilding(idea.starterPrompt, idea.ideaName)}
                    >
                      <Play className="h-4 w-4" />
                      Start Building
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPrompt(idea.starterPrompt, idea.ideaName)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

