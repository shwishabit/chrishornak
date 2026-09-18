import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/data'
import { guides } from '@/lib/guides'
import { getPublishedPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const guideEntries: MetadataRoute.Sitemap = guides
    .filter((g) => g.published)
    .map((g) => ({
      url: `${siteConfig.domain}/signal/${g.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  const postEntries: MetadataRoute.Sitemap = getPublishedPosts().map((p) => ({
    url: `${siteConfig.domain}/blog/${p.slug}`,
    lastModified: new Date(p.dateModified + 'T00:00:00'),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: siteConfig.domain,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${siteConfig.domain}/signal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...guideEntries,
    {
      url: `${siteConfig.domain}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...postEntries,
    {
      url: `${siteConfig.domain}/work`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.domain}/audit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.domain}/audit/benchmarks`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteConfig.domain}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
