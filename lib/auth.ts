import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import {schema} from "@/db/schema"
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { admin } from "better-auth/plugins/admin";
import { Polar } from "@polar-sh/sdk";
import { getSubscriptionStatus } from "./polar-utils";

// Initialize Polar client
const polarClient = new Polar({
    accessToken: "polar_oat_n4bZNZqPe4XxqAgk90NM62Ihn8NnoOMBwl2SV2tWHH8",
    server: "sandbox",
});

export const auth = betterAuth({
  emailAndPassword: { 
    enabled: true, 
  }, 
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      }
    },
    deleteUser: { enabled: true } 
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        mapProfileToUser: (profile: {
          id: string;
          email?: string;
          name?: string;
          given_name?: string;
          family_name?: string;
          picture?: string;
          avatar_url?: string;
          email_verified?: boolean;
        }) => {
          // Ensure name is always provided - use email if name is missing
          const name = profile.name || 
                      profile.given_name || 
                      profile.family_name || 
                      (profile.email ? profile.email.split('@')[0] : null) || 
                      'User';
          
          return {
            name: name,
            email: profile.email || '',
            image: profile.picture || profile.avatar_url || null,
            emailVerified: profile.email_verified ?? true, // Google emails are verified
          };
        },
    },
},
  trustedOrigins: ["http://localhost:3000", "https://998747a06d30.ngrok-free.app"],
  plugins: [
    admin({
      adminUserIds: ["OMp4mdqfTj4U1jFUHTJO4eXbtjyafCz3"],
      defaultRole: "user",
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      use: [
          checkout({
              products: [
                {
                  productId: "88c88042-ede8-4290-8e6e-b96291bf4c87",
                  slug: "free"
                },
                  {
                      productId: "447405a4-6037-42f5-9138-aa519625dc3e", // ID of Product from Polar Dashboard
                      slug: "pro" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
                  },
                  {
                      productId: "d6aea22f-6156-4bc9-9f4c-a937ad05fa0f", // ID of Product from Polar Dashboard
                      slug: "enterprise" // Custom slug for easy reference in Checkout URL, e.g. /checkout/enterprise
                  }
              ],
              successUrl: "/onboarding",
              authenticatedUsersOnly: true
          }),
          portal(),
          usage(),
          webhooks({
              secret: process.env.POLAR_WEBHOOK_SECRET as string,
              onCustomerStateChanged: async (payload) => {
                console.log("payload", payload);
              }, // Triggered when anything regarding a customer changes
              onOrderPaid: async (payload) => {
                console.log("payload", payload);
              },
          })
      ],
    }),
    nextCookies(),
  ],
});