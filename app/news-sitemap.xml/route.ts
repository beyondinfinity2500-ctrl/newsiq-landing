import { newsItems } from '../../lib/news/data'

const baseUrl = 'https://newsiq.top'

export function GET() {
  const urls = newsItems.slice(0, 5).map((item) => `<url><loc>${baseUrl}/#${item.id}</loc><news:news><news:publication><news:name>NEWSiQ</news:name><news:language>en</news:language></news:publication><news:publication_date>2026-08-21T00:00:00+00:00</news:publication_date><news:title><![CDATA[${item.headline}]]></news:title></news:news></url>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
