/**
 * Authorization helpers.
 *
 * Role checks here are the FIRST line of defense (fast fail in UI / server actions),
 * but RLS policies in Supabase are the AUTHORITATIVE enforcement layer.
 * Never rely solely on these checks — always design RLS to enforce the same rules.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserRole } from "@/lib/supabase/types";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

type DbClient = SupabaseClient<Database>;

const ROLE_HIERARCHY: Record<UserRole, number> = {
  visitor: 0,
  user: 1,
  pro: 2,
  editor: 3,
  admin: 4,
  super_admin: 5,
};

export async function getCurrentUser(client: DbClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

export async function getUserRole(client: DbClient): Promise<UserRole> {
  const user = await getCurrentUser(client);
  if (!user) return "visitor";

  const { data: rawProfile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const profile = rawProfile as { role: UserRole } | null;

  return (profile?.role as UserRole) ?? "user";
}

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export async function requireAuth(client: DbClient) {
  const user = await getCurrentUser(client);
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(client: DbClient, requiredRole: UserRole) {
  const user = await requireAuth(client);
  const role = await getUserRole(client);
  if (!hasMinRole(role, requiredRole)) {
    throw new ForbiddenError(`Requires ${requiredRole} role or higher`);
  }
  return { user, role };
}

export async function requireEditor(client: DbClient) {
  return requireRole(client, "editor");
}

export async function requireAdmin(client: DbClient) {
  return requireRole(client, "admin");
}

export async function requireSuperAdmin(client: DbClient) {
  return requireRole(client, "super_admin");
}

/**
 * Client-side UI helper. NOT a security boundary — for display only.
 * Use `requireEditor` / `requireRole` on the server to enforce access.
 */
export function isEditorOrAbove(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return hasMinRole(role, "editor");
}
