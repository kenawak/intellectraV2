"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { IconPlus, IconBrandGithubCopilot, IconBulb } from '@tabler/icons-react'
import { AddGitHubProjectModal } from '@/components/add-github-project-modal'

interface Idea {
  id: string
  title: string
  summary: string
  unmet_needs: string[]
  product_idea: string[]
  proof_of_concept: string
  source_url: string
  prompt_used: string
  createdAt: string
  confidenceScore: number
  suggestedPlatforms: { name: string; link?: string }[]
  generatedBy: string
}

type GitHubProject = {
  id: string
  repoUrl: string
  repoName: string
  repoDescription: string | null
  repoLanguage: string | null
  inferredTechStack: string | null
  cursorPrompt: string | null
  isAnalyzed: boolean
  createdAt: string
}

export default function WorkspacePage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [githubProjects, setGithubProjects] = useState<GitHubProject[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingProjectId, setAnalyzingProjectId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bookmarked ideas
        const ideasResponse = await fetch('/api/ideas/bookmarks')
        if (ideasResponse.ok) {
          const ideasData = await ideasResponse.json()
          setIdeas(ideasData)
        }

        // Fetch GitHub projects
        const projectsResponse = await fetch('/api/github-projects')
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          setGithubProjects(projectsData)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAnalyzeProject = async (projectId: string) => {
    setAnalyzingProjectId(projectId)
    try {
      const response = await fetch(`/api/github-projects/${projectId}/analyze`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze project')
      }

      // Refresh the GitHub projects list
      const projectsResponse = await fetch('/api/github-projects')
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json()
        setGithubProjects(projects)
      }
    } catch (error) {
      console.error('Failed to analyze project:', error)
      // Could add toast notification here
    } finally {
      setAnalyzingProjectId(null)
    }
  }


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Project Workspace</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Workspace</h1>
        <AddGitHubProjectModal onProjectAdded={() => {
          // Refresh the GitHub projects list
          fetch('/api/github-projects')
            .then(res => res.json())
            .then(projects => setGithubProjects(projects))
            .catch(err => console.error('Failed to refresh projects:', err));
        }} />
      </div>

      <Tabs defaultValue="ideas">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <IconBulb className="h-4 w-4" />
            Bookmarked ({ideas.length})
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-2">
            <IconBrandGithubCopilot className="h-4 w-4" />
            GitHub Projects ({githubProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="mt-6">
          {ideas.length === 0 ? (
            <div className="text-center py-12">
              <IconBulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No idea projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate and bookmark ideas to start working on them.
              </p>
              <Button asChild>
                <Link href="/dashboard/idea-validator">Generate Ideas</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <Card key={idea.id} className="relative hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{idea.title}</CardTitle>
                      <Badge variant="secondary">{idea.confidenceScore}%</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {idea.summary}
                    </p>
                    {idea.product_idea && idea.product_idea.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2">SaaS Idea:</h4>
                        <p className="text-sm line-clamp-2">{idea.product_idea[0]}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="flex-1"
                      >
                        <Link href={`/dashboard/workspace/${idea.id}`}>Open Workspace</Link>
                      </Button>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            View Details
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-background p-6 rounded-l-xl shadow-xl transition-transform duration-300">
                          <SheetHeader>
                            <SheetTitle className="text-2xl font-bold text-primary">{idea.title}</SheetTitle>
                          </SheetHeader>
                          <div className="mt-6 space-y-6">
                            {/* Summary Section */}
                            <div className="border-b pb-4">
                              <h4 className="text-lg font-semibold text-foreground mb-2">Summary</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{idea.summary}</p>
                            </div>

                            {/* Unmet Needs Section */}
                            {idea.unmet_needs && idea.unmet_needs.length > 0 && (
                              <div className="border-b pb-4">
                                <h4 className="text-lg font-semibold text-foreground mb-2">Unmet Needs</h4>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                                  {idea.unmet_needs.map((need, index) => (
                                    <li key={index} className="hover:text-primary transition-colors">{need}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Product Ideas Section */}
                            {idea.product_idea && idea.product_idea.length > 0 && (
                              <div className="border-b pb-4">
                                <h4 className="text-lg font-semibold text-foreground mb-2">Product Ideas</h4>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
                                  {idea.product_idea.map((idea, index) => (
                                    <li key={index} className="hover:text-primary transition-colors">{idea}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Proof of Concept Section */}
                            {idea.proof_of_concept && (
                              <div className="border-b pb-4">
                                <h4 className="text-lg font-semibold text-foreground mb-2">Proof of Concept</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{idea.proof_of_concept}</p>
                              </div>
                            )}

                            {/* Suggested Platforms Section */}
                            {idea.suggestedPlatforms && idea.suggestedPlatforms.length > 0 && (
                              <div className="border-b pb-4">
                                <h4 className="text-lg font-semibold text-foreground mb-2">Suggested Platforms</h4>
                                <div className="flex flex-wrap gap-2">
                                  {idea.suggestedPlatforms.map((platform, index) => {
                                    const name = typeof platform === 'string' ? platform : platform.name;
                                    const link = typeof platform === 'string' ? null : platform.link;
                                    return link ? (
                                      <a
                                        key={index}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-input bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                                      >
                                        {name}
                                      </a>
                                    ) : (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-sm bg-secondary hover:bg-secondary/80 transition-colors"
                                      >
                                        {name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Confidence Score Section with Progress Bar */}
                            <div className="border-b pb-4">
                              <h4 className="text-lg font-semibold text-foreground mb-2">Confidence Score</h4>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${idea.confidenceScore}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">{idea.confidenceScore}%</p>
                            </div>

                            {/* Generated By Section */}
                            <div className="border-b pb-4">
                              <h4 className="text-lg font-semibold text-foreground mb-2">Generated By</h4>
                              <p className="text-sm text-muted-foreground">{idea.generatedBy}</p>
                            </div>

                            {/* Source URL Section */}
                            {idea.source_url && (
                              <div>
                                <h4 className="text-lg font-semibold text-foreground mb-2">Source URL</h4>
                                <a
                                  href={idea.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors underline break-all"
                                  title="Opens in a new tab"
                                >
                                  {idea.source_url}
                                </a>
                              </div>
                            )}
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="github" className="mt-6">
          {githubProjects.length === 0 ? (
            <div className="text-center py-12">
              <IconBrandGithubCopilot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No GitHub projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your GitHub repositories to generate Cursor prompts and rules.
              </p>
              <AddGitHubProjectModal onProjectAdded={() => {
                fetch('/api/github-projects')
                  .then(res => res.json())
                  .then(projects => setGithubProjects(projects))
                  .catch(err => console.error('Failed to refresh projects:', err));
              }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {githubProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                      <Link href={`/dashboard/workspace/github/${project.id}`}>
                      {project.repoName}
                      </Link>
                      </CardTitle>
                      <div className="flex gap-2">
                        {project.isAnalyzed && (
                          <Badge variant="secondary">Analyzed</Badge>
                        )}
                        {project.cursorPrompt && (
                          <Badge variant="default">Prompt Ready</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.repoDescription && (
                      <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                        {project.repoDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-4">
                      {project.repoLanguage && (
                        <Badge variant="outline" className="text-xs">
                          {project.repoLanguage}
                        </Badge>
                      )}
                      {project.inferredTechStack && project.inferredTechStack !== 'Unknown' && (
                        <Badge variant="outline" className="text-xs">
                          {project.inferredTechStack.split(',')[0]}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Added {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        {!project.isAnalyzed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAnalyzeProject(project.id)}
                            disabled={analyzingProjectId === project.id}
                          >
                            {analyzingProjectId === project.id ? 'Analyzing...' : 'Analyze Project'}
                          </Button>
                        ) : (
                          <Link href={`/dashboard/workspace/github/${project.id}`}>
                            <Button size="sm">
                              {project.cursorPrompt ? 'View Prompt' : 'Generate Prompt'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}