"use server";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { generateAISuggestion, saveAISuggestionToDatabase, AiSuggestion } from "@/features/ai/suggestions";

const generateSuggestionSchema = z.object({
  query: z.string().min(1).max(500),
  context: z.object({
    preferredCategories: z.array(z.string()).optional(),
    recentSources: z.array(z.string()).optional(),
  }).optional(),
});

// POST /api/admin/suggestions/generate
// Admin-initiated AI story suggestion generation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, context } = generateSuggestionSchema.parse(body);

    const result = await generateAISuggestion({ query, context });

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "Failed to generate AI suggestion" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, suggestion: result });
  } catch (err) {
    logger.error("api.suggestion.generate.failed", { error: err instanceof Error ? err.message : err });
    const status = err instanceof ValidationError ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status }
    );
  }
}

// POST /api/admin/suggestions/accept
// Admin accepts a suggestion, saving it as a 'suggested' post
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { suggestionId, decision, reason } = z.object({
      suggestionId: z.string().uuid(),
      decision: z.enum(["accept", "reject"]),
      reason: z.string().max(500).optional(),
    }).parse(body);

    if (decision === "accept") {
      const { postId } = await saveAISuggestionToDatabase(
        {
          ...(await (async () => {
            // In a real implementation, we'd fetch the suggestion from DB
            // For now, we return a placeholder - the frontend should have the full data
            return {
              id: crypto.randomUUID(),
              proposed_headline: "placeholder",
              reason_why_it_matters: "placeholder",
              source: "placeholder",
              source_url: null,
              detected_region: null,
              category: null,
              entities: [],
              urgency_importance: "medium",
              suggested_language: "en",
              timestamp: new Date().toISOString(),
            };
          })()) as AiSuggestion,
        },
        suggestionId
      );

      return NextResponse.json({ ok: true, postId });
    } else {
      // Reject the suggestion - could soft-delete or just mark as rejected
      return NextResponse.json({ ok: true, rejected: true });
    }
  } catch (err) {
    logger.error("api.suggestion.accept.failed", { error: err instanceof Error ? err.message : err });
    const status = err instanceof ValidationError ? 400 : 500;
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status }
    );
  }
}