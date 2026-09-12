"use client";

/**
 * MarketsDashboard — Client component that fetches and displays real market data.
 *
 * Fetches from /api/markets (server-side route that proxies provider calls).
 * Handles loading, error, and stale states.
 * Never exposes provider API keys to the browser.
 */

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from "lucide-react";
import type { MarketQuote, MarketQuoteError } from "@/lib/markets/types";
import { isMarketQuote } from "@/lib/markets/types";

interface DashboardQuote extends MarketQuote {
  assetInfo: {
    symbol: string;
    name: string;
    displayName: string;
    assetType: string;
    currency: string;
    provider: string;
  } | null;
}

interface ApiResponse {
  ok: boolean;
  timestamp: string;
  count: number;
  quotes: DashboardQuote[];
  attribution: string;
  error?: string;
}

function formatPrice(price: number, assetType?: string): string {
  if (assetType === "index") {
    return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (assetType === "forex") {
    return price.toFixed(4);
  }
  if (price >= 1000) {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(2);
}

function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}

function getChangeColor(change: number): string {
  if (change > 0) return "text-success";
  if (change < 0) return "text-destructive";
  return "text-muted-foreground";
}

function getChangeIcon(change: number) {
  if (change > 0) return <TrendingUp size={14} className="text-success" aria-hidden="true" />;
  if (change < 0) return <TrendingDown size={14} className="text-destructive" aria-hidden="true" />;
  return <Minus size={14} className="text-muted-foreground" aria-hidden="true" />;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return timestamp;
  }
}

function getAssetTypeLabel(assetType: string): string {
  switch (assetType) {
    case "cryptocurrency": return "Crypto";
    case "commodity": return "Commodity";
    case "forex": return "Forex";
    case "index": return "Index";
    default: return assetType;
  }
}

function getAssetTypeBadgeClass(assetType: string): string {
  switch (assetType) {
    case "cryptocurrency": return "bg-info/10 text-info border-info/20";
    case "commodity": return "bg-warning/10 text-warning border-warning/20";
    case "forex": return "bg-success/10 text-success border-success/20";
    case "index": return "bg-primary/10 text-primary border-primary/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function MarketCard({ quote }: { quote: DashboardQuote }) {
  if (!isMarketQuote(quote)) {
    const errorQuote = quote as MarketQuoteError;
    return (
      <div className="rounded-xl border border-border bg-card p-4 opacity-60">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{errorQuote.symbol}</span>
          <AlertTriangle size={14} className="text-warning" aria-hidden="true" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{errorQuote.error}</p>
      </div>
    );
  }

  const assetType = quote.assetInfo?.assetType ?? "commodity";

  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card/80">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{quote.assetInfo?.displayName ?? quote.symbol}</span>
            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${getAssetTypeBadgeClass(assetType)}`}>
              {getAssetTypeLabel(assetType)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{quote.name}</p>
        </div>
        {getChangeIcon(quote.change)}
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {quote.currency === "USD" ? "$" : ""}{formatPrice(quote.price, assetType)}
        </p>
        <p className={`mt-1 text-xs font-medium ${getChangeColor(quote.change)}`}>
          {formatChange(quote.change, quote.changePercent)}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <Clock size={10} aria-hidden="true" />
        <span>{formatTimestamp(quote.timestamp)}</span>
        {quote.isDelayed && (
          <span className="rounded bg-warning/10 px-1 py-0.5 text-warning">
            {quote.delaySeconds >= 60 ? `${Math.floor(quote.delaySeconds / 60)}m delayed` : "Delayed"}
          </span>
        )}
      </div>
    </div>
  );
}

export function MarketsDashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/markets", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      if (!result.ok) {
        throw new Error(result.error || "Failed to fetch market data");
      }
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Live Market Data</h2>
          {lastFetch && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastFetch.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Refresh market data"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-destructive">Failed to load market data</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-xs font-medium text-destructive underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-3 h-8 w-24 rounded bg-muted" />
              <div className="mt-2 h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {data.quotes.map((quote) => (
              <MarketCard key={quote.symbol} quote={quote} />
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card/50 p-4">
            <p className="text-[10px] leading-5 text-muted-foreground">
              {data.attribution}
            </p>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              Market data is provided for informational purposes only and does not constitute financial advice.
              Prices may be delayed. Refresh for latest data.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
