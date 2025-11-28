'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from '@posthog/react';

/**
 * PostHog Provider Component
 * 
 * Initializes PostHog with:
 * - autocapture: false (no automatic event tracking)
 * - capture_pageview: false (manual pageview tracking only)
 * - person_profiles: 'always' (always create user profiles)
 * - disable_session_recording: true (no session recording)
 * 
 * Loaded via dynamic import to avoid SSR issues.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize on client-side
    if (typeof window === 'undefined') return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (!posthogKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('PostHog: NEXT_PUBLIC_POSTHOG_KEY is not set. Analytics will be disabled.');
      }
      return;
    }

    // Only initialize if not already initialized
    if (posthog.__loaded || posthog.config?.token === posthogKey) {
      return;
    }

    // Initialize PostHog
    posthog.init(posthogKey, {
      api_host: posthogHost,
      autocapture: false, // Disable all automatic event capture
      capture_pageview: false, // Manual pageview tracking only
      person_profiles: 'always', // Always create user profiles
      disable_session_recording: true, // Disable session recording
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog initialized:', ph);
        }
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

