"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { ValidationError, ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const suggestionDecisionSchema = z.object({
  suggestionId: z.string().uuid("Invalid suggestion id"),
  decision: z.enum(["accept", "reject"]),
  reason: z.string().max(500).optional(),
});

// Schema for an AI story suggestion
const AiSuggestionSchema = z.object({
  id: z.string().uuid(),
  proposed_headline: z.string().min(1).max(300),
  reason_why_it_matters: z.string().max(2000),
  source: z.string().min(1).max(200),
  source_url: z.string().url().optional().nullable(),
  detected_region: z.string().length(2).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  entities: z.array(z.string()).max(50).optional(),
  urgency_importance: z.enum(["low", "medium", "high", "breaking"]),
  suggested_language: z.string().min(2).max(8).default("en"),
  timestamp: z.string().datetime(),
  _postId: z.string().uuid().optional(),
});

export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

// ---------------------------------------------------------------------------
// AI Story Suggestion — admin-initiated
// ---------------------------------------------------------------------------

/**
 * Generate an AI story suggestion.
 * The admin triggers this explicitly (e.g. from the admin posts page).
 * Returns a structured suggestion that the admin can review, accept, or reject.
 *
 * This does NOT create a post in the database. It only returns the AI-generated
 * suggestion for the admin to review.
 */
export async function generateAISuggestion(
  prompt: {
    query: string; // The user's request/topic for the AI to suggest a story about
    context?: {
      recentSources?: string[];
      preferredCategories?: string[];
    };
  }
): Promise<AiSuggestion | null> {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const { user, role } = await requireEditor(supabase);

  if (role !== "editor" && role !== "admin" && role !== "super_admin") {
    throw new ForbiddenError("Only editors and admins can generate AI suggestions.");
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    logger.warn("ai.suggestion.no_key");
    return null;
  }

  // Call OpenAI to generate a story suggestion
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an editorial assistant for NewsIQ. Generate ONE important/trending news story suggestion that would be suitable for the NewsIQ platform.

Return a JSON object with these exact fields:
- proposed_headline: string (catchy, news-style headline)
- reason_why_it_matters: string (2-3 sentences why this story is important/trending)
- source: string (the likely source or outlet)
- source_url: string | null (URL if known, otherwise null)
- detected_region: string | null (2-letter country code if relevant, otherwise null)
- category: string | null (news category like "politics", "tech", "economy", etc., or null)
- entities: string[] (max 5 key entities/persons/organizations mentioned)
- urgency_importance: "low" | "medium" | "high" | "breaking"
- suggested_language: string (2-letter language code, default "en")
- timestamp: ISO datetime string (now)

Keep it concise and news-worthy. This is for an editorial review workflow - the admin must explicitly accept it.`,
        },
        {
          role: "user",
          content: `Generate a news story suggestion about: "${prompt.query}". ${prompt.context && prompt.context.preferredCategories ? "Preferred categories: " + prompt.context.preferredCategories.join(", ") + ". " : ""}Keep it to one suggestion only.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    logger.error("ai.suggestion.failed", {
      status: response.status,
      body: errBody.slice(0, 200),
    });
    throw new ValidationError(`AI suggestion generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  const suggestion = AiSuggestionSchema.safeParse(data.choices[0]?.message?.content);

  if (!suggestion.success) {
    logger.error("ai.suggestion.invalid_response", {
      parsed: data.choices[0]?.message?.content?.slice(0, 200),
    });
    return null;
  }

  logger.info("ai.suggestion.created", {
    actorId: user.id,
    actorRole: role,
    headline: suggestion.data.proposed_headline,
  });

  return suggestion.data;
}

/**
 * Save an AI suggestion to the database as a 'suggested' post.
 * The admin must then review it and explicitly accept it to proceed.
 */
export async function saveAISuggestionToDatabase(
  suggestion: AiSuggestion,
  adminId: string
): Promise<{ postId: string; status: "suggested" }> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      status: "suggested",
      title: suggestion.proposed_headline,
      summary: suggestion.reason_why_it_matters,
      source_url: suggestion.source_url,
      source_id: null, // Will be set if a matching source is found
      original_locale: suggestion.suggested_language,
      importance: suggestion.urgency_importance,
      verification_status: "unverified",
      content_type: "news",
      country: null,
      continent: null,
      entities: suggestion.entities ?? [],
      financial_assets: [],
      hashtags: [],
      cover_image_url: null,
      published_at: null,
    } as never)
    .select("id")
    .single();

  if (error) {
    logger.error("ai.suggestion.db.save_failed", { error: error.message });
    throw new ValidationError(`Failed to save suggestion to database: ${error.message}`);
  }

  logger.warn("ai.suggestion.saved", {
    postId: data.id,
    suggestedHeadline: suggestion.proposed_headline,
    adminId,
  });

  return { postId: data.id, status: "suggested" };
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function getLocale(): Promise<string> {
  const h = await headers();
  return h.get("x-next-intl-locale") ?? "en";
}