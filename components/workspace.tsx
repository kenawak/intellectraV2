'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WorkspaceProps = {
  ideaId: string;
  onClose: () => void;
};

const Workspace = ({ ideaId, onClose }: WorkspaceProps) => {
  const [artifacts, setArtifacts] = useState({
    requirements: '',
    design: '',
    tasks: '',
    codeStubs: { files: [] as { path: string; content: string }[] }
  });
  const [techStack, setTechStack] = useState('Next.js, TypeScript, Tailwind CSS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpec = async (stack: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ideas/${ideaId}/generate-spec?techStack=${encodeURIComponent(stack)}`);
      if (response.status === 429) {
        setError('Rate limit exceeded. Please try again later.');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to generate spec');
      }
      const data = await response.json();
      setArtifacts(data);
    } catch (err) {
      setError('Failed to generate spec. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpec(techStack);
  }, [ideaId]);

  const handleRegenerate = () => {
    fetchSpec(techStack);
  };

  const downloadFile = (path: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Project Workspace</h2>
          <Button onClick={onClose}>Close</Button>
        </div>

        <div className="mb-4 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Tech Stack</label>
            <Input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Enter preferred tech stack (e.g., Next.js, TypeScript)"
            />
          </div>
          <Button onClick={handleRegenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Regenerate Spec'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Generating project specifications...</span>
          </div>
        ) : (
          <Tabs defaultValue="requirements" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="code">Code Stubs</TabsTrigger>
            </TabsList>

            <TabsContent value="requirements" className="mt-4">

              <Card>
                <CardHeader>
                  <CardTitle>Requirements & User Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{artifacts.requirements}</pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Architecture & Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{artifacts.design}</pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{artifacts.tasks}</pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Code Scaffolding</h3>
                {artifacts.codeStubs.files.length === 0 ? (
                  <p className="text-muted-foreground">No code stubs generated yet.</p>
                ) : (
                  artifacts.codeStubs.files.map(({ path, content }, index) => (
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{path}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(path, content)}
                        >
                          Download
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted p-4 rounded-md overflow-x-auto">
                          {content}
                        </pre>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Workspace;