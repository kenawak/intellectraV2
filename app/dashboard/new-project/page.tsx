'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/shadcn-io/ai/conversation';
import { Loader } from '@/components/ui/shadcn-io/ai/loader';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/shadcn-io/ai/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ui/shadcn-io/ai/prompt-input';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ui/shadcn-io/ai/reasoning';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ui/shadcn-io/ai/source';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { IconMicrophone, IconPaperclip, IconRotate, IconBookmark, IconBookmarkFilled, IconSettings } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { nanoid } from 'nanoid';
import { type FormEventHandler, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type ChatMessage = {
  id: string;
  content: string | React.JSX.Element; // Updated to allow JSX for rich content
  role: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
  isError?: boolean;
};

type Idea = {
  id?: string;
  title: string;
  summary: string;
  unmet_needs: string[];
  product_idea: string[];
  proof_of_concept: string;
  source_url: string;
  source_site?: string;
  confidenceScore: number;
  suggestedPlatforms: Array<{ name: string; link: string }>;
  creationDate: string;
  ideaSource: string;
};

// Helper function to format an idea as JSX content
const formatIdeaAsJSX = (idea: Idea): React.ReactElement => (
  <div className="space-y-2">
    <h3 className="font-semibold">{idea.title}</h3>
    <p><strong>Summary:</strong> {idea.summary}</p>
    <div>
      <strong>Unmet Needs:</strong>
      <ul className="list-disc pl-5">
        {idea.unmet_needs.map((need, index) => (
          <li key={index}>{need}</li>
        ))}
      </ul>
    </div>
    <div>
      <strong>Product Idea:</strong>
      <ul className="list-disc pl-5">
        {idea.product_idea.map((ideaText, index) => (
          <li key={index}>{ideaText}</li>
        ))}
      </ul>
    </div>
    <p><strong>Proof of Concept:</strong> {idea.proof_of_concept}</p>
    <p><strong>Confidence Score:</strong> {idea.confidenceScore}%</p>
    <p><strong>Creation Date:</strong> {idea.creationDate}</p>
    <p><strong>Idea Source:</strong> {idea.ideaSource}</p>
  </div>
);

const models = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B' },
];

// Predefined popular sites for developers
const popularSites = [
  { id: 'reddit.com', name: 'Reddit', category: 'Forums' },
  { id: 'x.com', name: 'X (Twitter)', category: 'Social' },
  { id: 'indiehackers.com', name: 'Indie Hackers', category: 'Community' },
  { id: 'dev.to', name: 'Dev.to', category: 'Blog' },
  { id: 'news.ycombinator.com', name: 'Hacker News', category: 'News' },
  { id: 'stackoverflow.com', name: 'Stack Overflow', category: 'Q&A' },
  { id: 'github.com', name: 'GitHub', category: 'Code' },
  { id: 'medium.com', name: 'Medium', category: 'Blog' },
  { id: 'hashnode.com', name: 'Hashnode', category: 'Blog' },
  { id: 'producthunt.com', name: 'Product Hunt', category: 'Products' },
];

const searchProviders = [
  { id: 'exa', name: 'Exa Search', description: 'AI-powered semantic search' },
  // Future providers can be added here when implemented
  // { id: 'tavily', name: 'Tavily', description: 'Research API' },
  // { id: 'serper', name: 'Serper', description: 'Google Search API' },
];

const Example = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nanoid(),
      content: "Hello! I'm your AI assistant. I can help you generate SaaS or side project ideas based on developer pain points. Enter a query like 'developer tool pain points' or ask about specific development topics!",
      role: 'assistant',
      timestamp: new Date(),
      sources: [
        { title: "Getting Started Guide", url: "#" },
        { title: "API Documentation", url: "#" },
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [lastUserQuery, setLastUserQuery] = useState<string>('');
  
  // Search settings state
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set(['reddit.com', 'x.com', 'indiehackers.com']));
  const [searchProvider, setSearchProvider] = useState<string>('exa');
  const [numResults, setNumResults] = useState<number>(5);
  const [customSite, setCustomSite] = useState<string>('');

  // Simulate streaming effect for assistant messages
  const simulateTyping = useCallback((messageId: string, content: string | React.JSX.Element, reasoning?: string, sources?: Array<{ title: string; url: string }>) => {
    if (typeof content !== 'string') {
      // For JSX content (ideas), display immediately without streaming
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content, isStreaming: false, reasoning, sources }
            : msg
        )
      );
      setIsTyping(false);
      setStreamingMessageId(null);
      return () => {};
    }

    // Handle string content with typing effect
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const currentContent = content.slice(0, currentIndex);
            return {
              ...msg,
              content: currentContent,
              isStreaming: currentIndex < content.length,
              reasoning: currentIndex >= content.length ? reasoning : undefined,
              sources: currentIndex >= content.length ? sources : undefined,
            };
          }
          return msg;
        })
      );

      currentIndex += Math.random() > 0.1 ? 1 : 0; // Simulate variable typing speed

      if (currentIndex >= content.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setStreamingMessageId(null);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

  // Fetch ideas from the API
  const fetchIdeas = useCallback(
    async (query: string, isRetry = false) => {
      try {
        setIsTyping(true);
        setIsGeneratingIdeas(true);
        if (!isRetry) {
          setLastUserQuery(query);
        }
        
        // Build query parameters
        const params = new URLSearchParams({
          prompt: query,
          provider: searchProvider,
          numResults: numResults.toString(),
        });
        
        // Add sites if any are selected
        if (selectedSites.size > 0) {
          params.append('sites', Array.from(selectedSites).join(','));
        }
        
        const response = await fetch(`/api/ideas/generate?${params.toString()}`);
        const data = await response.json();

        if (response.status === 429) {
          const errorMessage: ChatMessage = {
            id: nanoid(),
            content: `Error: ${data.error}. Please try again later.`,
            role: 'assistant',
            timestamp: new Date(),
            isStreaming: false,
            isError: true,
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsTyping(false);
          setIsGeneratingIdeas(false);
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch ideas');
        }

        const { ideas } = data;

        // Ensure each idea has an id
        const ideasWithIds = ideas.map((idea: Idea) => ({
          ...idea,
          id: idea.id || nanoid(),
        }));

        // Add ideas to the generated ideas state
        setGeneratedIdeas((prev) => [...prev, ...ideasWithIds]);

        // Create a success message
        const successMessage: ChatMessage = {
          id: nanoid(),
          content: `I've generated ${ideas.length} project idea${ideas.length > 1 ? 's' : ''} based on your query. Check them out below!`,
          role: 'assistant',
          timestamp: new Date(),
          isStreaming: true,
        };

        setMessages((prev) => [...prev, successMessage]);

        // Simulate typing for the success message
        setStreamingMessageId(successMessage.id);
        simulateTyping(successMessage.id, successMessage.content);
      } catch (error) {
        console.error('Error fetching ideas:', error);
        const errorMessage: ChatMessage = {
          id: nanoid(),
          content: 'Sorry, something went wrong while generating ideas. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
          isStreaming: false,
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsTyping(false);
        setIsGeneratingIdeas(false);
      } finally {
        setIsGeneratingIdeas(false);
      }
    },
    [simulateTyping, searchProvider, selectedSites, numResults]
  );

  const handleBookmark = async (idea: Idea) => {
    if (!idea.id) return;
    try {
      const response = await fetch('/api/ideas/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea),
      });
      if (response.ok) {
        setBookmarkedIds(prev => new Set(prev).add(idea.id!));
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleRetry = useCallback(() => {
    if (lastUserQuery) {
      // Remove the last error message
      setMessages((prev) => prev.slice(0, -1));
      fetchIdeas(lastUserQuery, true);
    }
  }, [lastUserQuery, fetchIdeas]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();

      if (!inputValue.trim() || isTyping) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: nanoid(),
        content: inputValue.trim(),
        role: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');

      // Fetch ideas from the API
      fetchIdeas(inputValue.trim());
    },
    [inputValue, isTyping, fetchIdeas]
  );

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: nanoid(),
        content: "Hello! I'm your AI assistant. I help developers discover cool side project ideas based on real coding problems and technical pain points. Enter a query like 'developer side project ideas' or 'coding workflow problems' to find buildable projects!",
        role: 'assistant',
        timestamp: new Date(),
        sources: [
          { title: "Getting Started Guide", url: "#" },
          { title: "API Documentation", url: "#" },
        ],
      },
    ]);
    setInputValue('');
    setIsTyping(false);
    setStreamingMessageId(null);
    setGeneratedIdeas([]);
    setBookmarkedIds(new Set());
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-muted-foreground text-xs">
            {models.find((m) => m.id === selectedModel)?.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <IconSettings className="size-4" />
                <span className="ml-1">Search Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Search Settings</DialogTitle>
                <DialogDescription>
                  Configure which sites to search and choose your search provider
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Search Provider Selection */}
                <div className="space-y-2">
                  <Label>Search Provider</Label>
                  <Select value={searchProvider} onValueChange={setSearchProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {searchProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-xs text-muted-foreground">{provider.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Results */}
                <div className="space-y-2">
                  <Label>Number of Results</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={numResults}
                    onChange={(e) => setNumResults(Math.min(20, Math.max(1, parseInt(e.target.value) || 5)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose how many search results to analyze (1-20)
                  </p>
                </div>

                {/* Site Selection */}
                <div className="space-y-2">
                  <Label>Sites to Search</Label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                      {popularSites.map((site) => (
                        <div key={site.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={site.id}
                            checked={selectedSites.has(site.id)}
                            onCheckedChange={(checked) => {
                              setSelectedSites((prev) => {
                                const newSet = new Set(prev);
                                if (checked) {
                                  newSet.add(site.id);
                                } else {
                                  newSet.delete(site.id);
                                }
                                return newSet;
                              });
                            }}
                          />
                          <Label
                            htmlFor={site.id}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <div>{site.name}</div>
                            <div className="text-xs text-muted-foreground">{site.id}</div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Custom Site Input */}
                    <div className="space-y-2">
                      <Label>Add Custom Site</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., example.com"
                          value={customSite}
                          onChange={(e) => setCustomSite(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customSite.trim()) {
                              const site = customSite.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                              if (site && !selectedSites.has(site)) {
                                setSelectedSites((prev) => new Set(prev).add(site));
                                setCustomSite('');
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (customSite.trim()) {
                              const site = customSite.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
                              if (site && !selectedSites.has(site)) {
                                setSelectedSites((prev) => new Set(prev).add(site));
                                setCustomSite('');
                              }
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter a domain name (without http://) and press Enter or click Add
                      </p>
                    </div>

                    {/* Selected Sites Summary */}
                    {selectedSites.size > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Sites ({selectedSites.size})</Label>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(selectedSites).map((site) => (
                            <Badge
                              key={site}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {popularSites.find((s) => s.id === site)?.name || site}
                              <button
                                onClick={() => {
                                  setSelectedSites((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(site);
                                    return newSet;
                                  });
                                }}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Option to search all sites */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="search-all"
                        checked={selectedSites.size === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSites(new Set());
                          } else {
                            setSelectedSites(new Set(['reddit.com', 'x.com', 'indiehackers.com']));
                          }
                        }}
                      />
                      <Label htmlFor="search-all" className="text-sm font-normal cursor-pointer">
                        Search all sites (leave site selection empty to search everywhere)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2">
            <IconRotate className="size-4" />
            <span className="ml-1">Reset</span>
          </Button>
        </div>
      </div>

      {/* Conversation Area */}
      <Conversation className="flex-1">
        <ConversationContent className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <Message from={message.role}>
                <MessageContent>
                  {message.isStreaming && typeof message.content === 'string' && message.content === '' ? (
                    <div className="flex items-center gap-2">
                      <Loader size={14} />
                      <span className="text-muted-foreground text-sm">Thinking...</span>
                    </div>
                  ) : (
                    message.content
                  )}
                </MessageContent>
                <MessageAvatar
                  src={message.role === 'user' ? 'https://github.com/dovazencot.png' : 'https://github.com/vercel.png'}
                  name={message.role === 'user' ? 'User' : 'AI'}
                />
              </Message>

              {/* Retry Button for Error Messages */}
              {message.isError && (
                <div className="ml-10 mt-2">
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <IconRotate className="size-4 mr-1" />
                    Retry
                  </Button>
                </div>
              )}

              {/* Reasoning */}
              {message.reasoning && (
                <div className="ml-10">
                  <Reasoning isStreaming={message.isStreaming} defaultOpen={false}>
                    <ReasoningTrigger />
                    <ReasoningContent>{message.reasoning}</ReasoningContent>
                  </Reasoning>
                </div>
              )}

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="ml-10">
                  <Sources>
                    <SourcesTrigger count={message.sources.length} />
                    <SourcesContent>
                      {message.sources.map((source, index) => (
                        <Source key={index} href={source.url} title={source.title} />
                      ))}
                    </SourcesContent>
                  </Sources>
                </div>
              )}
            </div>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>


      {/* Generated Ideas Section */}
      {(generatedIdeas.length > 0 || isGeneratingIdeas) && (
        <div className="p-4">
          {/* <h2 className="text-lg font-semibold mb-4">Generated Project Ideas</h2> */}
          {isGeneratingIdeas && (
            <div className="flex items-center justify-center py-8">
              <Loader size={20} />
              <span className="ml-2 text-muted-foreground">Generating ideas...</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedIdeas.map((idea) => (
              <Card key={idea.id || nanoid()} className="relative hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{idea.title}</CardTitle>
                      {/* Source Site Badge */}
                      {idea.source_site && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            📍 Found on: {idea.source_site}
                          </Badge>
                        </div>
                      )}
                      {!idea.source_site && idea.source_url && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            📍 {idea.ideaSource || 'Unknown source'}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{idea.confidenceScore}%</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(idea)}
                        disabled={!idea.id || (idea.id ? bookmarkedIds.has(idea.id) : false)}
                      >
                        {idea.id && bookmarkedIds.has(idea.id) ? (
                          <IconBookmarkFilled className="h-4 w-4" />
                        ) : (
                          <IconBookmark className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/dashboard/workspace/${idea.id}`}>Open Workspace</Link>
                      </Button>
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
                              {idea.product_idea.map((ideaText, index) => (
                                <li key={index}>{ideaText}</li>
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
                        <div>
                          <h4 className="font-semibold">Confidence Score</h4>
                          <p className="text-sm">{idea.confidenceScore}%</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Generated By</h4>
                          <p className="text-sm">{idea.ideaSource}</p>
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
      )}
        {/* Input Area */}
        <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
            placeholder="Search for side project ideas... (e.g., 'developer CLI tools', 'coding workflow problems', 'unique web app ideas')"
            disabled={isTyping}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton disabled={isTyping}>
                <IconPaperclip size={16} />
              </PromptInputButton>
              <PromptInputButton disabled={isTyping}>
                <IconMicrophone size={16} />
                <span>Voice</span>
              </PromptInputButton>
              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isTyping}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!inputValue.trim() || isTyping}
              status={isTyping ? 'streaming' : 'ready'}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>

    </div>
  );
};

export default function Page() {
  return (
    <div className="h-full p-4">
      <Example />
    </div>
  );
}