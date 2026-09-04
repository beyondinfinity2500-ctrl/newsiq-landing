/**
 * Centralized validation schemas.
 * Each schema uses Zod and is the single source of truth for the shape of that data.
 * Reuse these in Server Actions, API routes, and form components.
 */

import { z } from "zod";
import { siteConfig } from "@/config/site";

export const localeSchema = z.enum(siteConfig.locales);

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated");

export const postStatusSchema = z.enum(["draft", "published", "archived"]);
export const importanceSchema = z.enum(["low", "medium", "high", "breaking"]);
export const verificationSchema = z.enum(["unverified", "verified", "disputed"]);

export const createPostSchema = z.object({
  original_locale: localeSchema,
  importance: importanceSchema.default("medium"),
  country: z.string().max(2).nullable().optional(),
  continent: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  entities: z.array(z.string()).default([]),
  financial_assets: z.array(z.string()).default([]),
  hashtags: z.array(z.string()).default([]),
});

export const createPostTranslationSchema = z.object({
  post_id: z.string().uuid(),
  locale: localeSchema,
  title: z.string().min(1).max(300),
  slug: slugSchema,
  summary: z.string().max(500).optional(),
  content: z.string(),
  seo_title: z.string().max(300).nullable().optional(),
  seo_description: z.string().max(500).nullable().optional(),
  is_original: z.boolean().default(false),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// =============================================================================
// Authentication & profile validation (Phase 4)
// =============================================================================

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password is too long");

const displayNameSchema = z
  .string()
  .trim()
  .max(80, "Display name must be 80 characters or fewer")
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

const avatarUrlSchema = z
  .string()
  .trim()
  .max(2048, "Avatar URL is too long")
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v),
    "Avatar URL must start with http:// or https://",
  )
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .max(64, "Timezone is too long");

const preferredLocaleSchema = localeSchema;

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Please enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const updateProfileSchema = z.object({
  display_name: displayNameSchema,
  avatar_url: avatarUrlSchema,
  preferred_locale: preferredLocaleSchema,
  timezone: timezoneSchema,
});

export const changeRoleSchema = z.object({
  userId: z.string().uuid("Invalid user id"),
  role: z.enum(["visitor", "user", "pro", "editor", "admin", "super_admin"]),
});

// =============================================================================
// AI analysis (Phase 7) — strict structured-output schemas.
// =============================================================================

export const aiDirectionSchema = z.enum(["bullish", "bearish", "mixed", "neutral", "uncertain"]);
export const aiImpactStrengthSchema = z.enum(["low", "medium", "high"]);
export const aiTimeHorizonSchema = z.enum(["immediate", "short_term", "medium_term", "long_term"]);
export const aiConfidenceSchema = z.enum(["low", "medium", "high"]);
export const aiAssetClassSchema = z.enum([
  "equities",
  "indices",
  "bonds",
  "commodities",
  "currencies",
  "cryptocurrencies",
  "sectors",
]);
export const aiEntityTypeSchema = z.enum([
  "person",
  "company",
  "country",
  "organization",
  "product",
  "financial_asset",
  "geopolitical_entity",
]);

export const aiAffectedAssetSchema = z.object({
  symbol: z.string().min(1).max(32).describe("Ticker or canonical asset name, e.g. BTC, GOLD, OIL, USD, ^SPX"),
  name: z.string().min(1).max(120),
  asset_class: aiAssetClassSchema,
  direction: aiDirectionSchema,
  impact_strength: aiImpactStrengthSchema,
  reasoning: z.string().min(1).max(1000),
});

export const aiAffectedSectorSchema = z.object({
  sector: z.string().min(1).max(80),
  direction: aiDirectionSchema,
  reasoning: z.string().min(1).max(500),
});

export const aiEntitySchema = z.object({
  name: z.string().min(1).max(200),
  type: aiEntityTypeSchema,
  relevance: z.number().min(0).max(1),
});

export const aiGeographicImpactSchema = z.object({
  country_code: z.string().length(2).optional().nullable(),
  region: z.string().min(1).max(120).optional().nullable(),
  direction: aiDirectionSchema,
  reasoning: z.string().min(1).max(500),
});

export const aiAnalysisSchema = z.object({
  summary: z.string().min(20).max(2000),
  why_it_matters: z.string().min(20).max(2000),
  economic_impact: z.string().min(20).max(2000),
  market_impact: aiDirectionSchema,
  affected_sectors: z.array(aiAffectedSectorSchema).max(20),
  affected_assets: z.array(aiAffectedAssetSchema).max(50),
  geographic_impact: z.array(aiGeographicImpactSchema).max(30),
  key_entities: z.array(aiEntitySchema).max(50),
  time_horizon: aiTimeHorizonSchema,
  confidence: aiConfidenceSchema,
  risks: z.array(z.string().min(1).max(500)).max(20),
  opportunities: z.array(z.string().min(1).max(500)).max(20),
  uncertainty: z.object({
    reason: z.string().min(1).max(500),
    missing_information: z.array(z.string().min(1).max(200)).max(20),
    conflicting_sources: z.array(z.string().min(1).max(200)).max(20),
  }),
  insufficient_information: z.boolean().default(false),
});

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
