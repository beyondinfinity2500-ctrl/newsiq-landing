"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ValidationError, UnauthorizedError } from "@/lib/errors";

async function getLocaleFromHeaders(): Promise<string> {
  const headerStore = await headers();
  const header = headerStore.get("x-next-intl-locale");
  return header ?? "en";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }
}

export async function signUpAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = await getLocaleFromHeaders();

  if (!isValidEmail(email)) throw new ValidationError("Please enter a valid email address.");
  validatePassword(password);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new ValidationError(error.message);
  }

  revalidatePath(`/${locale}`);
  redirect(`/${locale}/login?message=check-email`);
}

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = await getLocaleFromHeaders();

  if (!isValidEmail(email)) throw new ValidationError("Please enter a valid email address.");
  if (!password) throw new ValidationError("Please enter your password.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new UnauthorizedError("Invalid email or password.");
  }

  revalidatePath(`/${locale}`);
  redirect(`/${locale}`);
}

export async function signOutAction(): Promise<void> {
  const locale = await getLocaleFromHeaders();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath(`/${locale}`);
  redirect(`/${locale}`);
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = await getLocaleFromHeaders();

  if (!isValidEmail(email)) throw new ValidationError("Please enter a valid email address.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://newsiq.top"}/${locale}/reset-password`,
  });
  if (error) {
    throw new ValidationError(error.message);
  }

  redirect(`/${locale}/forgot-password?message=sent`);
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const locale = await getLocaleFromHeaders();

  validatePassword(password);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new ValidationError(error.message);
  }

  revalidatePath(`/${locale}`);
  redirect(`/${locale}/login?message=password-reset`);
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim() || null;
  const preferredLocale = String(formData.get("preferred_locale") ?? "en");
  const timezone = String(formData.get("timezone") ?? "UTC");
  const locale = await getLocaleFromHeaders();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      avatar_url: avatarUrl,
      preferred_locale: preferredLocale,
      timezone,
    })
    .eq("id", user.id);

  if (error) {
    throw new ValidationError(error.message);
  }

  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile?message=saved`);
}
