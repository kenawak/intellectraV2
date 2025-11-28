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
import { CreditCard, X } from 'lucide-react';

/**
 * PlanReminder Component
 * 
 * Non-blocking reminder modal that appears on the dashboard if plan/paid
 * status is not set. User can select a plan or dismiss the reminder.
 * 
 * Usage:
 * <PlanReminder />
 */
export function PlanReminder() {
  const router = useRouter();
  const [showReminder, setShowReminder] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPlanStatus = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
        });

        if (!response.ok) {
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        
        // Show reminder if plan or paid status is missing
        const hasPlan = data.plan && data.plan !== null && data.plan !== undefined;
        const hasPaidStatus = data.paid !== null && data.paid !== undefined;
        
        if (!hasPlan || !hasPaidStatus) {
          // Check if user has dismissed the reminder in this session
          const dismissed = sessionStorage.getItem('plan-reminder-dismissed');
          if (!dismissed) {
            setShowReminder(true);
          }
        }
      } catch (error) {
        console.error('Error checking plan status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPlanStatus();
  }, []);

  const handleSelectPlan = () => {
    setShowReminder(false);
    router.push('/pricing');
  };

  const handleSkip = () => {
    // Remember dismissal for this session
    sessionStorage.setItem('plan-reminder-dismissed', 'true');
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
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            To get started, please select a plan. You can choose the free tier to explore 
            basic features, or upgrade to unlock advanced capabilities.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            You can select a plan now or dismiss this reminder and choose later from the pricing page.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1 sm:flex-initial"
          >
            Later
          </Button>
          <Button
            onClick={handleSelectPlan}
            className="flex-1 sm:flex-initial"
          >
            Select Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

