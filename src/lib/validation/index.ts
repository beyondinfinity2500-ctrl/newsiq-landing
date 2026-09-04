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
