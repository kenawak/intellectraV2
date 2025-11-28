'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan?: 'pro' | 'enterprise';
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Higher-Order Component to protect paid features
 * Redirects to Polar checkout if user doesn't have required subscription
 */
export function SubscriptionGuard({
  children,
  requiredPlan = 'pro',
  redirectTo,
  fallback,
}: SubscriptionGuardProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      // User not authenticated, redirect to login
      router.push('/login');
      return;
    }

    const subscriptionStatus = session.user.subscriptionStatus as string | undefined;
    const polarUrl = process.env.NEXT_PUBLIC_POLAR_URL || 'https://api.polar.sh';

    // Check subscription status
    if (!subscriptionStatus || subscriptionStatus === 'free' || subscriptionStatus === 'inactive') {
      // Redirect to Polar checkout or pricing page
      const checkoutUrl = redirectTo || `${polarUrl}/checkout/${requiredPlan}`;
      window.location.href = checkoutUrl;
      return;
    }

    // Check if user has required plan
    if (requiredPlan === 'enterprise' && subscriptionStatus !== 'enterprise') {
      const checkoutUrl = redirectTo || `${polarUrl}/checkout/enterprise`;
      window.location.href = checkoutUrl;
      return;
    }

    if (requiredPlan === 'pro' && subscriptionStatus !== 'pro' && subscriptionStatus !== 'enterprise') {
      const checkoutUrl = redirectTo || `${polarUrl}/checkout/pro`;
      window.location.href = checkoutUrl;
      return;
    }
  }, [session, isPending, requiredPlan, redirectTo, router]);

  // Show loading state
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show fallback if provided
  if (fallback && (!session?.user || !hasRequiredPlan(session.user.subscriptionStatus, requiredPlan))) {
    return <>{fallback}</>;
  }

  // Check if user has required plan
  if (!session?.user || !hasRequiredPlan(session.user.subscriptionStatus, requiredPlan)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

/**
 * Helper function to check if user has required plan
 */
function hasRequiredPlan(
  subscriptionStatus: string | undefined,
  requiredPlan: 'pro' | 'enterprise'
): boolean {
  if (!subscriptionStatus) return false;

  if (requiredPlan === 'enterprise') {
    return subscriptionStatus === 'enterprise';
  }

  // For 'pro' requirement, both 'pro' and 'enterprise' qualify
  return subscriptionStatus === 'pro' || subscriptionStatus === 'enterprise';
}

/**
 * Hook to check subscription status
 */
export function useSubscription() {
  const { data: session, isPending } = authClient.useSession();

  const subscriptionStatus = session?.user?.subscriptionStatus as
    | 'free'
    | 'pro'
    | 'enterprise'
    | 'inactive'
    | undefined;

  const isPro = subscriptionStatus === 'pro' || subscriptionStatus === 'enterprise';
  const isEnterprise = subscriptionStatus === 'enterprise';
  const isFree = !subscriptionStatus || subscriptionStatus === 'free' || subscriptionStatus === 'inactive';

  return {
    subscriptionStatus,
    isPro,
    isEnterprise,
    isFree,
    isLoading: isPending,
  };
}

