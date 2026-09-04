import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { SourceForm } from "@/features/sources/source-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewSourcePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-6">
      <Link
        href={`/${locale}/admin/sources`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("sources.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("sources.addNew")}
      </h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <SourceForm locale={locale} mode="create" />
      </div>
    </div>
  );
}
