import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { updateSource, deleteSource } from "@/features/sources/data-access";
import type { Database } from "@/lib/supabase/types";

type SourceUpdate = Database["public"]["Tables"]["sources"]["Update"];

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
    if (body.name !== undefined) update.name = body.name;
    if (body.domain !== undefined) update.domain = body.domain;
    if (body.url !== undefined) update.url = body.url;
    if (body.country !== undefined) update.country = body.country;
    if (body.language !== undefined) update.language = body.language;
    if (body.source_type !== undefined) update.source_type = body.source_type;
    if (body.credibility_score !== undefined) update.credibility_score = body.credibility_score;
    if (body.verification_status !== undefined) update.verification_status = body.verification_status;
    if (body.is_active !== undefined) update.is_active = body.is_active;

    const source = await updateSource(supabase, id, update as SourceUpdate);
    return NextResponse.json(source);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update source" },
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
    await deleteSource(supabase, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete source" },
      { status: 500 },
    );
  }
}
