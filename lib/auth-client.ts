import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
// Note: Admin client features may require server-side implementation
// For now, we'll handle admin features via API routes

export const authClient = createAuthClient({
  baseURL: process.env.BASE_URL as string,
  plugins: [polarClient()], // Admin features handled via API routes
});

export const { signIn, signOut, useSession } = authClient;
