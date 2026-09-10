import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { getAllSources, getSourceStats } from "@/features/sources/data-access";
import { SourceRow } from "@/features/sources/source-row";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  const sources = await getAllSources(supabase);

  const stats = await Promise.all(
    sources.map((s) => getSourceStats(supabase, s.id)),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("sources.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sources.subtitle")}
          </p>
        </div>
        <Link href={`/${locale}/admin/sources/new`}>
          <Button>
            <Plus className="size-4" />
            {t("sources.add")}
          </Button>
        </Link>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">{t("sources.empty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sources.name")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sources.type")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sources.credibility")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sources.verification")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sources.articles")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sources.active")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sources.map((source, i) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  locale={locale}
                  postCount={stats[i].postCount}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
