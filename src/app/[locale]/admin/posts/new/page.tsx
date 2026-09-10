import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { getActiveSources } from "@/features/sources/data-access";
import { ArticleEditor } from "@/features/editorial/article-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  const { data: catData } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order");
  const categories = (catData ?? []) as { id: string; slug: string; name: string }[];
  const sources = await getActiveSources(supabase).then((s) => s.map((src) => ({ id: src.id, name: src.name })));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <Link href={`/${locale}/admin/posts`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("posts.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("posts.addNew")}</h1>
      <ArticleEditor locale={locale} categories={categories} sources={sources} />
    </div>
  );
}
