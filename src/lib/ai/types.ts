/**
 * AI provider abstraction types.
 * These interfaces define the contracts that any AI provider must implement.
 * The application never talks to OpenAI/Anthropic/Google directly — it talks
 * to these interfaces, and a concrete provider adapter fulfills them.
 */

import type { ImportanceLevel, MarketAsset, ContinentType } from "@/lib/supabase/types";

// ── News Analyzer ───────────────────────────────────────────

export interface NewsAnalysisResult {
  summary: string;
  category: string;
  entities: string[];
  countries: string[];
  continent: ContinentType | null;
  companies: string[];
  financialAssets: MarketAsset[];
  importance: ImportanceLevel;
  confidence: number;
}

export interface NewsAnalyzer {
  readonly providerName: string;
  analyze(content: string, locale: string): Promise<NewsAnalysisResult>;
}

// ── Translation Agent ───────────────────────────────────────

export interface TranslationResult {
  title: string;
  summary: string;
  content: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  isOriginal: false;
}

export interface TranslationAgent {
  readonly providerName: string;
  translate(
    content: string,
    title: string,
    summary: string,
    fromLocale: string,
    toLocale: string,
  context?: TranslationContext,
  ): Promise<TranslationResult>;
}

export interface TranslationContext {
  category?: string;
  financialTerms?: string[];
  tone?: "neutral" | "formal" | "breaking";
}

// ── Market Impact Analyst ──────────────────────────────────

export interface MarketImpactResult {
  affectedAssets: MarketImpactAsset[];
  overallSentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  analysis: string;
}

export interface MarketImpactAsset {
  asset: MarketAsset;
  direction: "positive" | "negative" | "neutral";
  impactLevel: "low" | "medium" | "high";
  reasoning: string;
}

export interface MarketImpactAnalyst {
  readonly providerName: string;
  analyze(content: string, entities: string[], financialAssets: MarketAsset[]): Promise<MarketImpactResult>;
}

// ── Provider Registry ────────────────────────────────────────

export type AiCapability = "news_analyzer" | "translation" | "market_impact";

export interface AiProvider {
  readonly name: string;
  readonly capabilities: AiCapability[];
}
