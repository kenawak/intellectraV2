'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';
import { authClient } from '@/lib/auth-client';

/**
 * OnboardingGuard Component
 * 
 * Checks if the user has completed onboarding. If not, shows onboarding flow.
 * 
 * PRECONDITION: This assumes plan acquisition (paid/plan) is already complete.
 * Use PlanAcquisitionGuard before this component.
 * 
 * Usage:
 * <PlanAcquisitionGuard>
 *   <OnboardingGuard>
 *     <YourProtectedContent />
 *   </OnboardingGuard>
 * </PlanAcquisitionGuard>
 */
interface OnboardingGuardProps {
  children: React.ReactNode;
  /**
   * If true, onboarding is optional (non-blocking).
   * User can skip and complete later via dashboard reminder.
   */
  optional?: boolean;
}

export function OnboardingGuard({ children, optional = false }: OnboardingGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for session to load
      if (isSessionLoading) return;

      // If not authenticated, let AuthGuard handle it
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/onboarding/complete', {
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('Failed to check onboarding status');
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        
        // If onboarding is not complete
        if (!data.onboardingComplete) {
          // If optional, don't block - let dashboard reminder handle it
          if (optional) {
            console.log('ℹ️ Onboarding not complete, but optional - allowing access');
            setNeedsOnboarding(false);
          } else {
            // Blocking: show onboarding flow
            setNeedsOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [session, isSessionLoading, optional]);

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

  // If onboarding is needed and not optional, show the onboarding flow
  if (needsOnboarding && !optional) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setNeedsOnboarding(false);
          router.refresh();
        }}
      />
    );
  }

  // Onboarding complete or optional, render children
  return <>{children}</>;
}

