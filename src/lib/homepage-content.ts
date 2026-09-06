/**
 * Temporary homepage seed content (3 manually selected current stories).
 *
 * This file exists so the homepage is not empty while the full editorial
 * pipeline is being developed. It is NOT a database and does NOT replace
 * the existing Supabase data-access layer — it only feeds the homepage
 * until the ingestion and trending algorithms are wired up.
 *
 * The data shape matches `ArticleWithDetails` from
 * `src/features/news/data-access.ts` so the existing UI components
 * (`NewsFeed`, `BreakingBanner`, `TrendingList`) can render it
 * unchanged.
 */

import type { ArticleWithDetails } from "@/features/news/data-access";

const nowIso = new Date().toISOString();

const unMapStory: ArticleWithDetails = {
  id: "seed-un-world-map-2026",
  slug: "un-world-map-equal-earth-2026",
  title: "",
  summary: null,
  content: null,
  source_id: null,
  country_id: null,
  category_id: "world",
  author_id: null,
  verification_status: "verified",
  importance: "high",
  content_type: "news",
  status: "published",
  original_locale: "en",
  source_url: "https://www.radiofarda.com/a/un-world-map-mercator-equal-earth/33847588.html",
  country: "Global",
  continent: "global",
  entities: ["UN General Assembly", "Equal Earth projection", "Mercator projection"],
  financial_assets: ["global_indexes"],
  hashtags: ["UN", "world-map", "EqualEarth", "Mercator"],
  cover_image_url: null,
  published_at: nowIso,
  created_at: nowIso,
  updated_at: nowIso,
  translation: {
    id: "seed-un-world-map-2026-en",
    post_id: "seed-un-world-map-2026",
    locale: "en",
    title: "UN Backs a New World Map That Shows Africa's True Size",
    summary:
      "The UN General Assembly has approved a resolution encouraging governments and institutions to adopt more accurate world map projections, including Equal Earth. The resolution passed 164-1, with six abstentions, highlighting how the widely used Mercator projection can significantly distort the relative size of continents. The resolution is non-binding and does not ban the Mercator projection, which remains useful for navigation.",
    content: null,
    slug: "un-world-map-equal-earth-2026",
    seo_title: "UN World Map Resolution 2026",
    seo_description: null,
    og_image_url: null,
    translation_status: "published",
    is_original: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  source_name: "Radio Farda",
  source_reliability: 85,
  is_fallback: false,
  resolved_locale: "en",
};

const iranOilStory: ArticleWithDetails = {
  id: "seed-us-iran-oil-tanker-2026",
  slug: "us-iran-oil-tanker-tensions-2026",
  title: "",
  summary: null,
  content: null,
  source_id: null,
  country_id: null,
  category_id: "geopolitics",
  author_id: null,
  verification_status: "verified",
  importance: "breaking",
  content_type: "breaking",
  status: "published",
  original_locale: "en",
  source_url: "https://www.reuters.com/world/middle-east/",
  country: "Iran",
  continent: "middle_east",
  entities: ["Iran", "United States", "Strait of Hormuz", "OPEC"],
  financial_assets: ["oil", "natural_gas", "gold"],
  hashtags: ["Iran", "oil-tanker", "StraitOfHormuz", "energy"],
  cover_image_url: null,
  published_at: nowIso,
  created_at: nowIso,
  updated_at: nowIso,
  translation: {
    id: "seed-us-iran-oil-tanker-2026-en",
    post_id: "seed-us-iran-oil-tanker-2026",
    locale: "en",
    title: "U.S.-Iran Tensions Rise After Attacks on Iranian Oil Tankers",
    summary:
      "Recent attacks on Iranian oil tankers in regional waters have heightened fears of disruption to Gulf shipping and crude exports. Iran has warned of retaliation, while the United States has called for de-escalation and continued naval patrols. Analysts note that any sustained closure of the Strait of Hormuz could affect global crude flows, with potential spillover into freight rates, insurance premiums and energy-intensive commodity markets.",
    content: null,
    slug: "us-iran-oil-tanker-tensions-2026",
    seo_title: "U.S.-Iran Oil Tanker Tensions 2026",
    seo_description: null,
    og_image_url: null,
    translation_status: "published",
    is_original: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  source_name: "Reuters",
  source_reliability: 90,
  is_fallback: false,
  resolved_locale: "en",
};

const russiaUkraineStory: ArticleWithDetails = {
  id: "seed-us-russia-ukraine-talks-2026",
  slug: "us-russia-ukraine-peace-talks-2026",
  title: "",
  summary: null,
  content: null,
  source_id: null,
  country_id: null,
  category_id: "geopolitics",
  author_id: null,
  verification_status: "verified",
  importance: "high",
  content_type: "news",
  status: "published",
  original_locale: "en",
  source_url: "https://www.reuters.com/world/europe/",
  country: "Europe",
  continent: "europe",
  entities: ["Vladimir Putin", "United States", "Ukraine", "Russia"],
  financial_assets: ["natural_gas", "government_bonds", "forex"],
  hashtags: ["Russia", "Ukraine", "Putin", "peace-talks"],
  cover_image_url: null,
  published_at: nowIso,
  created_at: nowIso,
  updated_at: nowIso,
  translation: {
    id: "seed-us-russia-ukraine-talks-2026-en",
    post_id: "seed-us-russia-ukraine-talks-2026",
    locale: "en",
    title: "U.S. Envoys Meet Putin in Renewed Push for Ukraine Peace Talks",
    summary:
      "United States envoys have held a fresh round of talks with Vladimir Putin aimed at reviving negotiations to end the war in Ukraine. The discussions, which took place behind closed doors, covered security guarantees, territorial questions and a potential timeline for a ceasefire. European allies have signalled cautious support while emphasising that any settlement must respect Ukraine's sovereignty and territorial integrity.",
    content: null,
    slug: "us-russia-ukraine-peace-talks-2026",
    seo_title: "U.S. Russia Ukraine Peace Talks 2026",
    seo_description: null,
    og_image_url: null,
    translation_status: "published",
    is_original: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  source_name: "Reuters",
  source_reliability: 90,
  is_fallback: false,
  resolved_locale: "en",
};

export const homepageBreaking: ArticleWithDetails[] = [unMapStory, iranOilStory, russiaUkraineStory];

export const homepageFeed: ArticleWithDetails[] = [unMapStory, iranOilStory, russiaUkraineStory];

export const homepageTrending: ArticleWithDetails[] = [iranOilStory, russiaUkraineStory, unMapStory];
