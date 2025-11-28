'use client';

import { useEffect } from 'react';
import { usePostHog } from '@posthog/react';
import { usePathname } from 'next/navigation';

interface FeaturedSnippetProps {
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * FeaturedSnippet Component
 * 
 * Optimizes content for featured snippets and tracks GEO events
 */
export function FeaturedSnippet({ title, description, keywords = [] }: FeaturedSnippetProps) {
  const posthog = usePostHog();
  const pathname = usePathname();

  useEffect(() => {
    // Track GEO page view
    posthog?.capture('GEO Page Viewed', {
      page: pathname,
      keywords: keywords,
      title: title,
    });
  }, [pathname, keywords, title, posthog]);

  return (
    <div className="space-y-2">
      <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

