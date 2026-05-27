import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/data'

const disallowedPaths = ['/api/', '/docs/', '/dev/', '/paige', '/learn/vibe-coding']

// Bots/crawlers that should be explicitly blocked from the unlisted areas
// (some AI scrapers ignore the default '*' rule unless named directly).
const aiCrawlers = [
  'CCBot',
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'Google-Extended',
  'PerplexityBot',
  'Bytespider',
  'cohere-ai',
  'Amazonbot',
  'Applebot-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        disallow: disallowedPaths,
      })),
    ],
    sitemap: `${siteConfig.domain}/sitemap.xml`,
  }
}
