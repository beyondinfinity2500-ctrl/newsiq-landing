import { newsItems } from '../../lib/news/data'

const baseUrl = 'https://newsiq.top'

export function GET() {
  const items = newsItems.map((item) => `<item><title><![CDATA[${item.headline}]]></title><description><![CDATA[${item.summary} ${item.impact}]]></description><link>${baseUrl}/#${item.id}</link><guid isPermaLink="false">newsiq-${item.id}</guid><category>${item.category}</category></item>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>NEWSiQ Global News Intelligence</title><link>${baseUrl}</link><description>Global news and financial market impact analysis.</description><language>en</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
