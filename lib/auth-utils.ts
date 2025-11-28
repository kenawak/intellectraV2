import { auth } from './auth';
import { NextRequest } from 'next/server';
import { getSubscriptionStatus } from './polar-utils';
import { enrichSessionWithSubscription } from './auth-session-extension';

export async function getSession(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  return await enrichSessionWithSubscription(session);
}

export async function getUser(req: NextRequest) {
  const session = await getSession(req);
  return session?.user;
}

export async function requireAuth(req: NextRequest) {
  const session = await auth.api.getSession({
      headers: req.headers
  })
  console.log("session", session)
  if (!session) {
    throw new Error('Unauthorized');
  }
  return await enrichSessionWithSubscription(session);
}

export async function optionalAuth(req: NextRequest) {
  const session = await getSession(req);
  return session;
}

interface UserWithRole {
  role?: string;
  [key: string]: unknown;
}

export async function requireAdmin(req: NextRequest) {
  const session = await requireAuth(req);
  const userRole = (session.user as UserWithRole).role;
  if (userRole !== 'admin') {
    throw new Error('Forbidden');
  }
  return session;
}

/**
 * Require user to have a paid subscription (pro or enterprise)
 * Throws error if user doesn't have required subscription
 */
export async function requireSubscription(
  req: NextRequest,
  requiredPlan: 'pro' | 'enterprise' = 'pro'
) {
  const session = await requireAuth(req);
  
  if (!session.user?.id) {
    throw new Error('User ID not found in session');
  }
  
  // Get subscription status from database (faster than API call)
  const subscriptionStatus = await getSubscriptionStatus(session.user.id, false);
  
  if (requiredPlan === 'enterprise' && subscriptionStatus !== 'enterprise') {
    throw new Error('Enterprise subscription required');
  }
  
  if (requiredPlan === 'pro' && subscriptionStatus !== 'pro' && subscriptionStatus !== 'enterprise') {
    throw new Error('Pro subscription required');
  }
  
  return session;
}

/**
 * Check if user has required subscription (non-throwing version)
 */
export async function hasSubscription(
  req: NextRequest,
  requiredPlan: 'pro' | 'enterprise' = 'pro'
): Promise<boolean> {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return false;
    }
    
    const subscriptionStatus = await getSubscriptionStatus(session.user.id, false);
    
    if (requiredPlan === 'enterprise') {
      return subscriptionStatus === 'enterprise';
    }
    
    return subscriptionStatus === 'pro' || subscriptionStatus === 'enterprise';
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}