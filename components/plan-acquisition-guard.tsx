'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * PlanAcquisitionGuard Component
 * 
 * Non-blocking guard that allows dashboard access regardless of plan status.
 * Plan reminders are handled by PlanReminder component on the dashboard.
 * 
 * This ensures the flow never blocks, but plan status is still checked for
 * other purposes (like feature gating).
 * 
 * Usage:
 * <PlanAcquisitionGuard>
 *   <OnboardingGuard>
 *     <YourContent />
 *   </OnboardingGuard>
 * </PlanAcquisitionGuard>
 */
interface PlanAcquisitionGuardProps {
  children: React.ReactNode;
}

export function PlanAcquisitionGuard({ children }: PlanAcquisitionGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
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
        // Check user profile for plan/paid status (for logging/debugging)
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const hasPlan = data.plan && data.plan !== null && data.plan !== undefined;
          const hasPaidStatus = data.paid !== null && data.paid !== undefined;
          
          if (hasPlan && hasPaidStatus) {
            console.log(`✅ Plan status: plan=${data.plan}, paid=${data.paid}`);
          } else {
            console.log('ℹ️ Plan status not set - reminder will show on dashboard');
          }
        }
      } catch (error) {
        console.error('Error checking plan status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPlanStatus();
  }, [session, isSessionLoading]);

  // Show loading state while checking (brief)
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

  // Always render children - no blocking
  return <>{children}</>;
}

