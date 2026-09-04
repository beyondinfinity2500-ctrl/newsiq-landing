import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { getSourceById } from "@/features/sources/data-access";
import { SourceForm } from "@/features/sources/source-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  let source;
  try {
    source = await getSourceById(supabase, id);
  } catch {
    notFound();
  }

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
        {t("sources.editSource")}
      </h1>
      <div className="rounded-xl border border-border bg-card p-6">
        <SourceForm locale={locale} source={source} mode="edit" />
      </div>
    </div>
  );
}
