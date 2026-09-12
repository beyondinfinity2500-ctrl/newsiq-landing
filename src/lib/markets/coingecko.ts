/**
 * CoinGecko market data provider adapter.
 *
 * Covers: Bitcoin (BTC), Ethereum (ETH)
 * Free tier: No API key required, 10-30 calls/minute
 * Real-time prices for top cryptocurrencies
 *
 * API: https://api.coingecko.com/api/v3/simple/price
 * Docs: https://docs.coingecko.com/reference/simple-price
 */

import type { MarketDataProvider } from "./provider";
import type { MarketQuote, MarketQuoteResult } from "./types";
import { cacheGet, cacheSet, CRYPTO_CACHE_TTL } from "./cache";

const BASE_URL = "https://api.coingecko.com/api/v3";

/** CoinGecko ID → normalized symbol mapping */
const SYMBOL_MAP: Record<string, { coingeckoId: string; name: string; displayName: string }> = {
  BTC: { coingeckoId: "bitcoin", name: "Bitcoin", displayName: "BTC" },
  ETH: { coingeckoId: "ethereum", name: "Ethereum", displayName: "ETH" },
};

const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_MAP);

function getCacheKey(symbol: string): string {
  return `coingecko:${symbol}`;
}

interface CoinGeckoPriceResponse {
  [coingeckoId: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
}

async function fetchPrices(
  coingeckoIds: string[],
): Promise<CoinGeckoPriceResponse> {
  const ids = coingeckoIds.join(",");
  const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function parseCoinGeckoQuote(
  symbol: string,
  data: CoinGeckoPriceResponse[string] | undefined,
): MarketQuote {
  const meta = SYMBOL_MAP[symbol];
  if (!meta) {
    return {
      symbol,
      name: symbol,
      assetType: "cryptocurrency",
      price: 0,
      change: 0,
      changePercent: 0,
      currency: "USD",
      timestamp: new Date().toISOString(),
      isDelayed: false,
      delaySeconds: 0,
      marketStatus: "open",
      provider: "coingecko",
      attribution: "Market data provided by CoinGecko",
      attributionUrl: "https://www.coingecko.com/",
    };
  }

  const price = data?.usd ?? 0;
  const change24hPercent = data?.usd_24h_change ?? 0;
  // CoinGecko gives percentage change, we need to calculate absolute change
  const previousPrice = price / (1 + change24hPercent / 100);
  const change = price - previousPrice;

  return {
    symbol,
    name: meta.name,
    assetType: "cryptocurrency",
    price,
    change,
    changePercent: change24hPercent,
    currency: "USD",
    timestamp: new Date().toISOString(),
    isDelayed: false,
    delaySeconds: 0,
    marketStatus: "open",
    provider: "coingecko",
    attribution: "Market data provided by CoinGecko",
    attributionUrl: "https://www.coingecko.com/",
  };
}

export const coingeckoProvider: MarketDataProvider = {
  name: "coingecko",
  attribution: "Market data provided by CoinGecko",
  attributionUrl: "https://www.coingecko.com/",

  isConfigured(): boolean {
    // CoinGecko free tier requires no API key
    return true;
  },

  async getQuote(symbol: string): Promise<MarketQuoteResult> {
    const meta = SYMBOL_MAP[symbol];
    if (!meta) {
      return {
        symbol,
        error: `Symbol ${symbol} is not supported by CoinGecko`,
        provider: "coingecko",
        timestamp: new Date().toISOString(),
      };
    }

    const cacheKey = getCacheKey(symbol);
    const cached = cacheGet<MarketQuote>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchPrices([meta.coingeckoId]);
      const quote = parseCoinGeckoQuote(symbol, data[meta.coingeckoId]);
      cacheSet(cacheKey, quote, CRYPTO_CACHE_TTL);
      return quote;
    } catch (err) {
      return {
        symbol,
        error: err instanceof Error ? err.message : "CoinGecko fetch failed",
        provider: "coingecko",
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getQuotes(symbols: string[]): Promise<MarketQuoteResult[]> {
    const supported = symbols.filter((s) => SYMBOL_MAP[s]);
    const unsupported = symbols.filter((s) => !SYMBOL_MAP[s]);

    if (supported.length === 0) {
      return unsupported.map((s) => ({
        symbol: s,
        error: `Symbol ${s} is not supported by CoinGecko`,
        provider: "coingecko",
        timestamp: new Date().toISOString(),
      }));
    }

    // Check cache for each symbol, collect uncached ones
    const results: MarketQuoteResult[] = [];
    const uncachedSymbols: string[] = [];

    for (const symbol of supported) {
      const cacheKey = getCacheKey(symbol);
      const cached = cacheGet<MarketQuote>(cacheKey);
      if (cached) {
        results.push(cached);
      } else {
        uncachedSymbols.push(symbol);
      }
    }

    // Fetch uncached symbols in a single API call
    if (uncachedSymbols.length > 0) {
      const coingeckoIds = uncachedSymbols.map((s) => SYMBOL_MAP[s].coingeckoId);
      try {
        const data = await fetchPrices(coingeckoIds);
        for (const symbol of uncachedSymbols) {
          const quote = parseCoinGeckoQuote(symbol, data[SYMBOL_MAP[symbol].coingeckoId]);
          cacheSet(getCacheKey(symbol), quote, CRYPTO_CACHE_TTL);
          results.push(quote);
        }
      } catch (err) {
        for (const symbol of uncachedSymbols) {
          results.push({
            symbol,
            error: err instanceof Error ? err.message : "CoinGecko fetch failed",
            provider: "coingecko",
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // Add unsupported symbols
    for (const symbol of unsupported) {
      results.push({
        symbol,
        error: `Symbol ${symbol} is not supported by CoinGecko`,
        provider: "coingecko",
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  },
};

/** Expose supported symbols for allowlisting */
export const COINGECKO_SUPPORTED = SUPPORTED_SYMBOLS;
