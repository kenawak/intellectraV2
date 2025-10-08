import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    role: text("role").default("user"),
  });
  
  export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  });
  
  export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  });
  
  export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  });
  
export const userprofile = pgTable("userprofile", {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    paid: boolean("paid").default(false).notNull(),
    plan: text("plan").default("free").notNull(),
    customerId: text("customer_id"),
    totalTokensSpent: integer("total_tokens_spent").default(0).notNull(),
    tokenLimit: integer("token_limit").default(10000).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  });

export const userAnalytics = pgTable("user_analytics", {
  id: text("id").primaryKey(),
  userId: text("user_id").unique(),
  route: text("route").notNull(),
  method: text("method").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  generationAttemptsCount: integer("generation_attempts_count").default(0),
  generationAttemptsResetTime: timestamp("generation_attempts_reset_time"),
  generationAttemptsIsRateLimited: boolean("generation_attempts_is_rate_limited").default(false),
  tokensUsedThisHour: integer("tokens_used_this_hour").default(0),
  tokensResetTime: timestamp("tokens_reset_time"),
  isTokenRateLimited: boolean("is_token_rate_limited").default(false),
  tokenLimitPerHour: integer("token_limit_per_hour").default(20000),
  sessionId: text("session_id"),
});

export const idea = pgTable("idea", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  unmetNeeds: text("unmet_needs").array().default([]),
  productIdea: text("product_idea").array().default([]),
  proofOfConcept: text("proof_of_concept").default(""),
  sourceUrl: text("source_url").unique(),
  promptUsed: text("prompt_used"),
  confidenceScore: integer("confidence_score"),
  suggestedPlatforms: text("suggested_platforms").array().default([]),
  creationDate: text("creation_date").default(""),
  ideaSource: text("idea_source").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookmarkedIdea = pgTable("bookmarked_idea", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  unmetNeeds: text("unmet_needs").array().default([]),
  productIdea: text("product_idea").array().default([]),
  proofOfConcept: text("proof_of_concept").default(""),
  sourceUrl: text("source_url"),
  promptUsed: text("prompt_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tokenUsage = pgTable("token_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tokensUsed: integer("tokens_used").notNull(),
  operation: text("operation").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
});


export const schema = {user, session, account, verification, userprofile, userAnalytics, idea, bookmarkedIdea, tokenUsage};