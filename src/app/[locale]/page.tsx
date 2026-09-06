import { Suspense } from 'react'
import HomeClient from '@/components/layout/home-client'

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Suspense fallback={null}>
      <HomeClient locale={locale} />
    </Suspense>
  )
}
