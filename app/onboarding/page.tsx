'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding-flow';
import { AuthGuard } from '@/components/auth-guard';
import { authClient } from '@/lib/auth-client';

/**
 * Onboarding Page
 * 
 * This page displays the hierarchical market specialization selection flow.
 * It is protected by AuthGuard and ensures plan/paid is set before allowing onboarding.
 * 
 * Flow: Login → Pricing → Checkout → /onboarding (this page)
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [needsPlan, setNeedsPlan] = useState(false);
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  useEffect(() => {
    const checkPlanStatus = async () => {
      // Wait for session to load
      if (isSessionLoading) return;

      // If not authenticated, let AuthGuard handle it
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      try {
        // Check user profile for plan/paid status
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('Failed to check plan status');
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        
        // Check if paid and plan are set
        const hasPlan = data.plan && data.plan !== null && data.plan !== undefined;
        const hasPaidStatus = data.paid !== null && data.paid !== undefined;
        
        // If plan or paid status is missing, redirect to pricing
        if (!hasPlan || !hasPaidStatus) {
          console.log('⚠️ Plan or paid status not set, redirecting to pricing');
          setNeedsPlan(true);
          router.push('/pricing');
          return;
        }
        
        console.log(`✅ Plan status verified: plan=${data.plan}, paid=${data.paid}`);
      } catch (error) {
        console.error('Error checking plan status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPlanStatus();
  }, [session, isSessionLoading, router]);

  // Show loading state while checking
  if (isChecking || isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // If plan is needed, we've redirected
  if (needsPlan) {
    return null;
  }

  return (
    <AuthGuard>
      <OnboardingFlow />
    </AuthGuard>
  );
}

