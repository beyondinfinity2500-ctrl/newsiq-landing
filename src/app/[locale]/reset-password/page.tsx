import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-sm py-20 text-center">
        <p className="text-sm text-muted-foreground">
          This link has expired or is invalid. Please request a new password reset link.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <ResetPasswordForm locale={locale} />
    </div>
  );
}
