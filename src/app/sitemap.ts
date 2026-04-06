import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/data'
import { guides } from '@/lib/guides'

export default function sitemap(): MetadataRoute.Sitemap {
  const guideEntries: MetadataRoute.Sitemap = guides
    .filter((g) => g.published)
    .map((g) => ({
      url: `${siteConfig.domain}/signal/${g.slug}`,
      lastModified: new Date(),
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
      url: `${siteConfig.domain}/audit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteConfig.domain}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
