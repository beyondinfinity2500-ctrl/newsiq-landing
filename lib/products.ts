export type Product = {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: 'month' | 'year'
  access: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'short-news-monthly',
    name: 'Short News',
    description: 'All short news, plus the first daily financial analysis.',
    priceInCents: 99,
    interval: 'month',
    access: 'All Short News + first daily analysis',
  },
  {
    id: 'ten-news-monthly',
    name: 'Daily Ten',
    description: 'Access to ten news stories each day.',
    priceInCents: 500,
    interval: 'month',
    access: '10 news stories per day',
  },
  {
    id: 'unlimited-monthly',
    name: 'Unlimited Monthly',
    description: 'Unlimited access to every story and analysis.',
    priceInCents: 1900,
    interval: 'month',
    access: 'Unlimited news and analysis',
  },
  {
    id: 'unlimited-annual',
    name: 'Unlimited Annual',
    description: 'One year of unlimited news and analysis.',
    priceInCents: 9900,
    interval: 'year',
    access: 'Unlimited news and analysis for one year',
  },
]

export function getProduct(id: string) {
  return PRODUCTS.find((product) => product.id === id)
}
