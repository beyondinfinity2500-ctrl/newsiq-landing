/**
 * Editorial submit-for-review API route.
 *
 * The page-level form posts to this endpoint; the endpoint delegates to
 * the Server Action in `src/features/editorial/actions.ts`. We keep this
 * as a thin POST route so the client form can submit without JavaScript
 * (progressive enhancement) and so the redirect happens cleanly.
 */

import { type NextRequest, NextResponse } from "next/server";
import { submitForReviewAction } from "@/features/editorial/actions";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    await submitForReviewAction(formData);
    // submitForReviewAction always redirects on success; if we reach here,
    // something is wrong.
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.statusCode });
    }
    // Next.js redirect() throws a special signal — let it propagate by
    // re-throwing.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    logger.error("api.submit.failed", { reason: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
