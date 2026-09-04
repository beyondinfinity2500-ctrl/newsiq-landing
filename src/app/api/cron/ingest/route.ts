/**
 * Scheduled ingestion endpoint.
 *
 * Trigger this with Vercel Cron or any external scheduler. Authorization is
 * two-layered:
 *
 *   1. Header check: `x-cron-secret` must equal `CRON_SECRET`. Vercel Cron
 *      sets this automatically when you wire up a cron job in `vercel.json`.
 *   2. Database: the request uses the service-role client which bypasses RLS
 *      by design — never expose this route without the secret.
 *
 * Browser clients cannot call this route effectively: they would need the
 * service-role key (which is never shipped to the client) AND the cron
 * secret. Both are server-only.
 *
 * Usage from a server-side caller:
 *
 *   POST /api/cron/ingest
 *   Headers: { "x-cron-secret": <CRON_SECRET> }
 *   Body:    { "sourceId": "<optional-uuid>" }   // omit to ingest all sources
 *
 * The route is intentionally POST so a HEAD request doesn't trigger an
 * ingestion run.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { ingestSource, ingestAllActiveSources, assertServerEnvironment } from "@/features/ingestion/pipeline";
import { UnauthorizedError, ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: NextRequest): void {
  const provided = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    // Fail closed: if no secret is configured, do not let the route run.
    throw new UnauthorizedError("CRON_SECRET is not configured on the server.");
  }
  if (provided !== expected) {
    throw new UnauthorizedError("Invalid cron secret.");
  }
}

export async function POST(request: NextRequest) {
  const startedAt = new Date().toISOString();
  try {
    authorize(request);
    assertServerEnvironment();
  } catch (err) {
    const status = err instanceof UnauthorizedError ? 401 : 500;
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Authorization failed" },
      { status },
    );
  }

  const admin = createSupabaseAdminClient();

  let sourceId: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { sourceId?: unknown };
    if (typeof body.sourceId === "string" && body.sourceId.length > 0) {
      sourceId = body.sourceId;
    }
  } catch {
    // No body or unreadable body — treat as "ingest all".
  }

  try {
    if (sourceId) {
      const { data, error } = await admin
        .from("sources")
        .select("id, name, feed_url, default_language, country_code")
        .eq("id", sourceId)
        .maybeSingle();
      if (error || !data) {
        throw new ValidationError(`Source ${sourceId} not found.`);
      }
      const report = await ingestSource(admin, data as never);
      return NextResponse.json({ ok: true, startedAt, reports: [report] });
    }
    const reports = await ingestAllActiveSources(admin);
    return NextResponse.json({ ok: true, startedAt, reports });
  } catch (err) {
    logger.error("cron.ingest.failed", {
      reason: err instanceof Error ? err.message : "Unknown error",
      sourceId,
    });
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}

/** Reject other methods explicitly so a misconfigured scheduler does not silently succeed. */
export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST with the x-cron-secret header." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

// Reference env so dead-code-elimination does not drop the import.
void env;
