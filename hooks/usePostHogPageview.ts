'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePostHog } from '@posthog/react';

/**
 * Custom hook for manual pageview tracking in Next.js App Router
 * 
 * Tracks pageviews on route changes using:
 * - usePathname() to detect route changes
 * - useSearchParams() to capture query parameters
 * - posthog.capture('$pageview') with full URL
 * 
 * Usage: Add <PostHogPageview /> to any page or layout component
 */
export function usePostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    // Check if PostHog is initialized and ready
    if (!posthog) return;
    
    // Type-safe check: verify PostHog has capture method
    if (typeof posthog.capture !== 'function') return;

    // Build full URL with search params
    const url = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Capture pageview with full URL
    // PostHog will handle the case if it's not fully initialized yet
    try {
      posthog.capture('$pageview', {
        $current_url: typeof window !== 'undefined' 
          ? `${window.location.origin}${url}`
          : url,
      });
    } catch (error) {
      // Silently fail if PostHog is not ready
      if (process.env.NODE_ENV === 'development') {
        console.warn('PostHog pageview capture failed:', error);
      }
    }
  }, [pathname, searchParams, posthog]);
}

/**
 * Component wrapper for pageview tracking
 * 
 * Usage: <PostHogPageview /> in any page or layout
 */
export function PostHogPageview() {
  usePostHogPageview();
  return null;
}

