/**
 * Normalized market data types.
 *
 * The frontend NEVER depends on provider-specific response formats.
 * All data flows through these normalized types.
 */

export type AssetType = "cryptocurrency" | "commodity" | "forex" | "index";

export type MarketStatus = "open" | "closed" | "pre-market" | "after-hours" | "unknown";

export interface MarketQuote {
  /** Unique identifier (e.g. "bitcoin", "gold", "EURUSD", "^GSPC") */
  symbol: string;
  /** Human-readable name (e.g. "Bitcoin", "Gold", "EUR/USD", "S&P 500") */
  name: string;
  /** Asset classification */
  assetType: AssetType;
  /** Current price in the quote currency */
  price: number;
  /** Absolute price change (typically 24h or since market open) */
  change: number;
  /** Percentage price change */
  changePercent: number;
  /** ISO 4217 currency code for the price */
  currency: string;
  /** ISO 8601 timestamp of when this quote was last updated */
  timestamp: string;
  /** Whether the data is delayed */
  isDelayed: boolean;
  /** Delay in seconds (0 = real-time, 900 = 15 min delayed) */
  delaySeconds: number;
  /** Market status if known */
  marketStatus: MarketStatus;
  /** Provider that supplied this data */
  provider: string;
  /** Attribution text required by the provider's license */
  attribution: string;
  /** URL to the provider's attribution page (if required) */
  attributionUrl?: string;
}

export interface MarketQuoteError {
  symbol: string;
  error: string;
  provider: string;
  timestamp: string;
}

export type MarketQuoteResult = MarketQuote | MarketQuoteError;

export interface MarketDataConfig {
  /** Supported symbols and their metadata */
  assets: MarketAssetConfig[];
}

export interface MarketAssetConfig {
  symbol: string;
  name: string;
  assetType: AssetType;
  currency: string;
  /** Provider-specific symbol mapping */
  providerSymbols: Record<string, string>;
}

export function isMarketQuote(result: MarketQuoteResult): result is MarketQuote {
  return "price" in result && typeof (result as MarketQuote).price === "number";
}
