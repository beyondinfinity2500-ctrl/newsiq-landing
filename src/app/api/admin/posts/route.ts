import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { createPost } from "@/features/editorial/data-access";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireEditor(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.slug || typeof body.slug !== "string") {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const post = await createPost(supabase, {
      slug: body.slug,
      title: body.title ?? body.slug,
      summary: body.summary ?? null,
      content: body.content ?? null,
      source_id: body.source_id ?? null,
      category_id: body.category_id ?? null,
      country: body.country ?? null,
      status: body.status ?? "draft",
      verification_status: body.verification_status ?? "unverified",
      importance: body.importance ?? "medium",
      content_type: body.content_type ?? "news",
      original_locale: body.original_locale ?? "en",
      source_url: body.source_url ?? null,
      cover_image_url: body.cover_image_url ?? null,
      hashtags: body.hashtags ?? [],
      financial_assets: body.financial_assets ?? [],
      entities: body.entities ?? [],
      published_at: body.published_at ?? null,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create post" },
      { status: 500 },
    );
  }
}
