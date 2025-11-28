'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * OnboardingReminder Component
 * 
 * Non-blocking reminder modal that appears on the dashboard if onboarding
 * is not complete. User can complete onboarding now or skip for later.
 * 
 * Usage:
 * <OnboardingReminder />
 */
export function OnboardingReminder() {
  const router = useRouter();
  const [showReminder, setShowReminder] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/onboarding/status', {
          credentials: 'include',
        });

        if (!response.ok) {
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        
        // Show reminder if onboarding is not complete
        if (!data.onboardingComplete) {
          // Check if user has dismissed the reminder in this session
          const dismissed = sessionStorage.getItem('onboarding-reminder-dismissed');
          if (!dismissed) {
            setShowReminder(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleCompleteNow = () => {
    setShowReminder(false);
    // Clear dismissal flag since user is completing
    sessionStorage.removeItem('onboarding-reminder-dismissed');
    router.push('/onboarding');
  };

  const handleSkip = () => {
    // Remember dismissal for this session
    sessionStorage.setItem('onboarding-reminder-dismissed', 'true');
    setShowReminder(false);
  };


  // Don't render anything while checking or if reminder shouldn't show
  if (isChecking || !showReminder) {
    return null;
  }

  return (
    <Dialog open={showReminder} onOpenChange={setShowReminder}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Your Profile</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Help us personalize your experience by selecting your market specialization. 
            This allows us to provide more relevant insights and recommendations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            You can complete this now or skip and do it later from your dashboard settings.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 sm:flex-initial"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleCompleteNow}
            className="flex-1 sm:flex-initial"
          >
            Complete Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

