import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import {schema} from "@/db/schema"
import { nextCookies } from "better-auth/next-js";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: 'sandbox'
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
    }, 
},
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
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
                      slug: "enterprise" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
                  }
              ],
              successUrl: "/dashboard",
              authenticatedUsersOnly: true
          }),
          portal(),
          usage(),
          webhooks({
              secret: process.env.POLAR_WEBHOOK_SECRET as string,
          })
      ],
  }),
  nextCookies(),
 
  ]
});