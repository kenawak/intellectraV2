/**
 * Session extension for better-auth
 * This file extends the session type to include subscriptionStatus
 */

import { getSubscriptionStatus } from './polar-utils';

/**
 * Extend session with subscription status
 * This should be called after getting a session to enrich it with subscription data
 */
interface SessionUser {
  id: string;
  [key: string]: unknown;
}

interface Session {
  user?: SessionUser;
  [key: string]: unknown;
}

export async function enrichSessionWithSubscription(session: Session | null | undefined) {
  if (!session?.user?.id) {
    return {
      ...session,
      user: {
        ...session?.user,
        subscriptionStatus: 'free' as const,
      },
    };
  }

  try {
    const subscriptionStatus = await getSubscriptionStatus(session.user.id, false);
    return {
      ...session,
      user: {
        ...session.user,
        subscriptionStatus,
      },
    };
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return {
      ...session,
      user: {
        ...session.user,
        subscriptionStatus: 'free' as const,
      },
    };
  }
}

