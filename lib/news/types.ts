export type NewsCategory = 'Disaster' | 'Markets' | 'Geopolitics' | 'Technology'

export type NewsItem = {
  id: string
  region: string
  category: NewsCategory
  time: string
  source: string
  localLabel: string
  headline: string
  localHeadline: string
  summary: string
  impact: string
  confidence: string
  locked?: boolean
  breaking?: boolean
}

export const newsCategories = ['Live feed', 'Markets', 'Geopolitics', 'Technology'] as const
export type NewsFilter = (typeof newsCategories)[number]
