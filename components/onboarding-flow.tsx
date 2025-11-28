'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import marketData from '@/market.json';
import { usePostHog } from '@posthog/react';
import { authClient } from '@/lib/auth-client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MarketTree = Record<string, any>;

interface OnboardingFlowProps {
  onComplete?: () => void;
}

/**
 * Hierarchical Selection Component for Market Specialization Onboarding
 * 
 * This component guides users through a multi-level selection process
 * to identify their market specialization from the hierarchical market.json structure.
 */
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const { data: session } = authClient.useSession();
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedLeaf, setSelectedLeaf] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigate through the market tree based on current path
  const getCurrentLevel = (): MarketTree => {
    let level: MarketTree = marketData as MarketTree;
    for (const key of currentPath) {
      level = level[key] as MarketTree;
    }
    return level;
  };

  const currentLevel = getCurrentLevel();
  const currentKeys = Object.keys(currentLevel);
  const isLeafNode = currentKeys.length === 0 || Object.values(currentLevel).every(v => {
    const val = v as MarketTree | Record<string, unknown>;
    return typeof val === 'object' && val !== null && Object.keys(val).length === 0;
  });

  /**
   * Handle category selection - navigate down the tree
   */
  const handleCategorySelect = (category: string) => {
    if (isLeafNode) {
      // This shouldn't happen, but handle gracefully
      return;
    }
    setCurrentPath([...currentPath, category]);
    setSelectedLeaf(null); // Reset selection when navigating
  };

  /**
   * Handle back navigation - navigate up the tree
   */
  const handleBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setSelectedLeaf(null);
    }
  };

  /**
   * Handle leaf node selection - prepare for completion
   */
  const handleLeafSelect = (leaf: string) => {
    setSelectedLeaf(leaf);
  };

  /**
   * Complete onboarding and persist to database
   */
  const handleComplete = async () => {
    if (!selectedLeaf) return;

    setIsSubmitting(true);

    try {
      // Build the full path including the selected leaf
      const fullPath = [...currentPath, selectedLeaf];
      
      // Clean the specialization name (replace underscores with spaces)
      const cleanSpecialization = selectedLeaf.replace(/_/g, ' ');

      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketSpecialization: cleanSpecialization,
          specializationPath: fullPath,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save onboarding data');
      }

      // Track onboarding completion
      posthog?.capture('Feature Used', {
        feature_name: 'Onboarding Completed',
        user_id: session?.user?.id,
        market_specialization: cleanSpecialization,
      });

      toast.success('Onboarding completed! Welcome to Intellectra.');
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        // Default: redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If we're at a leaf node, show the selection
  if (isLeafNode && currentPath.length > 0) {
    // Get the parent level to show available leaf options
    const parentPath = currentPath.slice(0, -1);
    let parentLevel: MarketTree = marketData as MarketTree;
    for (const key of parentPath) {
      parentLevel = parentLevel[key] as MarketTree;
    }
    const leafOptions = Object.keys(parentLevel[currentPath[currentPath.length - 1]] as MarketTree || {});

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                {currentPath.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl">Select Your Specialization</CardTitle>
                  <CardDescription className="mt-2">
                    Choose your specific area of focus within{' '}
                    <span className="font-semibold">{currentPath.join(' → ')}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <AnimatePresence mode="wait">
                  {leafOptions.map((option, index) => {
                    const cleanOption = option.replace(/_/g, ' ');
                    const isSelected = selectedLeaf === option;
                    
                    return (
                      <motion.div
                        key={option}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          className={`w-full h-24 text-lg font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'hover:border-primary hover:bg-accent'
                          }`}
                          onClick={() => handleLeafSelect(option)}
                          disabled={isSubmitting}
                        >
                          {isSelected && <Check className="mr-2 h-5 w-5" />}
                          {cleanOption}
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {selectedLeaf && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Focus
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show current level categories
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              {currentPath.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {currentPath.length === 0
                    ? 'Welcome to Intellectra'
                    : `Select ${currentPath[currentPath.length - 1]}`}
                </CardTitle>
                <CardDescription className="mt-2">
                  {currentPath.length === 0
                    ? 'Let\'s personalize your experience. Choose your primary market domain.'
                    : `Navigate to your specific specialization within ${currentPath.join(' → ')}`}
                </CardDescription>
                {currentPath.length > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Path:</span>
                    <span className="font-medium">{currentPath.join(' → ')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="wait">
                {currentKeys.map((key, index) => {
                  const cleanKey = key.replace(/_/g, ' ');
                  const hasChildren = Object.keys(currentLevel[key] as MarketTree).length > 0;
                  
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-32 text-lg font-medium hover:border-primary hover:bg-accent transition-all"
                        onClick={() => handleCategorySelect(key)}
                        disabled={isSubmitting}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span>{cleanKey}</span>
                          {hasChildren && (
                            <span className="text-xs text-muted-foreground">
                              {Object.keys(currentLevel[key] as MarketTree).length} options
                            </span>
                          )}
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

