'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { IconCopy, IconAlertTriangle, IconExternalLink, IconCode, IconLoader } from '@tabler/icons-react';

type GitHubProject = {
  id: string;
  repoUrl: string;
  repoName: string;
  repoDescription: string | null;
  repoLanguage: string | null;
  inferredTechStack: string | null;
  cursorPrompt: string | null;
  createdAt: string;
};

type CursorPromptState = 'idle' | 'validating' | 'parsing' | 'generating' | 'completed';

const GitHubProjectPage = () => {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<GitHubProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cursor prompt generation states
  const [customPrompt, setCustomPrompt] = useState('');
  const [cursorPromptState, setCursorPromptState] = useState<CursorPromptState>('idle');
  const [cursorPromptError, setCursorPromptError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, we'll fetch from the list and find the specific project
        // In a real app, you'd have a dedicated endpoint for a single project
        const res = await fetch('/api/github-projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const projects = await res.json();
        const foundProject = projects.find((p: GitHubProject) => p.id === id);
        if (!foundProject) throw new Error('Project not found');
        setProject(foundProject);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const generateCursorPrompt = async () => {
    setCursorPromptState('validating');
    setCursorPromptError(null);
    setProgress(33);

    try {
      // Parsing and generation phase
      const params = new URLSearchParams();
      if (customPrompt.trim()) {
        params.append('userPrompt', customPrompt.trim());
      }

      const res = await fetch(`/api/github-projects/${id}/generate-cursor-prompt?${params}`);
      if (res.status === 403) throw new Error('Private repositories are not supported. Please make the repository public and try again.');
      if (res.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
      if (!res.ok) throw new Error('Failed to generate cursor prompt');

      const data = await res.json();

      // Update the project with the new cursor prompt
      setProject(prev => prev ? { ...prev, cursorPrompt: data.cursorPrompt } : null);
      setCursorPromptState('completed');
      setProgress(100);
    } catch (err) {
      setCursorPromptError((err as Error).message);
      setCursorPromptState('idle');
      setProgress(0);
    }
  };

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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
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

  if (!project) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <IconCode className="h-6 w-6" />
              {project.repoName}
            </h1>
            <p className="text-muted-foreground mt-1">{project.repoDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-700"
            >
              <IconExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
            <Link href="/dashboard/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
          </div>
        </div>

        {/* Project Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Repository</Label>
                <p className="text-sm text-muted-foreground">{project.repoUrl}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Language</Label>
                <p className="text-sm text-muted-foreground">{project.repoLanguage || 'Not detected'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tech Stack</Label>
                <p className="text-sm text-muted-foreground">{project.inferredTechStack || 'Not analyzed'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Added</Label>
                <p className="text-sm text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cursor Prompt Generation */}
        {!project.cursorPrompt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generate Cursor Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customPrompt">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Focus on adding a REST API..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    disabled={cursorPromptState !== 'idle'}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={generateCursorPrompt}
                  disabled={cursorPromptState !== 'idle'}
                >
                  {cursorPromptState === 'idle' && 'Generate Cursor Prompt'}
                  {cursorPromptState === 'validating' && 'Validating repository...'}
                  {cursorPromptState === 'parsing' && 'Parsing repository...'}
                  {cursorPromptState === 'generating' && 'Generating Cursor prompt...'}
                  {cursorPromptState === 'completed' && 'Generated!'}
                </Button>
                {cursorPromptState !== 'idle' && cursorPromptState !== 'completed' && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      {cursorPromptState === 'validating' && 'Validating repository URL...'}
                      {cursorPromptState === 'parsing' && 'Parsing repository structure...'}
                      {cursorPromptState === 'generating' && 'Generating Cursor prompt...'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {cursorPromptError && (
          <Alert variant="destructive" className="mb-6">
            <IconAlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{cursorPromptError}</AlertDescription>
          </Alert>
        )}

        {/* Generated Cursor Prompt */}
        {project.cursorPrompt && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Generated Cursor Prompt</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(project.cursorPrompt!)}
                className="h-8 w-8 p-0"
              >
                <IconCopy className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-96">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">{project.cursorPrompt}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Regenerate Option */}
        {project.cursorPrompt && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Regenerate Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Want to generate a different prompt with custom instructions?
                </p>
                <div>
                  <Label htmlFor="regeneratePrompt">Custom Instructions</Label>
                  <Textarea
                    id="regeneratePrompt"
                    placeholder="Focus on database integration..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    disabled={cursorPromptState !== 'idle'}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={generateCursorPrompt}
                  disabled={cursorPromptState !== 'idle'}
                  variant="outline"
                >
                  {cursorPromptState === 'idle' && 'Regenerate Prompt'}
                  {cursorPromptState === 'validating' && 'Validating...'}
                  {cursorPromptState === 'parsing' && 'Parsing...'}
                  {cursorPromptState === 'generating' && 'Generating...'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GitHubProjectPage;