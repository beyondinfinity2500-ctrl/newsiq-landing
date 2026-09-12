/**
 * /api/markets — Server-side market data API.
 *
 * Returns normalized quotes for requested symbols or all default symbols.
 * Provider API keys never reach the browser.
 *
 * GET /api/markets                    → all default quotes
 * GET /api/markets?symbols=BTC,GOLD   → specific symbols
 * GET /api/markets?symbols=BTC        → single symbol
 */

import { NextRequest, NextResponse } from "next/server";
import { getQuotes, getDefaultSymbols, isValidSymbol, getAssetInfo } from "@/lib/markets";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbolsParam = searchParams.get("symbols");

  let symbols: string[];

  if (symbolsParam) {
    // Parse comma-separated symbols
    symbols = symbolsParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    // Validate all symbols
    const invalid = symbols.filter((s) => !isValidSymbol(s));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid symbols: ${invalid.join(", ")}. Valid symbols: ${Array.from(new Set(getDefaultSymbols())).join(", ")}`,
        },
        { status: 400 },
      );
    }
  } else {
    symbols = getDefaultSymbols();
  }

  try {
    const results = await getQuotes(symbols);

    // Enrich results with asset metadata
    const enriched = results.map((result) => {
      const asset = getAssetInfo(result.symbol);
      return {
        ...result,
        assetInfo: asset ?? null,
      };
    });

    const now = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      timestamp: now,
      count: enriched.length,
      quotes: enriched,
      attribution: "Market data from CoinGecko and Yahoo Finance. Not financial advice.",
    });
  } catch (err) {
    logger.error("api.markets.failed", {
      reason: err instanceof Error ? err.message : "Unknown error",
      symbols,
    });
    return NextResponse.json(
      { ok: false, error: "Failed to fetch market data" },
      { status: 500 },
    );
  }
}
