// app/dashboard/workspace/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { IconCopy } from '@tabler/icons-react';

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

const techStackOptions = [
  'Next.js, TypeScript, Tailwind CSS',
  'React, JavaScript, CSS',
  'Vue.js, TypeScript, Vuetify',
  'Angular, TypeScript, Angular Material',
  'Express.js, Node.js, MongoDB',
  'Django, Python, PostgreSQL',
  'Flask, Python, SQLite',
  'FastAPI, Python, PostgreSQL',
  'Spring Boot, Java, MySQL',
  'Ruby on Rails, Ruby, PostgreSQL',
];

const WorkspacePage = () => {
  const params = useParams();
  const id = params.id as string;
  const [idea, setIdea] = useState<Idea | null>(null);
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [techStack, setTechStack] = useState(techStackOptions[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    fetchIdea();
  }, [id]);

  const generateSpecs = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/${id}/generate-spec?techStack=${encodeURIComponent(techStack)}`);
      if (res.status === 429) throw new Error('Rate limit exceeded. Please try again later.');
      if (!res.ok) throw new Error('Failed to generate spec');
      const data = await res.json();
      setArtifacts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const topics = [
    { id: 'requirements', label: 'Requirements & User Stories' },
    { id: 'design', label: 'Architecture & Design' },
    { id: 'tasks', label: 'Implementation Tasks' },
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
      <div className="min-h-screen bg-gray-100 p-6">
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

  if (!idea) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
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
        <div className="mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Tech Stack</label>
            <Select value={techStack} onValueChange={setTechStack}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {techStackOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateSpecs} disabled={generating}>
            {generating ? 'Generating...' : artifacts ? 'Regenerate Specs' : 'Generate Specs'}
          </Button>
        </div>


        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
            <p className="text-red-600">{error}</p>
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