/**
 * Type augmentation for BetterAuth to include subscriptionStatus in User type
 */
declare module "better-auth" {
  interface User {
    subscriptionStatus?: 'free' | 'pro' | 'enterprise' | 'inactive' | string;
  }
  
  interface Session {
    user: User & {
      subscriptionStatus?: 'free' | 'pro' | 'enterprise' | 'inactive' | string;
    };
  }
}

declare module "better-auth/react" {
  interface User {
    subscriptionStatus?: 'free' | 'pro' | 'enterprise' | 'inactive' | string;
  }
}

