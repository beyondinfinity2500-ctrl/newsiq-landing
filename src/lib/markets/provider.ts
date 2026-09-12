/**
 * Market data provider interface.
 *
 * This is the abstraction boundary between the application and market data
 * services. The frontend never talks to providers directly — it talks to
 * these interfaces, and a concrete adapter fulfills them.
 *
 * Swapping or adding providers does not require changes in feature code.
 */

import type { MarketQuoteResult } from "./types";

export interface MarketDataProvider {
  /** Unique provider identifier (e.g. "coingecko", "yahoo") */
  readonly name: string;
  /** Human-readable attribution text */
  readonly attribution: string;
  /** Attribution URL if required by the license */
  readonly attributionUrl?: string;
  /** Whether the provider is configured and ready */
  isConfigured(): boolean;
  /** Fetch a single quote by symbol */
  getQuote(symbol: string): Promise<MarketQuoteResult>;
  /** Fetch multiple quotes by symbols */
  getQuotes(symbols: string[]): Promise<MarketQuoteResult[]>;
}
