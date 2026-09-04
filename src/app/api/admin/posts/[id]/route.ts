import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { updatePost, deletePost } from "@/features/editorial/data-access";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireEditor(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const update: Record<string, unknown> = {};
    const fields = [
      "slug", "title", "summary", "content", "source_id", "category_id",
      "country", "status", "verification_status", "importance", "content_type",
      "original_locale", "source_url", "cover_image_url", "hashtags",
      "financial_assets", "entities", "published_at",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) update[f] = body[f];
    }

    const post = await updatePost(supabase, id, update as never);
    return NextResponse.json(post);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireEditor(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deletePost(supabase, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete post" },
      { status: 500 },
    );
  }
}
