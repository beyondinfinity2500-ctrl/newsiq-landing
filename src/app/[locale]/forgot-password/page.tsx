import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Suspense>
        <ForgotPasswordForm locale={locale} />
      </Suspense>
    </div>
  );
}
