import HomeClient from '@/components/layout/home-client'
import { AppHeader } from '@/components/layout/app-header'
import { AppFooter } from '@/components/layout/app-footer'
import { siteConfig } from '@/config/site'

export default function Page() {
  return (
    <>
      <AppHeader />
      <HomeClient locale={siteConfig.defaultLocale} />
      <AppFooter />
    </>
  )
}