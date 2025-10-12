"use client"

import { useEffect, useState } from "react"
import { IconBookmark, IconBookmarkFilled, IconArrowBigUp, IconArrowBigUpFilled, IconArrowBigDown, IconArrowBigDownFilled  } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

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
  suggestedPlatforms: string[]
  generatedBy: string
  votes: {
    up: number
    down: number
    total: number
    userVote: 'up' | 'down' | null
  }
}

export default function PublicIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const response = await fetch('/api/ideas/public')
        if (response.ok) {
          const data = await response.json()
          setIdeas(data)
        }
      } catch (error) {
        console.error('Failed to fetch ideas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIdeas()
  }, [])

  const handleBookmark = async (idea: Idea) => {
    try {
      const response = await fetch('/api/ideas/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea),
      })
      if (response.ok) {
        setBookmarkedIds(prev => new Set(prev).add(idea.id))
      }
    } catch (error) {
      console.error('Failed to bookmark:', error)
    }
  }

  const handleVote = async (ideaId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch('/api/ideas/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId, voteType }),
      })
      if (response.ok) {
        const result = await response.json()
        // Update the local state
        setIdeas(prev => prev.map(idea => {
          if (idea.id === ideaId) {
            let newUp = idea.votes.up
            let newDown = idea.votes.down
            let newUserVote = idea.votes.userVote

            if (result.action === 'added') {
              if (voteType === 'up') {
                newUp++
                newUserVote = 'up'
              } else {
                newDown++
                newUserVote = 'down'
              }
            } else if (result.action === 'updated') {
              if (voteType === 'up') {
                newUp++
                newDown--
                newUserVote = 'up'
              } else {
                newDown++
                newUp--
                newUserVote = 'down'
              }
            } else if (result.action === 'removed') {
              if (idea.votes.userVote === 'up') {
                newUp--
              } else {
                newDown--
              }
              newUserVote = null
            }

            return {
              ...idea,
              votes: {
                up: newUp,
                down: newDown,
                total: newUp + newDown,
                userVote: newUserVote
              }
            }
          }
          return idea
        }))
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Public Project Ideas</h1>
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
      <h1 className="text-3xl font-bold mb-8">Public Project Ideas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <Card key={idea.id} className="relative hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{idea.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{idea.confidenceScore}%</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmark(idea)}
                    disabled={bookmarkedIds.has(idea.id)}
                  >
                    {bookmarkedIds.has(idea.id) ? (
                      <IconBookmarkFilled className="h-4 w-4" />
                    ) : (
                      <IconBookmark className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(idea.id, 'up')}
                    className={`p-1 h-6 w-6`}
                  >
                    {idea.votes.userVote === 'up' ?
                    <IconArrowBigUpFilled className="h-4 w-4" />:
                    <IconArrowBigUp className="h-4 w-4" /> 
                    }
                    </Button>
                  <span className="text-sm font-medium">{idea.votes.up}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(idea.id, 'down')}
                    className={`p-1 h-6 w-6`}
                  >
                    {
                      idea.votes.userVote === 'down' ?
                      <IconArrowBigDownFilled   className="h-4 w-4" /> :
                      <IconArrowBigDown   className="h-4 w-4" /> 
                      
                    }
                  </Button>
                  <span className="text-sm font-medium">{idea.votes.down}</span>
                </div>
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
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{idea.title}</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Summary</h4>
                      <p className="text-sm">{idea.summary}</p>
                    </div>
                    {idea.unmet_needs && idea.unmet_needs.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Unmet Needs</h4>
                        <ul className="text-sm list-disc list-inside">
                          {idea.unmet_needs.map((need, index) => (
                            <li key={index}>{need}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {idea.product_idea && idea.product_idea.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Product Ideas</h4>
                        <ul className="text-sm list-disc list-inside">
                          {idea.product_idea.map((idea, index) => (
                            <li key={index}>{idea}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {idea.proof_of_concept && (
                      <div>
                        <h4 className="font-semibold">Proof of Concept</h4>
                        <p className="text-sm">{idea.proof_of_concept}</p>
                      </div>
                    )}
                    {idea.suggestedPlatforms && idea.suggestedPlatforms.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Suggested Platforms</h4>
                        <div className="flex flex-wrap gap-2">
                          {idea.suggestedPlatforms.map((platform, index) => (
                            <Badge key={index} variant="outline">{platform}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">Confidence Score</h4>
                      <p className="text-sm">{idea.confidenceScore}%</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Generated By</h4>
                      <p className="text-sm">{idea.generatedBy}</p>
                    </div>
                    {idea.source_url && (
                      <div>
                        <h4 className="font-semibold">Source URL</h4>
                        <a href={idea.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {idea.source_url}
                        </a>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}