'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Search,
  FileSearch,
  Bot,
  LineChart,
  Target,
  Blocks,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth-guard';

const features = [
  {
    title: 'Combined Real-Time Search',
    icon: <Search className="size-6" />,
    access: 'Free' as const,
  },
  {
    title: 'Deep Search & Full-Text Reports',
    icon: <FileSearch className="size-6" />,
    access: 'Paid' as const,
  },
  {
    title: 'Basic Idea Generation',
    icon: <Bot className="size-6" />,
    access: 'Free' as const,
  },
  {
    title: 'Google Trends Integration',
    icon: <LineChart className="size-6" />,
    access: 'Paid' as const,
  },
  {
    title: 'Competitive & Market Tracking',
    icon: <Target className="size-6" />,
    access: 'Paid' as const,
  },
  {
    title: 'Production-Ready Scaffolding',
    icon: <Blocks className="size-6" />,
    access: 'Paid' as const,
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    frequency: 'Forever',
    tagline: 'Start validating ideas instantly.',
    buttonText: 'Get Started Free',
    slug: undefined,
    productId: undefined,
    recommended: false,
  },
  {
    name: 'Pro',
    price: '$19',
    frequency: '/mo',
    tagline: 'Recommended. Unlock deep insights and competitive edge.',
    buttonText: 'Start 7-Day Trial',
    slug: 'pro',
    productId: '447405a4-6037-42f5-9138-aa519625dc3e',
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    frequency: '/yr',
    tagline: 'Custom solutions for large teams and high-volume data needs.',
    buttonText: 'Contact Sales',
    slug: 'enterprise',
    productId: 'd6aea22f-6156-4bc9-9f4c-a937ad05fa0f',
    recommended: false,
  },
];

/**
 * Check if a feature is included in a plan
 */
function isFeatureIncluded(featureAccess: 'Free' | 'Paid', planName: string): boolean {
  if (planName === 'Enterprise') {
    return true; // Enterprise gets everything
  }
  if (planName === 'Pro') {
    return true; // Pro gets both Free and Paid features
  }
  if (planName === 'Free') {
    return featureAccess === 'Free'; // Free only gets Free features
  }
  return false;
}

export default function PricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const currentPlan = (session?.user as { subscriptionStatus?: string })?.subscriptionStatus || 'free';

  const handleCheckout = async (productId?: string, slug?: string) => {
    if (!productId) {
      toast.error('Product ID is required for checkout');
      return;
    }

    try {
      console.log('productId', productId);
      console.log('slug', slug);
      setIsLoading(slug || 'checkout');
      
      if (authClient.checkout) {
        await authClient.checkout({
          products: [productId],
        });
      } else {
        console.error('Checkout method not available');
        toast.error('Checkout is not available. Please try again later.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setIsLoading(null);
      toast.error('Failed to start checkout. Please try again.');
    }
  };

  const handleFreePlan = async () => {
    try {
      setIsLoading('free');
      const response = await fetch('/api/user/init-free-profile', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to initialize free profile');
      }

      toast.success('Free plan activated!');
      // Redirect to onboarding after free plan activation
      setTimeout(() => {
        router.push('/onboarding');
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Free plan activation error:', error);
      toast.error('Failed to activate free plan. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleEnterpriseContact = () => {
    window.location.href = 'mailto:sales@intellectra.com';
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background py-8 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upgrade your plan to unlock more features. All plans include 24/7 support.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {plans.map((plan, index) => {
              const isCurrentPlan = 
                (plan.name === 'Free' && currentPlan === 'free') ||
                (plan.name === 'Pro' && (currentPlan === 'pro' || currentPlan === 'enterprise')) ||
                (plan.name === 'Enterprise' && currentPlan === 'enterprise');

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={cn(
                    'relative bg-card border border-border rounded-3xl p-8 flex flex-col',
                    plan.recommended
                      ? 'shadow-xl dark:shadow-primary/50 border-primary/30 lg:-mt-4 lg:mb-4'
                      : 'shadow-md'
                  )}
                >
                  {/* Recommended Badge */}
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                      {plan.frequency !== 'Forever' && (
                        <span className="text-muted-foreground text-lg">{plan.frequency}</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{plan.tagline}</p>
                  </div>

                  {/* CTA Button */}
                  <div className="mb-8">
                    {plan.name === 'Enterprise' ? (
                      <Button
                        onClick={handleEnterpriseContact}
                        disabled={isCurrentPlan}
                        className={cn(
                          'w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300',
                          plan.recommended
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 disabled:opacity-50'
                            : 'bg-muted text-foreground hover:bg-muted/80 border border-border disabled:opacity-50',
                          isCurrentPlan && 'cursor-not-allowed'
                        )}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                      </Button>
                    ) : plan.name === 'Free' ? (
                      <Button
                        onClick={handleFreePlan}
                        disabled={isLoading === 'free' || isCurrentPlan}
                        className={cn(
                          'w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300',
                          'bg-muted text-foreground hover:bg-muted/80 border border-border disabled:opacity-50',
                          isCurrentPlan && 'cursor-not-allowed'
                        )}
                      >
                        {isLoading === 'free' ? 'Activating...' : isCurrentPlan ? 'Current Plan' : plan.buttonText}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCheckout(plan.productId, plan.slug)}
                        disabled={isLoading === plan.slug || isCurrentPlan}
                        className={cn(
                          'w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300',
                          plan.recommended
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 disabled:opacity-50'
                            : 'bg-muted text-foreground hover:bg-muted/80 border border-border disabled:opacity-50',
                          isCurrentPlan && 'cursor-not-allowed'
                        )}
                      >
                        {isLoading === plan.slug
                          ? 'Processing...'
                          : isCurrentPlan
                          ? 'Current Plan'
                          : plan.buttonText}
                      </Button>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="flex-1 space-y-4">
                    <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
                        Features
                      </h4>
                      <ul className="space-y-3">
                        {features.map((feature, featureIndex) => {
                          const included = isFeatureIncluded(feature.access, plan.name);
                          return (
                            <li key={featureIndex} className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                {included ? (
                                  <CheckCircle2 className="size-5 text-primary" />
                                ) : (
                                  <XCircle className="size-5 text-muted-foreground/50" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span
                                  className={cn(
                                    'text-sm',
                                    included ? 'text-foreground' : 'text-muted-foreground/50 line-through'
                                  )}
                                >
                                  {feature.title}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            className="bg-card border border-border rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">
                      Free
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-primary">
                      Pro
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className={cn(
                        'border-b border-border',
                        index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                      )}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="text-primary">{feature.icon}</div>
                          <span className="text-sm font-medium text-foreground">
                            {feature.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isFeatureIncluded(feature.access, 'Free') ? (
                          <CheckCircle2 className="size-5 text-primary mx-auto" />
                        ) : (
                          <XCircle className="size-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isFeatureIncluded(feature.access, 'Pro') ? (
                          <CheckCircle2 className="size-5 text-primary mx-auto" />
                        ) : (
                          <XCircle className="size-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isFeatureIncluded(feature.access, 'Enterprise') ? (
                          <CheckCircle2 className="size-5 text-primary mx-auto" />
                        ) : (
                          <XCircle className="size-5 text-muted-foreground/50 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-muted-foreground mb-4">
              Questions?{' '}
              <a href="mailto:sales@intellectra.com" className="text-primary hover:underline">
                Contact our sales team
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              All plans include 24/7 support. Cancel anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}
