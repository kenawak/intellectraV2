import { db } from "@/db/drizzle";
import { userprofile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Polar } from "@polar-sh/sdk";

/**
 * Initialize Polar SDK client
 */
export function getPolarClient(): Polar {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const server = process.env.POLAR_SERVER as "sandbox" | "production" | undefined;

  if (!accessToken) {
    throw new Error("POLAR_ACCESS_TOKEN is not set in environment variables");
  }

  return new Polar({
    accessToken,
    server: server || "production",
  });
}

/**
 * Get user's subscription status from database
 * Returns: 'free', 'pro', 'enterprise', or 'inactive'
 */
export async function getSubscriptionStatusFromDB(userId: string): Promise<'free' | 'pro' | 'enterprise' | 'inactive'> {
  try {
    const profile = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (!profile.length) {
      return 'free'; // Default to free if no profile exists
    }

    const plan = profile[0].plan as string;
    const paid = profile[0].paid;

    // If not paid, always return free regardless of plan field
    if (!paid) {
      return 'free';
    }

    // Map plan values to subscription status
    switch (plan.toLowerCase()) {
      case 'pro':
        return 'pro';
      case 'enterprise':
        return 'enterprise';
      case 'free':
      default:
        return 'free';
    }
  } catch (error) {
    console.error("Error fetching subscription status from DB:", error);
    return 'free'; // Default to free on error
  }
}

/**
 * Get user's subscription status from Polar API
 * This makes an API call to Polar to verify subscription status
 */
export async function getSubscriptionStatusFromPolar(userId: string): Promise<'free' | 'pro' | 'enterprise' | 'inactive'> {
  try {
    const profile = await db
      .select()
      .from(userprofile)
      .where(eq(userprofile.userId, userId))
      .limit(1);

    if (!profile.length || !profile[0].customerId) {
      return 'free';
    }

    const polarClient = getPolarClient();
    const customerId = profile[0].customerId;

    // Fetch customer subscriptions from Polar
    const subscriptions = await polarClient.subscriptions.list({
      customerId,
    });

    // Check for active subscriptions
    const subscriptionsList = subscriptions.result?.items || [];
    const activeSubscription = subscriptionsList.find(
      (sub: { status?: string }) => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSubscription) {
      return 'inactive';
    }

    // Map product ID to plan (you may need to adjust these IDs)
    const productId = activeSubscription.productId;
    
    // You can map product IDs to plans here
    // These should match your Polar product IDs
    const productIdToPlan: Record<string, 'pro' | 'enterprise'> = {
      '447405a4-6037-42f5-9138-aa519625dc3e': 'pro',
      'd6aea22f-6156-4bc9-9f4c-a937ad05fa0f': 'enterprise',
    };

    return productIdToPlan[productId] || 'pro';
  } catch (error) {
    console.error("Error fetching subscription status from Polar:", error);
    // Fallback to database status on API error
    return getSubscriptionStatusFromDB(userId);
  }
}

/**
 * Get subscription status (prefers database, falls back to Polar API if needed)
 */
export async function getSubscriptionStatus(userId: string, usePolarAPI: boolean = false): Promise<'free' | 'pro' | 'enterprise' | 'inactive'> {
  if (usePolarAPI) {
    return getSubscriptionStatusFromPolar(userId);
  }
  return getSubscriptionStatusFromDB(userId);
}

