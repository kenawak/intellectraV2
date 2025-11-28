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
    geminiApiKeyEncrypted: text("gemini_api_key_encrypted"),
    geminiApiKeyIv: text("gemini_api_key_iv"),
    geminiApiKeyVersion: integer("gemini_api_key_version").default(1),
    marketSpecialization: text("market_specialization"),
    specializationPath: text("specialization_path").array().default([]),
    onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  });

// Feature Analytics - Comprehensive tracking for core features
export const featureAnalytics = pgTable("feature_analytics", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(), // 'bookmark' | 'idea-validator' | 'market-opportunities' | 'new-project'
  action: text("action").notNull(), // 'create' | 'read' | 'update' | 'delete' | 'generate' | 'validate' | 'search'
  status: text("status").notNull(), // 'success' | 'error' | 'rate_limited'
  tokensUsed: integer("tokens_used").default(0).notNull(),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  metadata: jsonb("metadata"), // Additional context (query, idea text, error message, etc.)
  duration: integer("duration"), // Duration in milliseconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Legacy userAnalytics table - kept for backward compatibility but deprecated
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
  tokenLimitPerHour: integer("token_limit_per_hour").default(100000),
  sessionId: text("session_id"),
  specGenerationsToday: integer("spec_generations_today").default(0),
  specGenerationsResetDate: timestamp("spec_generations_reset_date"),
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
  suggestedPlatforms: text("suggested_platforms").default("[]"),
  creationDate: text("creation_date").default(""),
  ideaSource: text("idea_source").default(""),
  requirements: text("requirements"),
  design: text("design"),
  tasks: text("tasks"),
  codeStubs: jsonb("code_stubs"),
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
  confidenceScore: integer("confidence_score"),
  suggestedPlatforms: jsonb("suggested_platforms").default([]),
  requirements: text("requirements"),
  design: text("design"),
  tasks: text("tasks"),
  codeStubs: jsonb("code_stubs"),
  cursorPrompt: text("cursor_prompt"),
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

export const vote = pgTable("vote", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" }),
  ideaId: text("idea_id")
    .notNull()
    .references(() => idea.id, { onDelete: "cascade" }),
  voteType: text("vote_type").notNull(), // 'up' or 'down'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const githubProject = pgTable("github_project", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  repoUrl: text("repo_url").notNull(),
  repoName: text("repo_name").notNull(),
  repoDescription: text("repo_description"),
  repoLanguage: text("repo_language"),
  inferredTechStack: text("inferred_tech_stack"),
  packageJson: jsonb("package_json"),
  requirementsTxt: text("requirements_txt"),
  keyFiles: jsonb("key_files"),
  isAnalyzed: boolean("is_analyzed").default(false),
  lastAnalyzedAt: timestamp("last_analyzed_at"),
  cursorPrompt: text("cursor_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const report = pgTable("report", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  marketSpecialization: text("market_specialization"),
  reportContent: text("report_content").notNull(),
  resultsCount: integer("results_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});


export const schema = {user, session, account, verification, userprofile, userAnalytics, featureAnalytics, idea, bookmarkedIdea, tokenUsage, vote, githubProject, report};