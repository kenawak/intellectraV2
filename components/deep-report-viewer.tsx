'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Lock, Sparkles, TrendingUp, FileSearch, Target, DollarSign, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { ProductIdea } from '@/lib/unified-search-service';

/**
 * DeepReportViewer Component
 * 
 * High-value, gated feature for generating and viewing deep market analysis reports.
 * Enforces strict subscription gating based on user's plan and paid status.
 * 
 * Features:
 * - Search input with specialization context
 * - Report generation with loading states
 * - Subscription gating (free users see paywall)
 * - Professional markdown rendering
 * - Responsive design
 */
export function DeepReportViewer() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [productIdeas, setProductIdeas] = useState<ProductIdea[]>([]);
  const [userProfile, setUserProfile] = useState<{
    plan: string | null;
    paid: boolean | null;
    marketSpecialization: string | null;
    onboardingComplete: boolean;
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            plan: data.plan || null,
            paid: data.paid ?? null,
            marketSpecialization: data.marketSpecialization || null,
            onboardingComplete: data.onboardingComplete || false,
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);


  /**
   * Handle search submission
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (isGenerating) {
      return; // Prevent multiple simultaneous searches
    }

    setIsGenerating(true);
    setReport(null);
    setProductIdeas([]);

    try {
      // Call the actual API endpoint
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const data = await response.json();
      
      // Parse product ideas from JSON string
      try {
        const parsed = JSON.parse(data.report);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProductIdeas(parsed);
          setReport(data.report); // Store raw report for persistence
        } else {
          throw new Error('Invalid product ideas format');
        }
      } catch (error) {
        console.error('Failed to parse product ideas:', error);
        console.error('Raw response:', data.report);
        setProductIdeas([]);
        setReport(null);
        toast.error('Failed to parse product ideas. Please try again.');
        return;
      }
      
      // Refresh user profile to get latest subscription status
      const profileResponse = await fetch('/api/user/profile', {
        credentials: 'include',
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile({
          plan: profileData.plan || null,
          paid: profileData.paid ?? null,
          marketSpecialization: profileData.marketSpecialization || null,
          onboardingComplete: profileData.onboardingComplete || false,
        });
      }
      
      toast.success('Product ideas generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if user has access to full report
  const hasFullAccess = 
    userProfile?.plan === 'pro' || 
    userProfile?.plan === 'enterprise' || 
    userProfile?.paid === true;

  // Get first product idea as teaser for free users
  const getTeaserIdea = (): ProductIdea | null => {
    return productIdeas.length > 0 ? productIdeas[0] : null;
  };

  const specializationDisplay = userProfile?.marketSpecialization 
    ? userProfile.marketSpecialization.replace(/_/g, ' ')
    : 'your market';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSearch className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Market Opportunities</CardTitle>
              <CardDescription className="mt-1">
                Discover viable product opportunities with AI-powered market analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for market opportunities, trends, or competitor analysis..."
                className="pl-10 pr-4 py-6 text-base"
                disabled={isGenerating}
              />
            </div>
            
            {/* Specialization Context Note */}
            {userProfile?.marketSpecialization && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your search is currently optimized for <span className="font-semibold text-foreground">{specializationDisplay}</span> markets. 
                  {!userProfile.onboardingComplete && (
                    <span className="ml-1">Complete your profile to enhance results.</span>
                  )}
                </p>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isGenerating || !query.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Market...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Discover Opportunities
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">Analyzing market data...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Synthesizing insights from multiple sources. This may take a few moments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Ideas Display */}
      {productIdeas.length > 0 && !isGenerating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Product Opportunities</CardTitle>
                <CardDescription className="mt-1">
                  Generated for: <span className="font-medium">{query}</span>
                  {productIdeas.length > 0 && (
                    <span className="ml-2">• {productIdeas.length} opportunities identified</span>
                  )}
                </CardDescription>
              </div>
              {!hasFullAccess && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Pro Feature</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {hasFullAccess ? (
              // Full Product Ideas for Paid Users
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productIdeas.map((idea, index) => (
                  <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{idea.title}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{idea.niche}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            idea.viability_score >= 8 ? "bg-green-500/20 text-green-600 dark:text-green-400" :
                            idea.viability_score >= 5 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                            "bg-red-500/20 text-red-600 dark:text-red-400"
                          )}>
                            Score: {idea.viability_score}/10
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-start gap-2 mb-1">
                          <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Pain Point</p>
                            <p className="text-sm text-muted-foreground">{idea.pain_point}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-start gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Monetization</p>
                            <p className="text-sm text-muted-foreground">{idea.monetization_strategy}</p>
                          </div>
                        </div>
                      </div>

                      {idea.core_features && idea.core_features.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2">Core Features</p>
                          <ul className="space-y-1">
                            {idea.core_features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Paywall for Free Users
              <div className="space-y-6">
                {/* First Product Idea Teaser */}
                {getTeaserIdea() && (
                  <Card className="border-2 border-primary/30">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{getTeaserIdea()!.title}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{getTeaserIdea()!.niche}</span>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-primary/20 rounded text-xs font-bold text-primary">
                          Score: {getTeaserIdea()!.viability_score}/10
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Pain Point</p>
                        <p className="text-sm text-muted-foreground">{getTeaserIdea()!.pain_point}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Monetization</p>
                        <p className="text-sm text-muted-foreground">{getTeaserIdea()!.monetization_strategy}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Paywall Message */}
                <div className="relative rounded-lg border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                  <div className="absolute inset-0 backdrop-blur-sm bg-background/80 rounded-lg" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Lock className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold text-foreground">
                        Unlock All Product Opportunities
                      </h3>
                    </div>
                    
                    <p className="text-center text-muted-foreground max-w-2xl mx-auto">
                      You&apos;re viewing 1 of {productIdeas.length} product opportunities. Unlock the full analysis including 
                      <span className="font-semibold text-foreground"> all {productIdeas.length} product ideas</span>, 
                      <span className="font-semibold text-foreground"> complete feature breakdowns</span>, and 
                      <span className="font-semibold text-foreground"> detailed viability scores</span> by upgrading to Pro.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-primary mb-1">{productIdeas.length}</div>
                        <div className="text-xs text-muted-foreground">Product Ideas</div>
                      </div>
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-primary mb-1">10</div>
                        <div className="text-xs text-muted-foreground">Viability Scores</div>
                      </div>
                      <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                        <div className="text-2xl font-bold text-primary mb-1">100+</div>
                        <div className="text-xs text-muted-foreground">MRR Potential</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                      <Button
                        onClick={() => router.push('/pricing')}
                        size="lg"
                        className="w-full sm:w-auto min-w-[200px]"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade to Pro
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReport(null);
                          setProductIdeas([]);
                        }}
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        Start New Search
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-center text-muted-foreground">
                        Pro plans start at $19/month • Cancel anytime • 7-day free trial
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {productIdeas.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Discover Your First Opportunity
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Enter a search query above to discover product opportunities. 
                  {userProfile?.marketSpecialization && (
                    <span> Results are optimized for <span className="font-medium">{specializationDisplay}</span> markets.</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

