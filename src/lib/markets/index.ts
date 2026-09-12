/**
 * Market data facade — the ONLY module feature code imports.
 *
 * Routes each symbol to the appropriate provider adapter:
 *   - BTC, ETH → CoinGecko (real-time, no key)
 *   - Gold, Silver, Brent, WTI, EUR/USD, S&P 500, Nasdaq, Dow → Yahoo Finance (delayed, no key)
 *
 * The frontend never talks to providers directly.
 * Provider-specific code is isolated in separate adapter files.
 */

import type { MarketDataProvider } from "./provider";
import type { MarketQuoteResult } from "./types";
import { coingeckoProvider, COINGECKO_SUPPORTED } from "./coingecko";
import { yahooProvider, YAHOO_SUPPORTED } from "./yahoo";

// ── Asset registry ──────────────────────────────────────────────

export interface AssetInfo {
  symbol: string;
  name: string;
  displayName: string;
  assetType: "cryptocurrency" | "commodity" | "forex" | "index";
  currency: string;
  provider: string;
}

/** All supported assets with metadata */
export const SUPPORTED_ASSETS: AssetInfo[] = [
  // Crypto (CoinGecko)
  { symbol: "BTC", name: "Bitcoin", displayName: "BTC", assetType: "cryptocurrency", currency: "USD", provider: "coingecko" },
  { symbol: "ETH", name: "Ethereum", displayName: "ETH", assetType: "cryptocurrency", currency: "USD", provider: "coingecko" },
  // Commodities (Yahoo Finance)
  { symbol: "GOLD", name: "Gold", displayName: "Gold", assetType: "commodity", currency: "USD", provider: "yahoo" },
  { symbol: "SILVER", name: "Silver", displayName: "Silver", assetType: "commodity", currency: "USD", provider: "yahoo" },
  { symbol: "BRENT", name: "Brent Crude Oil", displayName: "Brent", assetType: "commodity", currency: "USD", provider: "yahoo" },
  { symbol: "WTI", name: "WTI Crude Oil", displayName: "WTI", assetType: "commodity", currency: "USD", provider: "yahoo" },
  // Forex (Yahoo Finance)
  { symbol: "EURUSD", name: "EUR/USD", displayName: "EUR/USD", assetType: "forex", currency: "USD", provider: "yahoo" },
  // Indices (Yahoo Finance)
  { symbol: "SPX", name: "S&P 500", displayName: "S&P 500", assetType: "index", currency: "USD", provider: "yahoo" },
  { symbol: "IXIC", name: "Nasdaq Composite", displayName: "Nasdaq", assetType: "index", currency: "USD", provider: "yahoo" },
  { symbol: "DJI", name: "Dow Jones Industrial Average", displayName: "Dow Jones", assetType: "index", currency: "USD", provider: "yahoo" },
];

/** Set of all supported symbol strings */
export const SUPPORTED_SYMBOLS = new Set(SUPPORTED_ASSETS.map((a) => a.symbol));

// ── Provider routing ──────────────────────────────────────────

function getProviderForSymbol(symbol: string): MarketDataProvider | null {
  if (COINGECKO_SUPPORTED.includes(symbol)) return coingeckoProvider;
  if (YAHOO_SUPPORTED.includes(symbol)) return yahooProvider;
  return null;
}

// ── Public API ────────────────────────────────────────────────

/**
 * Validate that a symbol is supported.
 */
export function isValidSymbol(symbol: string): boolean {
  return SUPPORTED_SYMBOLS.has(symbol);
}

/**
 * Get the default list of symbols for the markets dashboard.
 */
export function getDefaultSymbols(): string[] {
  return SUPPORTED_ASSETS.map((a) => a.symbol);
}

/**
 * Get asset metadata for a symbol.
 */
export function getAssetInfo(symbol: string): AssetInfo | undefined {
  return SUPPORTED_ASSETS.find((a) => a.symbol === symbol);
}

/**
 * Fetch a single market quote by symbol.
 * Routes to the appropriate provider based on symbol.
 */
export async function getQuote(symbol: string): Promise<MarketQuoteResult> {
  const provider = getProviderForSymbol(symbol);
  if (!provider) {
    return {
      symbol,
      error: `Symbol ${symbol} is not supported`,
      provider: "none",
      timestamp: new Date().toISOString(),
    };
  }
  return provider.getQuote(symbol);
}

/**
 * Fetch multiple market quotes by symbols.
 * Each symbol is routed to its appropriate provider.
 * Results maintain the same order as the input symbols.
 */
export async function getQuotes(symbols: string[]): Promise<MarketQuoteResult[]> {
  // Group symbols by provider
  const coingeckoSymbols = symbols.filter((s) => COINGECKO_SUPPORTED.includes(s));
  const yahooSymbols = symbols.filter((s) => YAHOO_SUPPORTED.includes(s));

  // Fetch from each provider in parallel
  const [coingeckoResults, yahooResults] = await Promise.all([
    coingeckoSymbols.length > 0 ? coingeckoProvider.getQuotes(coingeckoSymbols) : Promise.resolve([]),
    yahooSymbols.length > 0 ? yahooProvider.getQuotes(yahooSymbols) : Promise.resolve([]),
  ]);

  // Build a map of symbol → result
  const resultMap = new Map<string, MarketQuoteResult>();
  for (const result of coingeckoResults) {
    resultMap.set(result.symbol, result);
  }
  for (const result of yahooResults) {
    resultMap.set(result.symbol, result);
  }

  // Return results in the same order as input
  const results: MarketQuoteResult[] = [];
  for (const symbol of symbols) {
    const result = resultMap.get(symbol);
    if (result) {
      results.push(result);
    } else {
      results.push({
        symbol,
        error: `Symbol ${symbol} is not supported`,
        provider: "none",
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}

/**
 * Fetch all default market quotes (for the dashboard).
 */
export async function getAllQuotes(): Promise<MarketQuoteResult[]> {
  return getQuotes(getDefaultSymbols());
}
