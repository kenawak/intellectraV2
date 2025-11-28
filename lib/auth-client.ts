import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
  baseURL: process.env.BASE_URL as string,
  plugins: [polarClient()], // safe, no any inferred
});

export const { signIn, signOut, useSession } = authClient;
