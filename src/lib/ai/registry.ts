/**
 * AI provider registry.
 *
 * This is the integration boundary between the application and AI services.
 * Features request an analyzer/translator/analyst by capability, not by provider name.
 * Swapping or adding providers does not require changes in feature code.
 *
 * Concrete provider adapters (e.g. OpenAI, Anthropic) will be implemented in Phase 2.
 * They register themselves here at startup.
 */

import type {
  NewsAnalyzer,
  TranslationAgent,
  MarketImpactAnalyst,
} from "./types";

interface ProviderBindings {
  newsAnalyzer?: NewsAnalyzer;
  translationAgent?: TranslationAgent;
  marketImpactAnalyst?: MarketImpactAnalyst;
}

const registry: Record<string, ProviderBindings> = {};

export function registerAiProvider(name: string, bindings: ProviderBindings): void {
  registry[name] = bindings;
}

export function getNewsAnalyzer(): NewsAnalyzer {
  for (const provider of Object.values(registry)) {
    if (provider.newsAnalyzer) return provider.newsAnalyzer;
  }
  throw new Error("No AI provider registered for news analysis");
}

export function getTranslationAgent(): TranslationAgent {
  for (const provider of Object.values(registry)) {
    if (provider.translationAgent) return provider.translationAgent;
  }
  throw new Error("No AI provider registered for translation");
}

export function getMarketImpactAnalyst(): MarketImpactAnalyst {
  for (const provider of Object.values(registry)) {
    if (provider.marketImpactAnalyst) return provider.marketImpactAnalyst;
  }
  throw new Error("No AI provider registered for market impact analysis");
}

export function listRegisteredProviders(): string[] {
  return Object.keys(registry);
}
