/**
 * Editorial data-access layer — manages posts and their translations
 * for the editorial workflow (draft → review → publish).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Post, PostTranslation } from "@/lib/supabase/types";
import { NotFoundError } from "@/lib/errors";

type DbClient = SupabaseClient<Database>;

type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
type TranslationInsert = Database["public"]["Tables"]["post_translations"]["Insert"];
type TranslationUpdate = Database["public"]["Tables"]["post_translations"]["Update"];

export interface PostWithTranslations extends Post {
  translations: PostTranslation[];
}

export async function getAllPosts(
  client: DbClient,
  options: { status?: string; limit?: number; offset?: number } = {},
): Promise<PostWithTranslations[]> {
  const { status, limit = 20, offset = 0 } = options;
  let q = client
    .from("posts")
    .select("*, post_translations(*)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const { post_translations, ...postFields } = r as Record<string, unknown>;
    return {
      ...(postFields as unknown as Post),
      translations: (post_translations as PostTranslation[]) ?? [],
    };
  });
}

export async function getPostById(
  client: DbClient,
  id: string,
): Promise<PostWithTranslations> {
  const { data, error } = await client
    .from("posts")
    .select("*, post_translations(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) throw new NotFoundError("Post not found");
  const { post_translations, ...postFields } = data as Record<string, unknown>;
  return {
    ...(postFields as unknown as Post),
    translations: (post_translations as PostTranslation[]) ?? [],
  };
}

export async function createPost(
  client: DbClient,
  input: PostInsert,
): Promise<Post> {
  const { data, error } = await client
    .from("posts")
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Post;
}

export async function updatePost(
  client: DbClient,
  id: string,
  input: PostUpdate,
): Promise<Post> {
  const { data, error } = await client
    .from("posts")
    .update(input as never)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) throw new NotFoundError("Post not found");
  return data as unknown as Post;
}

export async function deletePost(client: DbClient, id: string): Promise<void> {
  const { error } = await client.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function getTranslation(
  client: DbClient,
  postId: string,
  locale: string,
): Promise<PostTranslation | null> {
  const { data } = await client
    .from("post_translations")
    .select("*")
    .eq("post_id", postId)
    .eq("locale", locale)
    .maybeSingle();
  return data as unknown as PostTranslation | null;
}

export async function upsertTranslation(
  client: DbClient,
  input: TranslationInsert,
): Promise<PostTranslation> {
  const { data, error } = await client
    .from("post_translations")
    .upsert(input as never, { onConflict: "post_id,locale" })
    .select("*")
    .maybeSingle();
  if (error || !data) throw new NotFoundError("Translation could not be saved");
  return data as unknown as PostTranslation;
}

export async function updateTranslation(
  client: DbClient,
  id: string,
  input: TranslationUpdate,
): Promise<PostTranslation> {
  const { data, error } = await client
    .from("post_translations")
    .update(input as never)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error || !data) throw new NotFoundError("Translation not found");
  return data as unknown as PostTranslation;
}

export async function publishPost(
  client: DbClient,
  id: string,
): Promise<Post> {
  return updatePost(client, id, {
    status: "published",
    published_at: new Date().toISOString(),
  } as never);
}

export async function unpublishPost(
  client: DbClient,
  id: string,
): Promise<Post> {
  return updatePost(client, id, { status: "draft" } as never);
}
