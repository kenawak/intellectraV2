/**
 * Type declarations for better-auth modules
 */
declare module "better-auth" {
  export function betterAuth(config: any): any;
}

declare module "better-auth/react" {
  interface CheckoutOptions {
    products?: string[];
    slug?: string;
  }

  interface AuthClientWithPolar {
    checkout?: (options: CheckoutOptions) => Promise<void>;
    signIn: any;
    signOut: any;
    useSession: any;
    [key: string]: any;
  }

  export function createAuthClient(config: any): AuthClientWithPolar;
}

