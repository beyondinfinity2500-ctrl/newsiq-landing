import { getTranslations } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEditor } from "@/lib/security/authorization";
import { getPostById } from "@/features/editorial/data-access";
import { getActiveSources } from "@/features/sources/data-access";
import { regenerateAnalysisAction } from "@/features/ai/actions";
import { ArticleEditor } from "@/features/editorial/article-editor";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations("admin");
  const supabase = await createSupabaseServerClient();

  await requireEditor(supabase);

  let post;
  try {
    post = await getPostById(supabase, id);
  } catch {
    notFound();
  }

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">{t("posts.editPost")}</h1>
        <form action={regenerateAnalysisAction}>
          <input type="hidden" name="postId" value={post.id} />
          <Button type="submit" variant="outline" size="sm">
            <Sparkles className="size-4" />
            {t("posts.regenerateAnalysis")}
          </Button>
        </form>
      </div>
      <ArticleEditor locale={locale} post={post} translations={post.translations} categories={categories} sources={sources} />
    </div>
  );
}
