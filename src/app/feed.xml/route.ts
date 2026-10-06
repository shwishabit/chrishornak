/* ── /feed.xml: the blog posts and Signal guides as RSS 2.0 ────────────────
 * Linked from every page's <head> (layout.tsx alternates). Dates are the
 * posts' own datePublished, never the build time, so tools that read
 * freshness (our own Authority Check included) see real dates (2026-10-05).
 * ─────────────────────────────────────────────────────────────────────── */

import { siteConfig } from '@/lib/data'
import { getPublishedPosts } from '@/lib/blog'
import { guides } from '@/lib/guides'

export const dynamic = 'force-static'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** YYYY-MM-DD → an RFC 822 date at noon UTC (RSS pubDate). */
const rfc822 = (day: string) => new Date(`${day}T12:00:00Z`).toUTCString()

export function GET() {
  const items = [
    ...getPublishedPosts().map((p) => ({
      title: p.title,
      url: `${siteConfig.domain}/blog/${p.slug}`,
      description: p.metaDescription,
      date: p.datePublished,
    })),
    ...guides
      .filter((g) => g.published)
      .map((g) => ({
        title: g.headline,
        url: `${siteConfig.domain}/signal/${g.slug}`,
        description: g.metaDescription,
        date: g.datePublished,
      })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.brandName)}</title>
    <link>${siteConfig.domain}</link>
    <description>${esc(siteConfig.defaultDescription)}</description>
    <language>en-us</language>
    <atom:link href="${siteConfig.domain}/feed.xml" rel="self" type="application/rss+xml" />
${items.length ? `    <lastBuildDate>${rfc822(items[0].date)}</lastBuildDate>\n` : ''}${items
    .map(
      (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${i.url}</link>
      <guid isPermaLink="true">${i.url}</guid>
      <pubDate>${rfc822(i.date)}</pubDate>
      <description>${esc(i.description)}</description>
    </item>`,
    )
    .join('\n')}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
