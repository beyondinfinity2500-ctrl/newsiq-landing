import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { createSource } from "@/features/sources/data-access";
import type { Database } from "@/lib/supabase/types";

type SourceInsert = Database["public"]["Tables"]["sources"]["Insert"];

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  try {
    await requireEditor(supabase);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 },
      );
    }

    const source = await createSource(supabase, {
      name: body.name,
      domain: body.domain || undefined,
      url: body.url || undefined,
      country: body.country || undefined,
      language: body.language || "en",
      source_type: body.source_type || "media",
      credibility_score: typeof body.credibility_score === "number" ? body.credibility_score : 50,
      verification_status: body.verification_status || "unverified",
      is_active: body.is_active !== false,
    } as SourceInsert);

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create source" },
      { status: 500 },
    );
  }
}
