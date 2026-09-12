/**
 * Yahoo Finance market data provider adapter.
 *
 * Covers: Gold, Silver, Brent Oil, WTI Oil, EUR/USD, S&P 500, Nasdaq, Dow Jones
 * Free tier: No API key required
 * Delayed data: 15-20 minutes for most assets
 *
 * Uses the unofficial Yahoo Finance v8 chart API.
 * Note: This is an unofficial API that may break if Yahoo changes their endpoints.
 * For production, consider a paid provider for guaranteed uptime.
 */

import type { MarketDataProvider } from "./provider";
import type { MarketQuote, MarketQuoteResult } from "./types";
import { cacheGet, cacheSet, YAHOO_CACHE_TTL } from "./cache";

const BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

/** Yahoo Finance symbol → normalized symbol mapping */
const SYMBOL_MAP: Record<string, { yahooSymbol: string; name: string; displayName: string; assetType: "commodity" | "forex" | "index" }> = {
  GOLD: { yahooSymbol: "GC=F", name: "Gold", displayName: "Gold", assetType: "commodity" },
  SILVER: { yahooSymbol: "SI=F", name: "Silver", displayName: "Silver", assetType: "commodity" },
  BRENT: { yahooSymbol: "BZ=F", name: "Brent Crude Oil", displayName: "Brent", assetType: "commodity" },
  WTI: { yahooSymbol: "CL=F", name: "WTI Crude Oil", displayName: "WTI", assetType: "commodity" },
  EURUSD: { yahooSymbol: "EURUSD=X", name: "EUR/USD", displayName: "EUR/USD", assetType: "forex" },
  SPX: { yahooSymbol: "^GSPC", name: "S&P 500", displayName: "S&P 500", assetType: "index" },
  IXIC: { yahooSymbol: "^IXIC", name: "Nasdaq Composite", displayName: "Nasdaq", assetType: "index" },
  DJI: { yahooSymbol: "^DJI", name: "Dow Jones Industrial Average", displayName: "Dow Jones", assetType: "index" },
};

const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_MAP);

function getCacheKey(symbol: string): string {
  return `yahoo:${symbol}`;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose?: number;
        regularMarketTime: number;
        exchangeTimezoneName?: string;
        regularMarketState?: string;
        currency?: string;
      };
      indicators: {
        quote: Array<{
          close: Array<number | null>;
        }>;
      };
    }>;
    error: string | null;
  };
}

function determineMarketStatus(state?: string): MarketQuote["marketStatus"] {
  switch (state?.toLowerCase()) {
    case "regular":
      return "open";
    case "pre":
      return "pre-market";
    case "post":
      return "after-hours";
    case "closed":
      return "closed";
    default:
      return "unknown";
  }
}

function parseYahooQuote(symbol: string, data: YahooChartResponse["chart"]["result"][0]): MarketQuote {
  const meta = SYMBOL_MAP[symbol];
  const price = meta ? data.meta.regularMarketPrice : 0;
  const previousClose = data.meta.previousClose ?? 0;
  const change = previousClose > 0 ? price - previousClose : 0;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
  const timestamp = data.meta.regularMarketTime
    ? new Date(data.meta.regularMarketTime * 1000).toISOString()
    : new Date().toISOString();

  return {
    symbol,
    name: meta?.name ?? symbol,
    assetType: meta?.assetType ?? "commodity",
    price,
    change,
    changePercent,
    currency: data.meta.currency ?? "USD",
    timestamp,
    isDelayed: true,
    delaySeconds: 900, // 15 minutes
    marketStatus: determineMarketStatus(data.meta.regularMarketState),
    provider: "yahoo",
    attribution: "Market data provided by Yahoo Finance",
    attributionUrl: "https://finance.yahoo.com/",
  };
}

async function fetchYahooQuote(yahooSymbol: string): Promise<YahooChartResponse> {
  const url = `${BASE_URL}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "NewsIQ/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const yahooProvider: MarketDataProvider = {
  name: "yahoo",
  attribution: "Market data provided by Yahoo Finance",
  attributionUrl: "https://finance.yahoo.com/",

  isConfigured(): boolean {
    // Yahoo Finance free tier requires no API key
    return true;
  },

  async getQuote(symbol: string): Promise<MarketQuoteResult> {
    const meta = SYMBOL_MAP[symbol];
    if (!meta) {
      return {
        symbol,
        error: `Symbol ${symbol} is not supported by Yahoo Finance adapter`,
        provider: "yahoo",
        timestamp: new Date().toISOString(),
      };
    }

    const cacheKey = getCacheKey(symbol);
    const cached = cacheGet<MarketQuote>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchYahooQuote(meta.yahooSymbol);
      if (data.chart.error) {
        return {
          symbol,
          error: `Yahoo Finance error: ${data.chart.error}`,
          provider: "yahoo",
          timestamp: new Date().toISOString(),
        };
      }
      const result = data.chart.result[0];
      if (!result) {
        return {
          symbol,
          error: `No data returned for ${symbol}`,
          provider: "yahoo",
          timestamp: new Date().toISOString(),
        };
      }
      const quote = parseYahooQuote(symbol, result);
      cacheSet(cacheKey, quote, YAHOO_CACHE_TTL);
      return quote;
    } catch (err) {
      return {
        symbol,
        error: err instanceof Error ? err.message : "Yahoo Finance fetch failed",
        provider: "yahoo",
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getQuotes(symbols: string[]): Promise<MarketQuoteResult[]> {
    const results: MarketQuoteResult[] = [];

    // Yahoo Finance doesn't support batch quotes in the free tier,
    // so we fetch each symbol individually (with caching)
    for (const symbol of symbols) {
      const result = await yahooProvider.getQuote(symbol);
      results.push(result);
    }

    return results;
  },
};

/** Expose supported symbols for allowlisting */
export const YAHOO_SUPPORTED = SUPPORTED_SYMBOLS;
