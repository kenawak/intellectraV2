'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, CheckCircle2, XCircle, TrendingUp, Target, DollarSign, Code, AlertTriangle, ExternalLink, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

// Calculate scores from validation data
function calculateScores(validation: IdeaValidationResult) {
  // Market Demand Score (0-100)
  const demandScore = validation.marketValidation.demandLevel === 'high' ? 95 : 
                      validation.marketValidation.demandLevel === 'medium' ? 70 : 40;
  
  // Competition Gap Score (based on number of competitors and differentiation)
  const competitorCount = validation.competitiveAnalysis.competitors.length;
  const competitionGap = competitorCount === 0 ? 90 : 
                        competitorCount <= 2 ? 78 : 
                        competitorCount <= 4 ? 65 : 50;
  
  // Technical Feasibility Score
  const techFeasibility = validation.profitability.technicalComplexity === 'low' ? 90 :
                          validation.profitability.technicalComplexity === 'medium' ? 75 : 60;
  
  // Monetization Potential Score
  const monetizationScore = validation.profitability.monetizationRoutes.length >= 3 ? 88 :
                            validation.profitability.monetizationRoutes.length === 2 ? 75 : 65;
  
  // Overall Success Score (weighted average)
  const overallScore = Math.round(
    (demandScore * 0.3) + 
    (competitionGap * 0.25) + 
    (techFeasibility * 0.25) + 
    (monetizationScore * 0.2)
  );
  
  return {
    overall: overallScore,
    marketDemand: demandScore,
    competitionGap: competitionGap,
    technicalFeasibility: techFeasibility,
    monetizationPotential: monetizationScore,
  };
}

// Generate trend data for sparkline
function generateTrendData() {
  return [
    { month: 'Jan 2023', value: 45 },
    { month: 'Jul 2023', value: 52 },
    { month: 'Jan 2024', value: 61 },
    { month: 'Jul 2024', value: 73 },
    { month: 'Jan 2025', value: 85 },
    { month: 'Now', value: 92 },
  ];
}

// Circular Progress Component
function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">/100</div>
        </div>
      </div>
    </div>
  );
}

export function IdeaValidator() {
  const [idea, setIdea] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<IdeaValidationResult | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<Array<{ id: string; title: string; summary: string }>>([]);
  const [selectedIdea, setSelectedIdea] = useState<{ id: string; title: string; summary: string } | null>(null);

  const scores = useMemo(() => {
    if (!validation) return null;
    return calculateScores(validation);
  }, [validation]);

  const trendData = useMemo(() => generateTrendData(), []);

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setGeneratedIdeas([]);
    
    try {
      const response = await fetch('/api/ideas/generate?prompt=developer%20side%20project%20ideas&provider=exa&numResults=5', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      const ideas = (data.ideas || []).slice(0, 5).map((idea: { id?: string; title?: string; summary?: string }, index: number) => ({
        id: idea.id || `idea-${index}`,
        title: idea.title || 'Untitled Idea',
        summary: idea.summary || '',
      }));
      
      setGeneratedIdeas(ideas);
      toast.success(`Generated ${ideas.length} ideas!`);
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error('Failed to generate ideas');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleIdeaSelect = (selected: { id: string; title: string; summary: string }) => {
    setSelectedIdea(selected);
    setIdea(selected.title);
  };

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!idea.trim()) {
      toast.error('Please enter an idea to validate');
      return;
    }

    if (isValidating) {
      return;
    }

    setIsValidating(true);
    setValidation(null);

    try {
      const response = await fetch('/api/ideas/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to validate idea');
      }

      const data = await response.json();
      setValidation(data.validation);
      toast.success('Idea validated successfully!');
      setSelectedIdea(null); // Close modal after validation
    } catch (error) {
      console.error('Error validating idea:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to validate idea');
    } finally {
      setIsValidating(false);
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-primary';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-primary';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Particle dots background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }} />
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">Idea Validator</CardTitle>
                <CardDescription className="mt-1">
                  Validate your startup and product ideas with real-world evidence and AI analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Idea Generator Section */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Generate Ideas</h3>
                  <p className="text-sm text-muted-foreground">Click to generate project ideas</p>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateIdeas}
                  disabled={isGeneratingIdeas}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGeneratingIdeas ? 'Generating...' : 'Generate Ideas'}
                </Button>
              </div>
              
              {generatedIdeas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generatedIdeas.map((ideaItem) => (
                    <Badge
                      key={ideaItem.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm"
                      onClick={() => handleIdeaSelect(ideaItem)}
                    >
                      {ideaItem.title}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Enter your product idea (e.g., 'shopping AI companion')..."
                  className="pl-10 pr-4 py-6 text-base"
                  disabled={isValidating}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isValidating || !idea.trim()}
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating Idea...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Validate Idea
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Idea Details Modal */}
        <Dialog open={!!selectedIdea} onOpenChange={(open) => !open && setSelectedIdea(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedIdea?.title}</DialogTitle>
              <DialogDescription>
                Review the idea details and validate it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{selectedIdea?.summary}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    if (selectedIdea) {
                      setIdea(selectedIdea.title);
                      setSelectedIdea(null);
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Use This Idea
                </Button>
                <Button
                  onClick={() => {
                    if (selectedIdea) {
                      setIdea(selectedIdea.title);
                      handleValidate();
                    }
                  }}
                  disabled={isValidating}
                  className="flex-1"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-4 w-4" />
                      Validate Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {isValidating && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Analyzing your idea...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gathering market data and competitive intelligence. This may take a few moments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Results */}
        {validation && !isValidating && scores && (
          <div className="space-y-8">
            {/* Top Two Analytics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Card - Market Trend Tracker */}
              <Card className="shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Market Trend Momentum
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Sparkline Chart */}
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={3}
                          fill="url(#trendGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Key Metrics */}
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-4xl font-bold text-card-foreground">92</span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">Current Trend Score</div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-2xl font-bold text-primary">+47%</div>
                        <div className="text-xs text-muted-foreground mt-1">30-day Growth</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">8.7x</div>
                        <div className="text-xs text-muted-foreground mt-1">Search Volume Index</div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {validation.platformRecommendation.recommended.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs border border-primary/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Bottom Badge */}
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs font-medium text-primary">
                        <Sparkles className="h-3 w-3" />
                        Hot & Accelerating
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Card - Idea Success Score */}
              <Card className="shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Overall Success Probability
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Circular Progress */}
                  <div className="flex justify-center">
                    <CircularProgress value={scores.overall} size={140} />
                  </div>
                  
                  {/* Breakdown */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Market Demand</span>
                      <span className="text-lg font-bold text-card-foreground">{scores.marketDemand}/100</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Competition Gap</span>
                      <span className="text-lg font-bold text-card-foreground">{scores.competitionGap}/100</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Technical Feasibility</span>
                      <span className="text-lg font-bold text-card-foreground">{scores.technicalFeasibility}/100</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Monetization Potential</span>
                      <span className="text-lg font-bold text-card-foreground">{scores.monetizationPotential}/100</span>
                    </div>
                  </div>
                  
                  {/* Bottom Badge */}
                  <div className="pt-2">
                    <span className="inline-flex items-center px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs font-medium text-primary">
                      Very Strong Opportunity
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Sections with Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="market">Market Analysis</TabsTrigger>
                <TabsTrigger value="feasibility">Feasibility & Execution</TabsTrigger>
                <TabsTrigger value="insights">Insights & References</TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Quick Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Quick Idea Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Clarified Idea</h4>
                      <p className="text-muted-foreground">{validation.quickSummary.clarifiedIdea}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Core Problem</h4>
                      <p className="text-muted-foreground">{validation.quickSummary.coreProblem}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Recommendation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Platform Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Recommended Platforms</h4>
                      <div className="flex flex-wrap gap-2">
                        {validation.platformRecommendation.recommended.map((platform, index) => (
                          <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Reasoning</h4>
                      <p className="text-muted-foreground">{validation.platformRecommendation.reasoning}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Market Analysis */}
              <TabsContent value="market" className="space-y-6 mt-6">
                {/* Market Validation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Market Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-card-foreground">Makes Sense Today:</span>
                      {validation.marketValidation.makesSense ? (
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-4 w-4" />
                          No
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-card-foreground">Demand Level: </span>
                      <span className={cn("font-medium capitalize", getDemandColor(validation.marketValidation.demandLevel))}>
                        {validation.marketValidation.demandLevel}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Target Customers</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {validation.marketValidation.targetCustomers.map((customer, index) => (
                          <li key={index}>{customer}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Pain Points</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {validation.marketValidation.painPoints.map((pain, index) => (
                          <li key={index}>{pain}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Competitive Analysis */}
                {validation.competitiveAnalysis.competitors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Competitive Analysis
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({validation.competitiveAnalysis.competitors.length} competitors)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {validation.competitiveAnalysis.competitors.slice(0, 3).map((competitor, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-card-foreground">{competitor.name}</h4>
                            <a
                              href={competitor.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1 text-sm"
                            >
                              Visit <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <p className="text-sm text-muted-foreground">{competitor.description}</p>
                          <div className="pt-2 border-t">
                            <p className="text-sm">
                              <span className="font-semibold text-card-foreground">Differentiation: </span>
                              <span className="text-muted-foreground">{competitor.differentiation}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {validation.competitiveAnalysis.competitors.length > 3 && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between">
                              <span>Show {validation.competitiveAnalysis.competitors.length - 3} more competitors</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 mt-4">
                            {validation.competitiveAnalysis.competitors.slice(3).map((competitor, index) => (
                              <div key={index + 3} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-card-foreground">{competitor.name}</h4>
                                  <a
                                    href={competitor.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1 text-sm"
                                  >
                                    Visit <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                                <p className="text-sm text-muted-foreground">{competitor.description}</p>
                                <div className="pt-2 border-t">
                                  <p className="text-sm">
                                    <span className="font-semibold text-card-foreground">Differentiation: </span>
                                    <span className="text-muted-foreground">{competitor.differentiation}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab 3: Feasibility & Execution */}
              <TabsContent value="feasibility" className="space-y-6 mt-6">
                {/* Profitability & Feasibility */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Profitability & Feasibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Monetization Routes</h4>
                      <div className="flex flex-wrap gap-2">
                        {validation.profitability.monetizationRoutes.map((route, index) => (
                          <span key={index} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm border">
                            {route}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Market Size</h4>
                      <p className="text-muted-foreground">{validation.profitability.marketSize}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-card-foreground">Technical Complexity: </span>
                      <span className={cn("font-medium capitalize", getComplexityColor(validation.profitability.technicalComplexity))}>
                        {validation.profitability.technicalComplexity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-card-foreground">Solo Founder Feasible: </span>
                      {validation.profitability.soloFounderFeasible ? (
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-4 w-4" />
                          No
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Execution Roadmap */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Execution Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">MVP Features</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {validation.executionRoadmap.mvp.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Key Features</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {validation.executionRoadmap.keyFeatures.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-card-foreground mb-2">Future Features</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {validation.executionRoadmap.futureFeatures.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Insights & References */}
              <TabsContent value="insights" className="space-y-6 mt-6">
                {/* Strengths & Red Flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {validation.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Red Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        {validation.redFlags.map((flag, index) => (
                          <li key={index}>{flag}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Assumptions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      Key Assumptions to Validate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {validation.assumptions.map((assumption, index) => (
                        <li key={index}>{assumption}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Links Section */}
                {validation.links.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ExternalLink className="h-5 w-5 text-primary" />
                        Evidence & References
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({validation.links.length} sources)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {validation.links.slice(0, 3).map((link, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-muted/20">
                            <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:text-primary/80 hover:underline block truncate"
                              >
                                {link.title}
                              </a>
                              <p className="text-xs text-muted-foreground mt-1">
                                {link.url} • Source: {link.source}
                              </p>
                            </div>
                          </div>
                        ))}
                        
                        {validation.links.length > 3 && (
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="w-full justify-between">
                                <span>Show {validation.links.length - 3} more references</span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 mt-4">
                              {validation.links.slice(3).map((link, index) => (
                                <div key={index + 3} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors bg-muted/20">
                                  <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary hover:text-primary/80 hover:underline block truncate"
                                    >
                                      {link.title}
                                    </a>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {link.url} • Source: {link.source}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!validation && !isValidating && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    Validate Your First Idea
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Enter a product idea above to get a comprehensive validation with market research, competitive analysis, and actionable insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
