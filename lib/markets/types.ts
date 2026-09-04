export type MarketGroup = 'Indices' | 'FX' | 'Commodities' | 'Crypto'

export type MarketQuote = {
  symbol: string
  name: string
  value: string
  change: string
  positive: boolean
  source: string
}

export type MarketSection = {
  group: MarketGroup
  eyebrow: string
  impact: string
  quotes: MarketQuote[]
}
