import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/auth/profile-form";
import type { Profile } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as Profile | null;
  if (!profile) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Suspense>
        <ProfileForm profile={profile} locale={locale} />
      </Suspense>
    </div>
  );
}
