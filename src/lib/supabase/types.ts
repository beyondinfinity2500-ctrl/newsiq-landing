/**
 * Database type definitions for NewsIQ.
 * These types mirror the PostgreSQL schema created by migrations 0001–0004.
 * They are used by the Supabase typed client for type-safe queries.
 */

// ── Enums ──────────────────────────────────────────────────────

export type UserRole = "visitor" | "user" | "pro" | "editor" | "admin" | "super_admin";

export type PostStatus = "suggested" | "draft" | "pending_review" | "approved" | "published" | "rejected" | "archived";

export type VerificationStatus = "unverified" | "verified" | "disputed" | "developing" | "likely";

export type ImportanceLevel = "low" | "medium" | "high" | "breaking";

export type ContentType = "news" | "breaking" | "developing" | "eyewitness" | "analysis";

export type SourceType = "agency" | "media" | "social" | "official" | "community" | "other";

export type SourceVerificationStatus = "unverified" | "under_review" | "verified" | "rejected";

export type TranslationStatus = "draft" | "reviewed" | "published";

export type MediaType = "image" | "video" | "audio" | "document" | "other";

export type ContinentType =
  | "africa" | "asia" | "europe" | "north_america"
  | "south_america" | "oceania" | "middle_east" | "global";

export type EntityType = "person" | "company" | "organization" | "country" | "location" | "financial_asset" | "other";

export type AssetType = "stock" | "index" | "cryptocurrency" | "commodity" | "currency" | "bond" | "etf" | "other";

export type MarketDirection = "positive" | "negative" | "neutral";

export type ImpactStrength = "low" | "medium" | "high";

export type TimeHorizon = "short" | "medium" | "long";

export type AnalysisType = "news_analyzer" | "market_impact" | "translation";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type ReportReason = "spam" | "harassment" | "misinformation" | "violence" | "other";

export type ReportModerationStatus = "pending" | "reviewed" | "dismissed";

export type EyewitnessVerificationStatus = "unverified" | "under_review" | "verified" | "rejected";

export type SubscriptionTier = "free" | "pro";

export type SubscriptionCycle = "monthly" | "annual";

export type SubscriptionStatus = "active" | "canceled" | "expired";

// Legacy compatibility alias used by UI components
export type MarketAsset =
  | "gold" | "oil" | "silver" | "natural_gas" | "copper" | "agricultural"
  | "bitcoin" | "ethereum" | "defi" | "forex" | "government_bonds"
  | "us_treasury" | "real_estate" | "global_indexes";

// ── Row Types ──────────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_locale: string;
  timezone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  domain: string | null;
  url: string | null;
  country: string | null;
  language: string;
  source_type: SourceType;
  credibility_score: number;
  verification_status: SourceVerificationStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  iso2: string;
  iso3: string;
  name: string;
  native_name: string | null;
  region: string | null;
  continent: ContinentType | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  source_id: string | null;
  country_id: string | null;
  category_id: string | null;
  author_id: string | null;
  verification_status: VerificationStatus;
  importance: ImportanceLevel;
  content_type: ContentType;
  status: PostStatus;
  original_locale: string;
  source_url: string | null;
  country: string | null;
  continent: ContinentType | null;
  entities: string[];
  financial_assets: string[];
  hashtags: string[];
  cover_image_url: string | null;
  image_status?: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostTranslation {
  id: string;
  post_id: string;
  locale: string;
  title: string;
  summary: string | null;
  content: string | null;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  translation_status: TranslationStatus;
  is_original: boolean;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  post_id: string | null;
  storage_path: string;
  public_url: string | null;
  media_type: MediaType;
  alt_text: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Entity {
  id: string;
  entity_type: EntityType;
  name: string;
  slug: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FinancialAsset {
  id: string;
  symbol: string;
  name: string;
  asset_type: AssetType;
  exchange: string | null;
  currency: string;
  country: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PostEntity {
  id: string;
  post_id: string;
  entity_id: string;
  created_at: string;
}

export interface MarketAnalysis {
  id: string;
  post_id: string;
  asset_id: string | null;
  direction: MarketDirection;
  impact_strength: ImpactStrength;
  confidence_score: number;
  time_horizon: TimeHorizon;
  summary: string | null;
  risks: string[];
  opportunities: string[];
  model_name: string | null;
  model_version: string | null;
  generated_at: string;
  updated_at: string;
}

export interface AiAnalysis {
  id: string;
  post_id: string;
  analysis_type: AnalysisType;
  provider: string;
  result: Record<string, unknown>;
  created_at: string;
}

export interface SavedPost {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  post_id: string | null;
  report_reason: ReportReason;
  description: string | null;
  moderation_status: ReportModerationStatus;
  created_at: string;
  updated_at: string;
}

export interface EyewitnessReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string | null;
  occurred_at: string | null;
  submitted_at: string;
  verification_status: EyewitnessVerificationStatus;
  moderation_status: ModerationStatus;
  related_post_id: string | null;
  media_metadata: unknown[];
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  billing_cycle: SubscriptionCycle | null;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Database Schema ───────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      sources: { Row: Source; Insert: Partial<Source>; Update: Partial<Source> };
      countries: { Row: Country; Insert: Partial<Country>; Update: Partial<Country> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> };
      post_translations: { Row: PostTranslation; Insert: Partial<PostTranslation>; Update: Partial<PostTranslation> };
      media: { Row: Media; Insert: Partial<Media>; Update: Partial<Media> };
      entities: { Row: Entity; Insert: Partial<Entity>; Update: Partial<Entity> };
      financial_assets: { Row: FinancialAsset; Insert: Partial<FinancialAsset>; Update: Partial<FinancialAsset> };
      post_entities: { Row: PostEntity; Insert: Partial<PostEntity>; Update: Partial<PostEntity> };
      market_analyses: { Row: MarketAnalysis; Insert: Partial<MarketAnalysis>; Update: Partial<MarketAnalysis> };
      ai_analyses: { Row: AiAnalysis; Insert: Partial<AiAnalysis>; Update: Partial<AiAnalysis> };
      saved_posts: { Row: SavedPost; Insert: Partial<SavedPost>; Update: Partial<SavedPost> };
      likes: { Row: Like; Insert: Partial<Like>; Update: Partial<Like> };
      comments: { Row: Comment; Insert: Partial<Comment>; Update: Partial<Comment> };
      content_reports: { Row: ContentReport; Insert: Partial<ContentReport>; Update: Partial<ContentReport> };
      eyewitness_reports: { Row: EyewitnessReport; Insert: Partial<EyewitnessReport>; Update: Partial<EyewitnessReport> };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> };
    };
  };
}
