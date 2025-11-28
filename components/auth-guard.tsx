'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Simplified client-side authentication guard
 * Uses router.push for faster navigation and reduced API calls
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isPending) return;
    if (hasRedirected.current) return;
    if (pathname === redirectTo) return;

    if (requireAuth && !session?.user) {
      hasRedirected.current = true;
      router.push(redirectTo);
    }
  }, [session, isPending, requireAuth, redirectTo, pathname, router]);

  // Minimal loading state
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !session?.user) {
    return null;
  }

  return <>{children}</>;
}

