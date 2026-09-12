import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getPublishedArticles } from '@/features/news/data-access'
import HomeClient from '@/components/layout/home-client'
import type { ArticleWithDetails } from '@/features/news/data-access'

async function HomepageData({ locale }: { locale: string }) {
  const supabase = await createSupabaseServerClient()
  let articles: ArticleWithDetails[] = []
  try {
    articles = await getPublishedArticles(supabase, { locale, limit: 20 })
  } catch {
    // If Supabase is unavailable, render with empty data
  }
  return <HomeClient locale={locale} initialArticles={articles} />
}

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Suspense fallback={null}>
      <HomepageData locale={locale} />
    </Suspense>
  )
}
