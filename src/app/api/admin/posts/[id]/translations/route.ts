import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { upsertTranslation } from "@/features/editorial/data-access";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireEditor(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  try {
    const body = await req.json();

    if (!body.locale || !body.title) {
      return NextResponse.json(
        { error: "locale and title are required" },
        { status: 400 },
      );
    }

    const translation = await upsertTranslation(supabase, {
      post_id: postId,
      locale: body.locale,
      title: body.title,
      summary: body.summary ?? null,
      content: body.content ?? null,
      slug: body.slug ?? body.title.toLowerCase().replace(/\s+/g, "-"),
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      translation_status: body.translation_status ?? "draft",
      is_original: body.is_original ?? false,
    });

    return NextResponse.json(translation);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save translation" },
      { status: 500 },
    );
  }
}
