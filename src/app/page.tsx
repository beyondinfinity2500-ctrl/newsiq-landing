import HomeClient from '@/components/layout/home-client'
import { siteConfig } from '@/config/site'

export default function Page() {
  return <HomeClient locale={siteConfig.defaultLocale} />
}