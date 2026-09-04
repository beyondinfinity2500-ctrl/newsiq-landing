/**
 * Sources data-access layer — manages news sources and their reliability review.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Source } from "@/lib/supabase/types";
import { NotFoundError } from "@/lib/errors";

type DbClient = SupabaseClient<Database>;

type SourceInsert = Database["public"]["Tables"]["sources"]["Insert"];
type SourceUpdate = Database["public"]["Tables"]["sources"]["Update"];

export async function getAllSources(client: DbClient): Promise<Source[]> {
  const { data, error } = await client
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Source[];
}

export async function getActiveSources(client: DbClient): Promise<Source[]> {
  const { data, error } = await client
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Source[];
}

export async function getSourceById(
  client: DbClient,
  id: string,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new NotFoundError("Source not found");
  return data as unknown as Source;
}

export async function createSource(
  client: DbClient,
  input: SourceInsert,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Source;
}

export async function updateSource(
  client: DbClient,
  id: string,
  input: SourceUpdate,
): Promise<Source> {
  const { data, error } = await client
    .from("sources")
    .update(input as never)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) throw new NotFoundError("Source not found");
  return data as unknown as Source;
}

export async function deleteSource(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("sources").delete().eq("id", id);
  if (error) throw error;
}

export async function getSourceStats(
  client: DbClient,
  sourceId: string,
): Promise<{ postCount: number }> {
  const { count, error } = await client
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("source_id", sourceId);
  if (error) return { postCount: 0 };
  return { postCount: count ?? 0 };
}
