// app/dashboard/workspace/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { IconCopy, IconDownload } from '@tabler/icons-react';
import { TechStackBuilder } from '@/components/tech-stack-builder';
import { TechStackConfig } from '@/lib/tech-stack-generator';

type Idea = {
  id: string;
  title: string;
  summary: string;
  unmet_needs: string[];
  product_idea: string[];
  proof_of_concept: string;
  source_url: string;
  prompt_used: string;
  confidenceScore: number;
  suggestedPlatforms: { name: string; link?: string }[];
  createdAt: string;
  generatedBy: string;
};

type Artifacts = {
  requirements: string;
  design: string;
  tasks: string;
  codeStubs: { files: { path: string; content: string }[] };
};

const WorkspacePage = () => {
  const params = useParams();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [techStack, setTechStack] = useState<TechStackConfig>({
    frontend: 'Next.js',
    styling: 'Tailwind CSS',
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<{ plan: string | null; paid: boolean | null } | null>(null);
  const [buildingPrompt, setBuildingPrompt] = useState<string | null>(null);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);

  useEffect(() => {
    const fetchIdea = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ideas/${id}`);
        if (!res.ok) throw new Error('Failed to fetch idea');
        const data = await res.json();
        setIdea(data);
        // If specs are already generated, set them
        if (data.requirements && data.design && data.tasks && data.codeStubs) {
          setArtifacts({
            requirements: data.requirements,
            design: data.design,
            tasks: data.tasks,
            codeStubs: data.codeStubs,
          });
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUserProfile({ plan: data.plan || null, paid: data.paid ?? null });
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchIdea();
    fetchUserProfile();
  }, [id]);

  const generateSpecs = async () => {
    setGenerating(true);
    setError(null);
    try {
      // Convert tech stack config to JSON string
      const techStackParam = JSON.stringify(techStack);
      const res = await fetch(`/api/ideas/${id}/generate-spec?techStack=${encodeURIComponent(techStackParam)}`);
      
      if (res.status === 403 || res.status === 400 || res.status === 429) {
        const data = await res.json();
        if (data.requiresApiKey) {
          setError(data.message || 'API key required. Please add your Gemini API key in Settings.');
          // Update API key status if it's invalid
          if (data.invalidKey) {
            setHasApiKey(false);
          }
        } else {
          setError(data.error || 'Rate limit exceeded. Please try again later.');
        }
        return;
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate spec');
      }
      
      const data = await res.json();
      setArtifacts(data);
      
      // Show success message with usage info
      if (data.dailyUsage !== undefined) {
        console.log(`Daily usage: ${data.dailyUsage}/${data.dailyLimit || 3}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const generateBuildingPrompt = async () => {
    if (!idea) return;
    
    setGeneratingPrompt(true);
    try {
      const response = await fetch('/api/ideas/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ideaId: id,
          idea: idea.title,
          summary: idea.summary,
          productIdeas: idea.product_idea,
          techStack: techStack,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate prompt');
      const data = await response.json();
      setBuildingPrompt(data.prompt);
    } catch (err) {
      console.error('Failed to generate prompt:', err);
      alert('Failed to generate building prompt. Please try again.');
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const downloadProject = async () => {
    try {
      const techStackParam = JSON.stringify(techStack);
      const res = await fetch(`/api/ideas/${id}/download-project?techStack=${encodeURIComponent(techStackParam)}`);
      if (!res.ok) throw new Error('Failed to download project');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${idea?.title.toLowerCase().replace(/\s+/g, '-') || 'project'}-starter.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const topics = [
    { id: 'requirements', label: 'Requirements & User Stories' },
    { id: 'design', label: 'Architecture & Design' },
    { id: 'tasks', label: 'Implementation Tasks' },
    { id: 'code-stubs', label: 'Code Stubs' },
  ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading idea...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !idea) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
          <Link href="/dashboard/projects" className="mt-4 inline-block text-blue-500 underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!idea) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
      <Button>
      <Link href="/dashboard/projects" >
            Back to Projects
          </Link>
      </Button>
        <h1 className="text-2xl font-bold mt-3 mb-4">Idea Workspace</h1>

        {/* Idea Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{idea.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{idea.summary}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>Confidence: {idea.confidenceScore}%</span>
              <span>Generated by: {idea.generatedBy}</span>
            </div>
            <button
              className="text-primary hover:text-primary-foreground underline mb-4"
              onClick={(e) => {
                e.preventDefault();
                const details = e.currentTarget.nextElementSibling as HTMLElement;
                details.classList.toggle('hidden');
              }}
            >
              Show More Details
            </button>
            <div className="hidden">
              {idea.unmet_needs && idea.unmet_needs.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Unmet Needs</h4>
                  <ul className="list-disc list-inside text-sm">
                    {idea.unmet_needs.map((need, index) => (
                      <li key={index}>{need}</li>
                    ))}
                  </ul>
                </div>
              )}
              {idea.product_idea && idea.product_idea.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Product Ideas</h4>
                  <ul className="list-disc list-inside text-sm">
                    {idea.product_idea.map((ideaText, index) => (
                      <li key={index}>{ideaText}</li>
                    ))}
                  </ul>
                </div>
              )}
              {idea.proof_of_concept && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Proof of Concept</h4>
                  <p className="text-sm">{idea.proof_of_concept}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack Selector and Generate Button */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {hasApiKey === false && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-1">API Key Required</h4>
                    <p className="text-sm text-yellow-800 mb-3">
                      The workspace feature requires your own Gemini API key to generate project specifications. 
                      Please add your API key in Settings to continue.
                    </p>
                    <Link href="/dashboard/settings">
                      <Button variant="default" size="sm">
                        Go to Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <TechStackBuilder
              value={techStack}
              onChange={setTechStack}
            />
            <div className="flex gap-4 mt-4">
              <Button 
                onClick={generateSpecs} 
                disabled={generating || hasApiKey === false} 
                className="flex-1"
              >
                {generating ? 'Generating...' : artifacts ? 'Regenerate Specs' : 'Generate Specs'}
              </Button>
              {artifacts && (
                <Button
                  onClick={downloadProject}
                  variant="outline"
                  disabled={generating}
                  className="flex items-center gap-2"
                >
                  <IconDownload className="h-4 w-4" />
                  Download Project ZIP
                </Button>
              )}
            </div>
            {hasApiKey === false && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Add your Gemini API key in Settings to enable spec generation
              </p>
            )}
          </CardContent>
        </Card>

        {/* Building Prompt Section - Paid Users Only */}
        {userProfile && (userProfile.plan === 'pro' || userProfile.plan === 'enterprise' || userProfile.paid === true) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI Building Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a detailed prompt for AI assistants (like Cursor, Claude, etc.) to help you build this project.
              </p>
              {!buildingPrompt ? (
                <Button
                  onClick={generateBuildingPrompt}
                  disabled={generatingPrompt || !idea}
                  className="w-full"
                >
                  {generatingPrompt ? 'Generating Prompt...' : 'Generate Building Prompt'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Your Building Prompt</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(buildingPrompt);
                          alert('Prompt copied to clipboard!');
                        }}
                      >
                        <IconCopy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                      <pre className="text-sm whitespace-pre-wrap">{buildingPrompt}</pre>
                    </ScrollArea>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-semibold mb-2">How to Use</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Copy the prompt above</li>
                      <li>Open your AI coding assistant (Cursor, Claude, etc.)</li>
                      <li>Paste the prompt and start building</li>
                      <li>The prompt includes all necessary context about your idea</li>
                    </ol>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setBuildingPrompt(null)}
                    className="w-full"
                  >
                    Generate New Prompt
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
            <p className="text-red-600">{error}</p>
            {error.includes('API key') && (
              <div className="mt-2">
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm">
                    Go to Settings
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {generating && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Generating project specifications...</span>
          </div>
        )}

        {artifacts && !generating && (
          <div className="flex gap-6">
            <div className="flex-1 space-y-6">
              <Card className="w-full max-w-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle id="requirements" className="text-lg font-semibold">Requirements & User Stories</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(artifacts.requirements)}
                    className="h-8 w-8 p-0"
                  >
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-80">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">{artifacts.requirements}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="w-full max-w-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle id="design" className="text-lg font-semibold">Architecture & Design</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(artifacts.design)}
                    className="h-8 w-8 p-0"
                  >
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-80">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">{artifacts.design}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="w-full max-w-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle id="tasks" className="text-lg font-semibold">Implementation Tasks</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(artifacts.tasks)}
                    className="h-8 w-8 p-0"
                  >
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-80">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">{artifacts.tasks}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Implementation Specifications Section */}
              {artifacts.codeStubs && artifacts.codeStubs.files && artifacts.codeStubs.files.length > 0 && (
                <Card className="w-full max-w-2xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle id="implementation-specs" className="text-lg font-semibold">Implementation Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-4">
                        Detailed technical specifications broken down for AI assistants or developers. These specs describe what needs to be built, not the code itself - perfect for feeding into Claude or other AI coding assistants.
                      </p>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {artifacts.codeStubs.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono font-medium truncate">{file.path}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {file.content.length} characters
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const blob = new Blob([file.content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.path.split('/').pop() || 'file';
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="h-8"
                              >
                                <IconDownload className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(file.content)}
                                className="h-8 w-8 p-0"
                              >
                                <IconCopy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Link href="/dashboard/projects" className="inline-block text-blue-500 underline">
                Back to Projects
              </Link>
            </div>
            <div className="w-48 sticky top-6">
              <h3 className="text-md font-semibold mb-2">On this page</h3>
              <nav className="space-y-2">
                {topics.map((topic) => (
                  <a
                    key={topic.id}
                    href={`#${topic.id}`}
                    className="block text-sm text-blue-500 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(topic.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {topic.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;