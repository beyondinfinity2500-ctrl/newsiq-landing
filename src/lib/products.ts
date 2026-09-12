export type Product = {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: 'month' | 'year'
  credits: number | null
  isPremium: boolean
  features: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'ai-analysis-30',
    name: 'AI Analysis — 30',
    description: '30 AI Analysis Credits per month. Unlock structured market impact breakdowns for the stories that matter.',
    priceInCents: 100,
    interval: 'month',
    credits: 30,
    isPremium: false,
    features: [
      '30 AI Analysis Credits / month',
      'Full market impact breakdown',
      'Affected assets & direction',
      'Risk & opportunity analysis',
    ],
  },
  {
    id: 'ai-analysis-300',
    name: 'AI Analysis — 300',
    description: '300 AI Analysis Credits per month. For readers who follow every move.',
    priceInCents: 1000,
    interval: 'month',
    credits: 300,
    isPremium: false,
    features: [
      '300 AI Analysis Credits / month',
      'Full market impact breakdown',
      'Affected assets & direction',
      'Risk & opportunity analysis',
      'Priority analysis queue',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Unlimited AI Analysis. The complete NewsIQ intelligence layer.',
    priceInCents: 5000,
    interval: 'month',
    credits: null,
    isPremium: true,
    features: [
      'Unlimited AI Analysis',
      'Full market impact breakdown',
      'Affected assets & direction',
      'Risk & opportunity analysis',
      'Priority analysis queue',
      'Early access to new features',
    ],
  },
]

export function getProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id)
}
