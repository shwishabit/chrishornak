import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/data'
import { guides } from '@/lib/guides'
import { getPublishedPosts } from '@/lib/blog'

// Real dates only (2026-10-05). `new Date()` stamped every page with the build time, which
// tells search engines and freshness checks (our own Authority Check included) nothing. Posts
// and guides use their dateModified; /blog and /signal use their newest one; pages whose
// changes we don't track leave lastModified out.
const day = (d: string) => new Date(`${d}T00:00:00`)
const newest = (dates: string[]) => (dates.length ? day([...dates].sort().at(-1)!) : undefined)

export default function sitemap(): MetadataRoute.Sitemap {
  const publishedGuides = guides.filter((g) => g.published)
  const posts = getPublishedPosts()

  const guideEntries: MetadataRoute.Sitemap = publishedGuides.map((g) => ({
    url: `${siteConfig.domain}/signal/${g.slug}`,
    lastModified: day(g.dateModified),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteConfig.domain}/blog/${p.slug}`,
    lastModified: day(p.dateModified),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: siteConfig.domain,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteConfig.domain}/signal`,
      lastModified: newest(publishedGuides.map((g) => g.dateModified)),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...guideEntries,
    {
      url: `${siteConfig.domain}/blog`,
      lastModified: newest(posts.map((p) => p.dateModified)),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...postEntries,
    {
      url: `${siteConfig.domain}/work`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.domain}/tools`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.domain}/audit`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.domain}/og-image-checker`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.domain}/authority-check`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.domain}/audit/benchmarks`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteConfig.domain}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
