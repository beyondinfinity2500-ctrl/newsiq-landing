"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { ValidationError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { requireSuperAdmin } from "@/lib/security/authorization";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changeRoleSchema,
} from "@/lib/validation";

async function getLocaleFromHeaders(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("x-next-intl-locale") ?? "en";
}

function validationErrorFor(issues: { path: PropertyKey[]; message: string }[]): ValidationError {
  const first = issues[0];
  return new ValidationError(
    first ? `${String(first.path[0] ?? "")}: ${first.message}` : "Invalid input",
  );
}

type AnySchema = {
  safeParse: (data: unknown) =>
    | { success: true; data: unknown }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
};

function parseFormData<T>(schema: AnySchema, formData: FormData): T {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw validationErrorFor(result.error.issues);
  }
  return result.data as T;
}

export async function signUpAction(formData: FormData): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const input = parseFormData<{ email: string; password: string }>(signUpSchema, formData);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) {
    logger.warn("auth.signup.failed", { email: input.email, reason: error.message });
    throw new ValidationError(error.message);
  }

  logger.info("auth.signup.success", { email: input.email });
  revalidatePath(`/${locale}`);
  redirect(`/${locale}/login?message=check-email`);
}

export async function signInAction(formData: FormData): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const input = parseFormData<{ email: string; password: string }>(signInSchema, formData);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) {
    logger.warn("auth.signin.failed", { email: input.email, reason: error.message });
    throw new UnauthorizedError("Invalid email or password.");
  }

  logger.info("auth.signin.success", { email: input.email });
  revalidatePath(`/${locale}`);
  redirect(`/${locale}`);
}

export async function signOutAction(): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  logger.info("auth.signout", { userId: user?.id ?? null });
  revalidatePath(`/${locale}`);
  redirect(`/${locale}`);
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const input = parseFormData<{ email: string }>(forgotPasswordSchema, formData);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${env.site.url}/${locale}/reset-password`,
  });
  if (error) {
    logger.warn("auth.forgot_password.failed", { email: input.email, reason: error.message });
    throw new ValidationError(error.message);
  }

  logger.info("auth.forgot_password.requested", { email: input.email });
  redirect(`/${locale}/forgot-password?message=sent`);
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const input = parseFormData<{ password: string }>(resetPasswordSchema, formData);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new UnauthorizedError("Reset link is invalid or has expired. Please request a new one.");
  }

  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) {
    logger.warn("auth.reset_password.failed", { userId: user.id, reason: error.message });
    throw new ValidationError(error.message);
  }

  logger.info("auth.reset_password.success", { userId: user.id });
  revalidatePath(`/${locale}`);
  redirect(`/${locale}/login?message=password-reset`);
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const input = parseFormData<{
    display_name: string | null;
    avatar_url: string | null;
    preferred_locale: string;
    timezone: string;
  }>(updateProfileSchema, formData);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.display_name,
      avatar_url: input.avatar_url,
      preferred_locale: input.preferred_locale,
      timezone: input.timezone,
    })
    .eq("id", user.id);

  if (error) {
    logger.warn("profile.update.failed", { userId: user.id, reason: error.message });
    throw new ValidationError(error.message);
  }

  logger.info("profile.update.success", { userId: user.id });
  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile?message=saved`);
}

/**
 * Privileged Server Action: change a user's role.
 *
 * Authorization: super_admin only (enforced by `requireSuperAdmin`).
 * Persistence: uses the Supabase admin client (service role) because RLS does
 * not allow self-role modification and the RLS policy `profiles_update_own_safe`
 * specifically blocks role changes even for the owner.
 *
 * This is the ONLY supported path to change a role. No UI exists yet — it is
 * intentionally headless so it can be wired up to an admin page in a later
 * phase without re-implementing the security boundary.
 */
export async function changeRoleAction(formData: FormData): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const input = parseFormData<{ userId: string; role: "visitor" | "user" | "pro" | "editor" | "admin" | "super_admin" }>(
    changeRoleSchema,
    formData,
  );

  const supabase = await createSupabaseServerClient();
  const { user: actor, role: actorRole } = await requireSuperAdmin(supabase);

  if (input.userId === actor.id) {
    throw new ForbiddenError("You cannot change your own role.");
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ role: input.role })
    .eq("id", input.userId)
    .select("id, role")
    .maybeSingle();

  if (error) {
    logger.error("admin.change_role.failed", {
      actorId: actor.id,
      targetId: input.userId,
      targetRole: input.role,
      reason: error.message,
    });
    throw new ValidationError(error.message);
  }
  if (!data) {
    throw new ValidationError("Target user not found.");
  }

  logger.warn("admin.change_role.success", {
    actorId: actor.id,
    actorRole,
    targetId: input.userId,
    newRole: input.role,
  });

  revalidatePath(`/${locale}/admin/users`);
  redirect(`/${locale}/admin/users?message=role-changed`);
}
