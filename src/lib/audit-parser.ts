/* ── Real HTML Audit Parser ───────────────────────────────────────────────
 *
 * Accepts raw HTML + metadata from the fetch-url API and runs all 45
 * checks across 7 categories. Returns plain data (no React nodes) —
 * the component maps category names to icons.
 *
 * Categories (in order):
 *   Search (8) · AI (7) · Structure (6) · Social (6) · Mobile (6) · Security (6) · Accessibility (6)
 * ─────────────────────────────────────────────────────────────────────── */

import type { Status, AuditItem } from './audit-scoring'

export interface ParsedCategory {
  name: string
  items: AuditItem[]
}

export interface ParsedAuditResult {
  url: string
  categories: ParsedCategory[]
}

export interface FetchedPage {
  url: string
  requestedUrl: string
  html: string
  robotsTxt: string
  sitemapXml: string
  llmsTxt: string
  headers: Record<string, string>
  statusCode: number
  isHttps: boolean
  responseTimeMs: number
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Simple tag/attribute extractor — no DOM parser needed on the client */
function meta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:name|property)=["']${escRe(name)}["'][^>]*content=["']([^"']*)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escRe(name)}["']`,
      'i',
    ),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1]
  }
  return null
}

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getTag(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return m ? m[1].trim() : null
}

function getAllTags(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi')
  return [...html.matchAll(re)].map((m) => m[0])
}

function getAllSelfClosing(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi')
  return [...html.matchAll(re)].map((m) => m[0])
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'))
  return m ? m[1] : null
}

function wordCount(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.split(/\s+/).length : 0
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

/** Filter out tracking pixels, base64 data URIs, and SVG placeholders */
function isRealImage(imgTag: string): boolean {
  const src = attr(imgTag, 'src') ?? ''
  if (!src) return false
  if (src.startsWith('data:')) return false
  if (/\.(gif)(\?|$)/i.test(src) && /1x1|spacer|pixel|tracking|blank/i.test(src)) return false
  // Filter common tracking pixel patterns
  if (/facebook\.com\/tr|google-analytics|doubleclick|pixel|beacon/i.test(src)) return false
  return true
}

/* ── 1. Search ───────────────────────────────────────────────────────── */

function parseSearch(page: FetchedPage): AuditItem[] {
  const { html, robotsTxt, sitemapXml, url } = page
  const items: AuditItem[] = []

  // 1. Indexability
  const robotsMeta = meta(html, 'robots') ?? ''
  const isNoindex = /noindex/i.test(robotsMeta)
  items.push(
    isNoindex
      ? {
          label: 'Indexability',
          status: 'fail',
          value: 'Page is blocked from indexing',
          extracted: `<meta name="robots" content="${robotsMeta}" />`,
          recommendation:
            'Your page has a "noindex" tag, which tells Google not to show it in search results. If this page should be findable, remove the noindex directive.',
          weight: 2,
        }
      : {
          label: 'Indexability',
          status: 'pass',
          value: 'Page is indexable',
          extracted: robotsMeta
            ? `<meta name="robots" content="${robotsMeta}" />`
            : 'No robots meta tag found (defaults to indexable)',
          weight: 2,
        },
  )

  // 2. Page title (high weight — most visible element in search results)
  const title = getTag(html, 'title')
  if (!title) {
    items.push({
      label: 'Page title',
      status: 'fail',
      value: 'Missing',
      weight: 1.5,
      recommendation:
        'The page title is the first thing people see in search results and browser tabs. Every page needs a clear, descriptive title.',
    })
  } else if (title.length > 60) {
    items.push({
      label: 'Page title',
      status: 'warn',
      value: `${title.length} characters — may be truncated in search results`,
      extracted: `<title>${truncate(title, 120)}</title>`,
      weight: 1.5,
      recommendation: 'Keep your title under 60 characters so it displays fully in search results.',
    })
  } else {
    items.push({
      label: 'Page title',
      status: 'pass',
      value: `${title.length} characters`,
      extracted: `<title>${title}</title>`,
      weight: 1.5,
    })
  }

  // 3. Page description
  const desc = meta(html, 'description')
  if (!desc) {
    items.push({
      label: 'Page description',
      status: 'fail',
      value: 'Missing',
      recommendation:
        'The meta description is the short summary that appears under your link in Google. Without one, Google will pick a random snippet from your page. Add a compelling 120–160 character description.',
    })
  } else if (desc.length > 160) {
    items.push({
      label: 'Page description',
      status: 'warn',
      value: `${desc.length} characters — may be cut off in search results`,
      extracted: `<meta name="description" content="${truncate(desc, 200)}" />`,
      recommendation:
        'This is the short summary under your link in Google. Keep it under 160 characters so it doesn\'t get cut off.',
    })
  } else if (desc.length < 50) {
    items.push({
      label: 'Page description',
      status: 'warn',
      value: `${desc.length} characters — could be more descriptive`,
      extracted: `<meta name="description" content="${desc}" />`,
      recommendation:
        'Your description is quite short. A fuller description (120–160 characters) gives searchers more reason to click.',
    })
  } else {
    items.push({
      label: 'Page description',
      status: 'pass',
      value: `${desc.length} characters`,
      extracted: `<meta name="description" content="${truncate(desc, 200)}" />`,
    })
  }

  // 4. Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
    ?? html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i)
  if (canonicalMatch) {
    items.push({
      label: 'Canonical URL',
      status: 'pass',
      value: 'Set',
      extracted: `<link rel="canonical" href="${canonicalMatch[1]}" />`,
    })
  } else {
    items.push({
      label: 'Canonical URL',
      status: 'fail',
      value: 'Missing',
      recommendation:
        'Without a canonical tag, search engines might treat different URLs as duplicate pages. Add one to tell Google which version is the main one: <link rel="canonical" href="' +
        url +
        '" />',
    })
  }

  // 5. Crawl permissions (robots.txt)
  if (robotsTxt) {
    // Check if User-agent: * section has a blanket Disallow: /
    const wildCardBlocks = robotsTxt
      .split(/(?=User-agent:)/i)
      .filter((block) => /User-agent:\s*\*/i.test(block))
    const blanketDisallow = wildCardBlocks.some((block) =>
      /Disallow:\s*\/\s*$/m.test(block),
    )

    if (blanketDisallow) {
      items.push({
        label: 'Crawl permissions',
        status: 'fail',
        value: 'robots.txt blocks all crawlers',
        extracted: truncate(robotsTxt, 300),
        recommendation:
          'Your robots.txt is telling search engines not to crawl your site. If your site should be findable, change "Disallow: /" to "Allow: /".',
      })
    } else {
      items.push({
        label: 'Crawl permissions',
        status: 'pass',
        value: 'robots.txt allows crawling',
        extracted: truncate(robotsTxt, 300),
      })
    }
  } else {
    items.push({
      label: 'Crawl permissions',
      status: 'warn',
      value: 'No robots.txt found',
      recommendation:
        'A robots.txt file tells search engines which parts of your site they can crawl. Without one, crawlers will access everything — which is usually fine, but having one gives you control.',
    })
  }

  // 6. Sitemap
  const sitemapInRobots = robotsTxt
    ? /sitemap:/i.test(robotsTxt)
    : false
  const hasSitemap = sitemapXml.length > 100

  if (hasSitemap && sitemapInRobots) {
    items.push({
      label: 'Sitemap',
      status: 'pass',
      value: 'Found and referenced in robots.txt',
    })
  } else if (hasSitemap) {
    items.push({
      label: 'Sitemap',
      status: 'warn',
      value: 'Sitemap exists but isn\'t referenced in robots.txt',
      recommendation:
        'Your sitemap exists but crawlers might miss it. Add this line to your robots.txt: Sitemap: ' +
        new URL('/sitemap.xml', url).href,
    })
  } else {
    items.push({
      label: 'Sitemap',
      status: 'fail',
      value: 'No sitemap found',
      recommendation:
        'A sitemap is like a table of contents for search engines. It helps them discover all your pages faster. Create a sitemap.xml and submit it through Google Search Console.',
    })
  }

  // 7. URL redirects
  try {
    const reqUrl = new URL(page.requestedUrl)
    const finUrl = new URL(page.url)

    // Classify redirect types
    const httpUpgrade = reqUrl.protocol === 'http:' && finUrl.protocol === 'https:'
    const wwwNormalize =
      reqUrl.hostname.replace(/^www\./, '') === finUrl.hostname.replace(/^www\./, '') &&
      reqUrl.hostname !== finUrl.hostname
    const pathNormalize =
      reqUrl.pathname.replace(/\/+$/, '') === finUrl.pathname.replace(/\/+$/, '')
    const unexpectedHostChange =
      reqUrl.hostname.replace(/^www\./, '') !== finUrl.hostname.replace(/^www\./, '')
    const unexpectedPathChange = !pathNormalize

    if (unexpectedHostChange || unexpectedPathChange) {
      // Real redirect issue — different domain or path changed
      const issues: string[] = []
      if (unexpectedHostChange) issues.push(`${reqUrl.hostname} → ${finUrl.hostname}`)
      if (unexpectedPathChange) issues.push('path changed')
      items.push({
        label: 'URL redirects',
        status: 'warn',
        value: `Unexpected redirect (${issues.join(', ')})`,
        extracted: `${page.requestedUrl} → ${page.url}`,
        recommendation:
          'Your URL redirects to a different destination than expected. This can dilute SEO signals. Make sure links point directly to the final URL.',
        weight: 0.5,
      })
    } else if (httpUpgrade || wwwNormalize) {
      // Normal domain normalization — this is good practice
      const details: string[] = []
      if (httpUpgrade) details.push('HTTPS upgrade')
      if (wwwNormalize) details.push('www normalization')
      items.push({
        label: 'URL redirects',
        status: 'pass',
        value: `Preferred domain set (${details.join(', ')})`,
        extracted: `${page.requestedUrl} → ${page.url}`,
        weight: 0.5,
      })
    } else {
      items.push({
        label: 'URL redirects',
        status: 'pass',
        value: 'No redirects detected',
        weight: 0.5,
      })
    }
  } catch {
    items.push({
      label: 'URL redirects',
      status: 'pass',
      value: 'No redirects detected',
      weight: 0.5,
    })
  }

  // 8. Response time (lower weight — influenced by network/server factors outside the page)
  const ms = page.responseTimeMs
  if (ms < 1000) {
    items.push({
      label: 'Response time',
      status: 'pass',
      value: `${ms}ms`,
      weight: 0.5,
    })
  } else if (ms < 3000) {
    items.push({
      label: 'Response time',
      status: 'warn',
      value: `${ms}ms — slower than ideal`,
      recommendation:
        'Your page took over a second to respond. Slow pages get crawled less frequently by search engines and frustrate visitors. Check your hosting, reduce server-side processing, or add caching.',
      weight: 0.5,
    })
  } else {
    items.push({
      label: 'Response time',
      status: 'fail',
      value: `${ms}ms — too slow`,
      recommendation:
        'Your page took over 3 seconds to respond. Google allocates a limited crawl budget per site, and slow pages eat into it. This also hurts user experience. Talk to your hosting provider or developer about server performance.',
      weight: 0.5,
    })
  }

  return items
}

/* ── 2. AI ────────────────────────────────────────────────────────────── */

function parseAI(page: FetchedPage): AuditItem[] {
  const { html } = page
  const items: AuditItem[] = []
  const pageText = extractText(html)

  // Shared: detect JSON-LD blocks (used by multiple checks)
  const jsonLdBlocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  )
  const hasMicrodata = /itemscope|itemtype/i.test(html)

  // 1. Structured data (JSON-LD or microdata) with schema depth validation
  const SCHEMA_REQUIRED: Record<string, string[]> = {
    LocalBusiness: ['name', 'address', 'telephone'],
    Organization: ['name', 'url'],
    Person: ['name', 'jobTitle'],
    Product: ['name', 'description', 'offers'],
    WebSite: ['name', 'url'],
    Article: ['headline', 'author', 'datePublished'],
    BlogPosting: ['headline', 'author', 'datePublished'],
    ProfessionalService: ['name', 'address', 'telephone'],
    Restaurant: ['name', 'address', 'telephone'],
  }

  if (jsonLdBlocks && jsonLdBlocks.length > 0) {
    const types: string[] = []
    const missingFields: string[] = []

    for (const block of jsonLdBlocks) {
      const content = block.replace(/<[^>]+>/g, '')
      try {
        const parsed = JSON.parse(content)
        // Handle @graph arrays and single objects
        const entities = parsed['@graph'] ? parsed['@graph'] : [parsed]
        for (const entity of entities) {
          const type = entity['@type']
          if (!type) continue
          // Handle array types like ["LocalBusiness", "Store"]
          const typeList = Array.isArray(type) ? type : [type]
          for (const t of typeList) {
            types.push(t)
            const required = SCHEMA_REQUIRED[t]
            if (required) {
              const missing = required.filter((f) => !entity[f])
              if (missing.length > 0) {
                missingFields.push(`${t}: missing ${missing.join(', ')}`)
              }
            }
          }
        }
      } catch {
        // Malformed JSON-LD — still count the block, extract types via regex
        const typeMatch = content.match(/"@type"\s*:\s*"([^"]+)"/g)
        if (typeMatch) {
          types.push(...typeMatch.map((t) => t.replace(/"@type"\s*:\s*"/, '').replace('"', '')))
        }
      }
    }

    if (missingFields.length > 0) {
      items.push({
        label: 'Structured data',
        status: 'warn',
        value: `${jsonLdBlocks.length} JSON-LD block${jsonLdBlocks.length > 1 ? 's' : ''} — incomplete`,
        extracted: missingFields.join('; '),
        weight: 1.5,
        recommendation:
          'Your structured data exists but is missing fields that Google uses for rich results. Filling in the missing fields gives you a better shot at enhanced search listings.',
      })
    } else {
      items.push({
        label: 'Structured data',
        status: 'pass',
        value: `${jsonLdBlocks.length} JSON-LD block${jsonLdBlocks.length > 1 ? 's' : ''} found`,
        extracted: types.length > 0 ? `Schema types: ${types.join(', ')}` : undefined,
        weight: 1.5,
      })
    }
  } else if (hasMicrodata) {
    items.push({
      label: 'Structured data',
      status: 'pass',
      value: 'Microdata markup found',
      weight: 1.5,
    })
  } else {
    items.push({
      label: 'Structured data',
      status: 'fail',
      value: 'None found',
      weight: 1.5,
      recommendation:
        'Structured data is like a cheat sheet for Google and AI tools. It tells them exactly what your business is, what you offer, and how to display your content in rich search results. Add JSON-LD schema markup.',
    })
  }

  // 2. Answerable content (FAQ patterns, Q&A schema)
  const hasFaqSchema =
    jsonLdBlocks?.some((b) => /FAQPage/i.test(b)) ?? false
  const hasQAPatterns = /<(h[2-4])[^>]*>[^<]*(how|what|why|when|where|who|can|does|is|should)[^<]*\?/i.test(
    html,
  )
  const hasFaqHtml = /class=["'][^"']*faq/i.test(html)

  if (hasFaqSchema) {
    items.push({
      label: 'Answerable content',
      status: 'pass',
      value: 'FAQ schema found',
    })
  } else if (hasQAPatterns || hasFaqHtml) {
    items.push({
      label: 'Answerable content',
      status: 'pass',
      value: 'Q&A-style content found',
    })
  } else {
    items.push({
      label: 'Answerable content',
      status: 'warn',
      value: 'No Q&A content found',
      recommendation:
        'AI tools like ChatGPT pull answers directly from web pages. Adding a FAQ section or question-based headings makes it easier for AI to cite your page.',
    })
  }

  // 3. Trust signals — credibility indicators that work on any page type
  const hasAboutLink = /href=["'][^"']*(about|team|who-we-are|our-story)/i.test(html)
  const hasTestimonials =
    /testimonial|review|client|customer.said|what.people.say/i.test(html) ||
    (html.match(/<blockquote/gi) ?? []).length >= 2
  const hasCredentials =
    /\b(certified|licensed|accredited|award|year[s]? (of |in )?experience|founded|established|since \d{4})\b/i.test(
      pageText,
    )
  const hasOrgSchema =
    jsonLdBlocks?.some((b) => /Organization|LocalBusiness|Person|ProfessionalService/i.test(b)) ?? false
  const hasTeamSection =
    /(our team|meet the team|who we are|the people behind|leadership|our staff|about the owner|about us)/i.test(
      pageText,
    )
  const hasPeopleWithRoles =
    /\b(founder|owner|ceo|cto|director|manager|partner|principal|president)\b/i.test(pageText)
  const hasPeople = hasTeamSection || hasPeopleWithRoles

  const signalList = [
    hasAboutLink && 'About/team page linked',
    hasTestimonials && 'Testimonials or reviews',
    hasCredentials && 'Credentials or experience mentioned',
    hasOrgSchema && 'Business schema markup',
    hasPeople && 'People behind the business',
  ].filter(Boolean) as string[]

  if (signalList.length >= 3) {
    items.push({
      label: 'Trust signals',
      status: 'pass',
      value: 'Strong credibility indicators',
      extracted: signalList.join(', '),
    })
  } else if (signalList.length >= 1) {
    items.push({
      label: 'Trust signals',
      status: 'warn',
      value: 'Some credibility indicators, but could be stronger',
      extracted: signalList.join(', '),
      recommendation:
        'AI and search engines look for signs that real people stand behind your business. Adding testimonials, team info, an about page, credentials, and schema markup helps them — and your visitors — trust you.',
    })
  } else {
    items.push({
      label: 'Trust signals',
      status: 'fail',
      value: 'No credibility indicators found',
      recommendation:
        'There\'s nothing on your page that tells visitors or AI who\'s behind this business. Add testimonials, introduce your team or yourself, link to an about page, and add business schema markup.',
    })
  }

  // 4. Citability — original data, stats, unique insights
  const hasStats = /\d+%|\d+x|\$[\d,]+|\d{1,3}(,\d{3})+/.test(pageText)
  const hasDataWords =
    /(case study|research|survey|data|result|finding|study shows|according to|we found)/i.test(
      pageText,
    )
  const hasQuotes =
    (html.match(/<blockquote/gi) ?? []).length > 0 ||
    /"[^"]{30,}"/g.test(pageText)
  const citabilitySignals = [hasStats, hasDataWords, hasQuotes].filter(Boolean).length

  if (citabilitySignals >= 2) {
    items.push({
      label: 'Citability',
      status: 'pass',
      value: 'Original data and citable content found',
    })
  } else if (citabilitySignals === 1) {
    items.push({
      label: 'Citability',
      status: 'warn',
      value: 'Some citable content, but could be stronger',
      recommendation:
        'AI tools cite pages with original data, unique insights, and quotable statements. Adding proprietary stats, case study results, or expert quotes makes your content more reference-worthy.',
    })
  } else {
    items.push({
      label: 'Citability',
      status: 'warn',
      value: 'No unique data or quotable insights found',
      recommendation:
        'AI tools are more likely to cite pages that contain original data, specific stats, or quotable statements. Adding results you\'ve achieved, case study numbers, or expert quotes makes your content more reference-worthy.',
    })
  }

  // 5. Entity clarity — business type, location, specialties clearly stated
  const hasLocalBusiness =
    jsonLdBlocks?.some((b) => /LocalBusiness|Organization|Person/i.test(b)) ?? false
  const hasAddressInfo =
    /\b(address|location|phone|tel|headquarter|based in|serving|office)\b/i.test(pageText)
  const hasBusinessType =
    /\b(agency|company|firm|consultant|freelanc|studio|practice|shop|store|restaurant|salon|spa|clinic|gym|church|school|contractor|dentist|doctor|lawyer|attorney|plumb|electric|mover|moving|clean|bakery|brewery|florist|veterinar|daycare|auto|insurance|account|roofing|hvac|landscap|photograph|catering|fitness|wellness|therapy|coaching|nonprofit|realtor|real estate|architect|engineer|construct)\b/i.test(
      pageText,
    )
  const entitySignals = [hasLocalBusiness, hasAddressInfo, hasBusinessType].filter(Boolean).length

  if (entitySignals >= 2) {
    items.push({
      label: 'Entity clarity',
      status: 'pass',
      value: 'Business identity is clearly defined',
    })
  } else if (entitySignals === 1) {
    items.push({
      label: 'Entity clarity',
      status: 'warn',
      value: 'Partially defined — missing some context',
      recommendation:
        'AI needs to know exactly what you are and where you operate. Clearly state your business type, service area, and specialties in plain language — not just in metadata.',
    })
  } else {
    items.push({
      label: 'Entity clarity',
      status: 'fail',
      value: 'Business type and location not clearly defined',
      recommendation:
        'Search engines and AI tools can\'t figure out what your business does or where it operates. State your business type, location, and what you specialize in clearly on the page.',
    })
  }

  // 6. Business description — can AI quickly understand what you do?
  const h1s = getAllTags(html, 'h1')
  const h1Text = h1s.map((h) => h.replace(/<[^>]+>/g, '')).join(' ').toLowerCase()
  const firstParagraphs = getAllTags(html, 'p')
    .slice(0, 5)
    .map((p) => p.replace(/<[^>]+>/g, ''))
    .join(' ')
    .toLowerCase()
  const earlyContent = h1Text + ' ' + firstParagraphs
  const descMeta = meta(html, 'description') ?? ''

  const hasServiceLanguage =
    /(we help|we provide|we offer|we build|we create|we specialize|i help|i provide|i build|our (service|solution|product|mission)|what we do|what i do|specializing in|dedicated to|serving|your\b.*\b(partner|team|expert|solution)|providing)/i.test(
      earlyContent,
    )
  const hasDescriptionMeta = descMeta.length > 30 &&
    /(service|product|solution|help|offer|provide|special|expert|consult|coach|therapy|agency|studio|shop|store|moving|clean|repair|design|marketing|law|dental|medical|real estate|insurance|financial|restaurant|salon|spa|construction|plumb|electric|landscap|photograph|catering|fitness|wellness|handcraft|custom|premium|professional)/i.test(descMeta)
  const hasSchemaDescription =
    jsonLdBlocks?.some((b) => /"description"/i.test(b)) ?? false
  const hasValueProp =
    /(help|grow|save|improve|transform|increase|reduce|solve|deliver|strategy|solution|service|product|business|studio|therapy|coaching|consulting|agency|moving|soap|craft|design|marketing|expert|professional|premier|trusted|leading|quality|custom)/i.test(
      h1Text,
    )

  const descSignals = [hasServiceLanguage, hasDescriptionMeta, hasSchemaDescription, hasValueProp].filter(
    Boolean,
  ).length

  if (descSignals >= 3) {
    items.push({
      label: 'Business description',
      status: 'pass',
      value: 'Clear value proposition found',
    })
  } else if (descSignals >= 1) {
    items.push({
      label: 'Business description',
      status: 'warn',
      value: 'Partially clear — AI may struggle to summarize what you do',
      recommendation:
        'AI tools need to quickly understand what your business does and who it serves. Make sure your headline, opening content, meta description, and schema all clearly state what you offer.',
    })
  } else {
    items.push({
      label: 'Business description',
      status: 'fail',
      value: 'No clear business description found',
      recommendation:
        'AI tools can\'t figure out what your business does. Your headline and opening content should clearly state what you offer and who you serve — in plain language, not marketing jargon.',
    })
  }

  // 7. AI site summary (llms.txt) — low weight, emerging standard
  const llmsTxt = page.llmsTxt?.trim() ?? ''
  if (llmsTxt.length > 50) {
    items.push({
      label: 'AI site summary (llms.txt)',
      status: 'pass',
      value: `Found (${llmsTxt.length.toLocaleString()} characters)`,
      extracted: truncate(llmsTxt, 200),
      weight: 0.25,
    })
  } else {
    items.push({
      label: 'AI site summary (llms.txt)',
      status: 'warn',
      value: 'No llms.txt found',
      weight: 0.25,
      recommendation:
        'llms.txt is an emerging standard that helps AI tools understand your site. It\'s a plain-text file at /llms.txt that describes what your site is about, what pages matter, and how to cite you — like a README for AI crawlers.',
    })
  }

  return items
}

/* ── 3. Structure ────────────────────────────────────────────────────── */

function parseStructure(page: FetchedPage): AuditItem[] {
  const { html } = page
  const items: AuditItem[] = []

  // 1. H1
  const h1s = getAllTags(html, 'h1')
  if (h1s.length === 0) {
    items.push({
      label: 'Main headline (H1)',
      status: 'fail',
      value: 'None found',
      recommendation:
        'Every page needs one main headline (H1) that tells visitors and search engines what the page is about. Add a clear, descriptive H1.',
    })
  } else if (h1s.length > 1) {
    const h1Texts = h1s.map((h) => {
      const text = h.replace(/<[^>]+>/g, '').trim()
      if (text) return truncate(text, 80)
      const imgAlt = attr(h.match(/<img[^>]*>/i)?.[0] ?? '', 'alt')
      return imgAlt ? `[image: ${truncate(imgAlt, 60)}]` : '[image only]'
    })
    items.push({
      label: 'Main headline (H1)',
      status: 'warn',
      value: `${h1s.length} found — should be 1`,
      extracted: h1Texts.join(' | '),
      recommendation:
        'Multiple H1 tags can confuse search engines about the main topic of your page. Use one H1 for the page title and H2s for sections.',
    })
  } else {
    const h1Text = h1s[0].replace(/<[^>]+>/g, '').trim()
    const displayText = h1Text
      || (attr(h1s[0].match(/<img[^>]*>/i)?.[0] ?? '', 'alt') ? `[image: ${attr(h1s[0].match(/<img[^>]*>/i)?.[0] ?? '', 'alt')}]` : '')
    items.push({
      label: 'Main headline (H1)',
      status: h1Text ? 'pass' : 'warn',
      value: h1Text ? '1 found' : '1 found — contains image only, no text',
      extracted: displayText ? truncate(displayText, 120) : undefined,
      recommendation: h1Text ? undefined : 'Your H1 contains an image but no text. Search engines rely on the H1 text to understand the main topic of your page. Add a text-based headline.',
    })
  }

  // 2. Heading structure (combines heading order + H2 presence)
  const headingRe = /<(h[1-6])\b[^>]*>/gi
  const headingLevels: number[] = []
  let hMatch
  while ((hMatch = headingRe.exec(html)) !== null) {
    headingLevels.push(parseInt(hMatch[1][1]))
  }
  const h2s = getAllTags(html, 'h2')

  let orderBroken = false
  let orderDetail = ''
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      orderBroken = true
      orderDetail = `H${headingLevels[i - 1]} → H${headingLevels[i]} (skipped a level)`
      break
    }
  }

  if (h2s.length === 0 && headingLevels.length < 2) {
    items.push({
      label: 'Heading structure',
      status: 'fail',
      value: 'No section headings found',
      recommendation:
        'Your page needs H2 headings to break content into sections. This helps both readers scan the page and search engines understand the structure.',
    })
  } else if (h2s.length === 0) {
    items.push({
      label: 'Heading structure',
      status: 'fail',
      value: 'No H2 section headings',
      recommendation:
        'H2 headings break your content into scannable sections. They help search engines understand the topics on your page. Add H2s for each major section.',
    })
  } else if (orderBroken) {
    items.push({
      label: 'Heading structure',
      status: 'warn',
      value: `${h2s.length} H2s found, but heading levels skip`,
      extracted: orderDetail,
      recommendation:
        'Headings should flow like an outline — H1, then H2, then H3. Skipping levels makes it harder for search engines to understand your content structure.',
    })
  } else {
    items.push({
      label: 'Heading structure',
      status: 'pass',
      value: `${h2s.length} H2s, proper hierarchy`,
      extracted: `Heading levels used: ${[...new Set(headingLevels)].sort().map((l) => `H${l}`).join(' → ')}`,
    })
  }

  // 3. Image descriptions (alt text) — percentage-based scoring
  const allImgs = getAllSelfClosing(html, 'img')
  const imgs = allImgs.filter(isRealImage)
  const imgsWithAlt = imgs.filter((img) => {
    const alt = attr(img, 'alt')
    return alt !== null && alt.trim() !== ''
  })
  const missingAlt = imgs.filter((img) => {
    const alt = attr(img, 'alt')
    return alt === null || alt.trim() === ''
  })

  if (imgs.length === 0) {
    items.push({
      label: 'Image descriptions',
      status: 'pass',
      value: 'No images found on page',
    })
  } else {
    const pct = imgsWithAlt.length / imgs.length
    const pctDisplay = Math.round(pct * 100)
    if (pct === 1) {
      items.push({
        label: 'Image descriptions',
        status: 'pass',
        value: `All ${imgs.length} images have descriptions`,
      })
    } else if (pctDisplay >= 50) {
      items.push({
        label: 'Image descriptions',
        status: 'warn',
        value: `${imgsWithAlt.length} of ${imgs.length} images have descriptions (${pctDisplay}%)`,
        score: pct,
        extracted: missingAlt
          .slice(0, 5)
          .map((img) => attr(img, 'src') ?? 'unknown')
          .map((s) => s.split('/').pop() ?? s)
          .join(', '),
        recommendation:
          'Screen readers and search engines can\'t "see" images without text descriptions (alt text). Adding them helps accessibility and can bring in traffic from image searches.',
      })
    } else {
      items.push({
        label: 'Image descriptions',
        status: 'fail',
        value: `Only ${imgsWithAlt.length} of ${imgs.length} images have descriptions (${pctDisplay}%)`,
        score: pct,
        extracted: missingAlt
          .slice(0, 5)
          .map((img) => attr(img, 'src') ?? 'unknown')
          .map((s) => s.split('/').pop() ?? s)
          .join(', '),
        recommendation:
          'Most of your images are missing alt text. This hurts accessibility and means search engines can\'t understand what your images show. Add a brief, descriptive alt attribute to each image.',
      })
    }
  }

  // 4. Content depth (moved from AI — it's about the page content itself)
  const words = wordCount(html)
  if (words >= 800) {
    items.push({
      label: 'Content depth',
      status: 'pass',
      value: `~${words.toLocaleString()} words`,
    })
  } else if (words >= 300) {
    items.push({
      label: 'Content depth',
      status: 'warn',
      value: `~${words.toLocaleString()} words — could go deeper`,
      recommendation:
        'Search engines and AI prefer pages with thorough, well-organized content. Expanding your key topics with more detail makes your page more likely to rank and get cited.',
    })
  } else {
    items.push({
      label: 'Content depth',
      status: 'fail',
      value: `~${words.toLocaleString()} words — thin content`,
      recommendation:
        'There isn\'t much content for search engines or AI to work with. Short pages rarely get cited or ranked well. Aim for comprehensive coverage of your main topics.',
    })
  }

  // 5. Internal links
  const linkRe = /<a\b[^>]*href=["']([^"']*)["'][^>]*>/gi
  let linkMatch
  const allLinks: string[] = []
  const internalLinks: string[] = []
  let parsedUrl: URL
  try {
    parsedUrl = new URL(page.url)
  } catch {
    parsedUrl = new URL('https://example.com')
  }

  while ((linkMatch = linkRe.exec(html)) !== null) {
    const href = linkMatch[1]
    allLinks.push(href)
    if (
      href.startsWith('/') ||
      href.startsWith('#') ||
      href.startsWith(parsedUrl.origin)
    ) {
      internalLinks.push(href)
    }
  }

  if (internalLinks.length >= 3) {
    items.push({
      label: 'Internal links',
      status: 'pass',
      value: `${internalLinks.length} links to your own pages`,
    })
  } else if (internalLinks.length > 0) {
    items.push({
      label: 'Internal links',
      status: 'warn',
      value: `Only ${internalLinks.length} internal link${internalLinks.length > 1 ? 's' : ''}`,
      recommendation:
        'Internal links help visitors navigate your site and help search engines discover more of your pages. Aim to link to other relevant pages from each page.',
    })
  } else {
    items.push({
      label: 'Internal links',
      status: 'fail',
      value: 'No internal links found',
      recommendation:
        'This page doesn\'t link to any other pages on your site. Internal links help search engines understand your site structure and help visitors find more of your content.',
    })
  }

  // 6. Link quality — check for obvious issues (can't fetch each link client-side)
  const suspiciousLinks = allLinks.filter(
    (href) =>
      href === '#' ||
      href === '' ||
      /^javascript:/i.test(href),
  )
  if (suspiciousLinks.length === 0) {
    items.push({
      label: 'Link quality',
      status: 'pass',
      value: `${allLinks.length} links checked — no obvious issues`,
    })
  } else {
    items.push({
      label: 'Link quality',
      status: 'warn',
      value: `${suspiciousLinks.length} link${suspiciousLinks.length > 1 ? 's' : ''} with empty or placeholder destinations`,
      recommendation:
        'Some links on your page don\'t go anywhere useful (empty href or # placeholder). These can frustrate visitors and signal low quality to search engines.',
    })
  }

  return items
}

/* ── 4. Social ───────────────────────────────────────────────────────── */

function parseSocial(page: FetchedPage): AuditItem[] {
  const { html } = page
  const items: AuditItem[] = []

  // 1. Share title (og:title)
  const ogTitle = meta(html, 'og:title')
  if (ogTitle) {
    items.push({
      label: 'Share title',
      status: 'pass',
      value: 'Set',
      extracted: `<meta property="og:title" content="${truncate(ogTitle, 120)}" />`,
    })
  } else {
    items.push({
      label: 'Share title',
      status: 'warn',
      value: 'Not set — will fall back to page title',
      recommendation:
        'When someone shares your link on social media, the share title controls the headline. Without og:title, platforms use your page title — which might not be optimized for social sharing.',
    })
  }

  // 2. Share description (og:description)
  const ogDesc = meta(html, 'og:description')
  if (ogDesc) {
    items.push({
      label: 'Share description',
      status: 'pass',
      value: 'Set',
      extracted: `<meta property="og:description" content="${truncate(ogDesc, 160)}" />`,
    })
  } else {
    items.push({
      label: 'Share description',
      status: 'warn',
      value: 'Not set',
      recommendation:
        'The share description appears under the title when your link is shared on Facebook, LinkedIn, or in messages. Add og:description to control what people see.',
    })
  }

  // 3. Share image (og:image)
  const ogImage = meta(html, 'og:image')
  if (ogImage) {
    items.push({
      label: 'Share image',
      status: 'pass',
      value: 'Set',
      extracted: `<meta property="og:image" content="${truncate(ogImage, 200)}" />`,
    })
  } else {
    items.push({
      label: 'Share image',
      status: 'fail',
      value: 'Missing',
      recommendation:
        'When someone shares your link, there\'s no image to show. Links with images get significantly more clicks. Add a 1200×630px image as your og:image.',
    })
  }

  // 4. Twitter card
  const twitterCard = meta(html, 'twitter:card')
  if (twitterCard) {
    items.push({
      label: 'X (Twitter) card',
      status: 'pass',
      value: `Type: ${twitterCard}`,
      extracted: `<meta name="twitter:card" content="${twitterCard}" />`,
    })
  } else {
    items.push({
      label: 'X (Twitter) card',
      status: 'warn',
      value: 'Not configured',
      recommendation:
        'Without a Twitter card tag, your links on X show up as plain text instead of a rich preview. Add: <meta name="twitter:card" content="summary_large_image" />',
    })
  }

  // 5. Open Graph type
  const ogType = meta(html, 'og:type')
  if (ogType) {
    items.push({
      label: 'Open Graph type',
      status: 'pass',
      value: `Type: ${ogType}`,
      extracted: `<meta property="og:type" content="${ogType}" />`,
    })
  } else {
    items.push({
      label: 'Open Graph type',
      status: 'warn',
      value: 'Not set — defaults to "website"',
      recommendation:
        'The og:type tag tells social platforms what kind of content this is — website, article, product, etc. Without it, platforms assume "website," which means blog posts and product pages won\'t get the right preview format. Add: <meta property="og:type" content="website" /> (or "article" for blog posts).',
    })
  }

  // 6. Social profiles
  const socialPatterns = [
    { name: 'Facebook', re: /facebook\.com\/(?!sharer)/i },
    { name: 'LinkedIn', re: /linkedin\.com\/(in|company)\//i },
    { name: 'X (Twitter)', re: /(twitter\.com|x\.com)\/(?!intent|share)/i },
    { name: 'Instagram', re: /instagram\.com\//i },
    { name: 'YouTube', re: /youtube\.com\/(c\/|channel\/|@)/i },
  ]
  const foundProfiles = socialPatterns.filter((p) => p.re.test(html))
  if (foundProfiles.length >= 3) {
    items.push({
      label: 'Social profiles',
      status: 'pass',
      value: `${foundProfiles.length} platforms linked`,
      extracted: `Found: ${foundProfiles.map((p) => p.name).join(', ')}`,
    })
  } else if (foundProfiles.length > 0) {
    const missing = socialPatterns.filter((p) => !foundProfiles.includes(p))
    items.push({
      label: 'Social profiles',
      status: 'warn',
      value: `${foundProfiles.length} of ${socialPatterns.length} major platforms linked`,
      extracted: `Found: ${foundProfiles.map((p) => p.name).join(', ')}\nMissing: ${missing.map((p) => p.name).join(', ')}`,
      recommendation:
        'Linking to your social profiles helps search engines connect your brand across the web and builds trust with visitors.',
    })
  } else {
    items.push({
      label: 'Social profiles',
      status: 'warn',
      value: 'No social profile links found',
      recommendation:
        'Adding links to your social media profiles helps search engines connect your website to your brand and strengthens your presence in search results.',
    })
  }

  return items
}

/* ── 5. Mobile ───────────────────────────────────────────────────────── */

function parseMobile(page: FetchedPage): AuditItem[] {
  const { html } = page
  const items: AuditItem[] = []

  // 1. Viewport
  const viewport = meta(html, 'viewport')
  if (viewport && /width=device-width/i.test(viewport)) {
    items.push({
      label: 'Viewport setup',
      status: 'pass',
      value: 'Configured correctly',
      extracted: `<meta name="viewport" content="${viewport}" />`,
    })
  } else if (viewport) {
    items.push({
      label: 'Viewport setup',
      status: 'warn',
      value: 'Set but may not be optimal',
      extracted: `<meta name="viewport" content="${viewport}" />`,
      recommendation:
        'Your viewport tag exists but doesn\'t include "width=device-width". This may cause your site to display incorrectly on mobile devices.',
    })
  } else {
    items.push({
      label: 'Viewport setup',
      status: 'fail',
      value: 'Missing',
      recommendation:
        'Without a viewport meta tag, mobile browsers will render your page at desktop width and shrink it down. Add: <meta name="viewport" content="width=device-width, initial-scale=1" />',
    })
  }

  // 2. Doctype
  const hasDoctype = /<!DOCTYPE\s+html>/i.test(html)
  items.push(
    hasDoctype
      ? { label: 'Doctype', status: 'pass' as Status, value: 'Valid HTML5 doctype' }
      : {
          label: 'Doctype',
          status: 'warn' as Status,
          value: 'Missing or non-standard doctype',
          recommendation:
            'A proper HTML5 doctype (<!DOCTYPE html>) ensures browsers render your page in standards mode. Without it, layout can break unpredictably.',
        },
  )

  // 3. Charset
  const charsetMeta = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)/i)
  if (charsetMeta) {
    items.push({
      label: 'Character encoding',
      status: 'pass',
      value: `${charsetMeta[1].toUpperCase()} declared`,
      extracted: `<meta charset="${charsetMeta[1]}" />`,
    })
  } else {
    items.push({
      label: 'Character encoding',
      status: 'warn',
      value: 'No charset declared',
      recommendation:
        'Without a character encoding declaration, browsers may display special characters incorrectly. Add: <meta charset="utf-8" /> in your <head>.',
    })
  }

  // 4. Tap target sizing — best-effort heuristic from HTML
  const smallButtons = getAllTags(html, 'button').filter((btn) => {
    const style = attr(btn, 'style') ?? ''
    const heightMatch = style.match(/height:\s*(\d+)px/i)
    return heightMatch && parseInt(heightMatch[1]) < 44
  })
  const smallLinks = html.match(
    /font-size:\s*(([0-9]|1[0-1])px|0\.\d+rem)/gi,
  )
  if (smallButtons.length > 0) {
    items.push({
      label: 'Tap target sizing',
      status: 'warn',
      value: `${smallButtons.length} small interactive element${smallButtons.length > 1 ? 's' : ''} detected`,
      recommendation:
        'On mobile, buttons and links should be at least 44×44px so they\'re easy to tap. Some elements on your page may be too small for comfortable mobile use.',
    })
  } else if (smallLinks && smallLinks.length > 3) {
    items.push({
      label: 'Tap target sizing',
      status: 'warn',
      value: 'Some very small text sizes detected',
      recommendation:
        'Very small text on mobile is hard to read and even harder to tap. Make sure interactive elements are at least 44×44px.',
    })
  } else {
    items.push({
      label: 'Tap target sizing',
      status: 'pass',
      value: 'No obvious issues detected',
    })
  }

  // 5. Text readability — check base font size
  const bodyFontSize = html.match(/body\s*{[^}]*font-size:\s*(\d+)px/i)
  const htmlFontSize = html.match(/html\s*{[^}]*font-size:\s*(\d+)px/i)
  const baseFontSize = bodyFontSize
    ? parseInt(bodyFontSize[1])
    : htmlFontSize
      ? parseInt(htmlFontSize[1])
      : null

  if (baseFontSize !== null && baseFontSize < 14) {
    items.push({
      label: 'Text readability',
      status: 'warn',
      value: `Base font size is ${baseFontSize}px`,
      recommendation:
        'A base font size under 14px can be hard to read on mobile. The recommended minimum is 16px for body text.',
    })
  } else if (baseFontSize !== null) {
    items.push({
      label: 'Text readability',
      status: 'pass',
      value: `Base font size is ${baseFontSize}px`,
    })
  } else {
    items.push({
      label: 'Text readability',
      status: 'pass',
      value: 'Using browser default font size',
    })
  }

  // 6. Image file formats — percentage-based scoring (moved from Structure)
  const allImgTags = getAllSelfClosing(html, 'img')
  const realImgs = allImgTags.filter(isRealImage)
  const imgSrcs = realImgs.map((img) => attr(img, 'src') ?? '').filter(Boolean)
  const legacyFormats = imgSrcs.filter((src) =>
    /\.(png|jpg|jpeg|gif|bmp|tiff)(\?|$)/i.test(src),
  )
  if (imgSrcs.length === 0) {
    items.push({
      label: 'Image file formats',
      status: 'pass',
      value: 'No images to evaluate',
    })
  } else if (legacyFormats.length === 0) {
    items.push({
      label: 'Image file formats',
      status: 'pass',
      value: 'All images use modern formats',
    })
  } else {
    const modernRatio = (imgSrcs.length - legacyFormats.length) / imgSrcs.length
    items.push({
      label: 'Image file formats',
      status: 'warn',
      value: `${legacyFormats.length} image${legacyFormats.length > 1 ? 's' : ''} using older formats`,
      score: Math.max(modernRatio, 0.25),
      extracted: legacyFormats
        .slice(0, 5)
        .map((s) => s.split('/').pop() ?? s)
        .join(', '),
      recommendation:
        'Some images use older file formats (PNG/JPG) that load slower on mobile. Converting to WebP or AVIF typically cuts file size 25–35% with no visible quality loss.',
    })
  }

  return items
}

/* ── 6. Security ─────────────────────────────────────────────────────── */

function parseSecurity(page: FetchedPage): AuditItem[] {
  const { html, url, isHttps, headers } = page
  const items: AuditItem[] = []

  // 1. HTTPS
  items.push(
    isHttps
      ? { label: 'HTTPS', status: 'pass' as Status, value: 'Secure connection', weight: 2 }
      : {
          label: 'HTTPS',
          status: 'fail' as Status,
          value: 'Not using HTTPS',
          weight: 2,
          recommendation:
            'Your site is not using a secure connection. Browsers mark HTTP sites as "Not Secure" and Google uses HTTPS as a ranking signal. Switch to HTTPS — most hosting providers offer free SSL certificates.',
        },
  )

  // 2. Safe external links
  const extLinkRe = /<a\b[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi
  const extLinks = [...html.matchAll(extLinkRe)].map((m) => m[0])
  let parsedOrigin: string
  try {
    parsedOrigin = new URL(url).origin
  } catch {
    parsedOrigin = ''
  }
  const trueExternal = extLinks.filter(
    (link) => !link.includes(parsedOrigin),
  )
  const unsafeExternal = trueExternal.filter(
    (link) => !/rel=["'][^"']*(noopener|noreferrer)/i.test(link),
  )

  if (trueExternal.length === 0) {
    items.push({
      label: 'Safe external links',
      status: 'pass',
      value: 'No external links to evaluate',
    })
  } else if (unsafeExternal.length === 0) {
    items.push({
      label: 'Safe external links',
      status: 'pass',
      value: `${trueExternal.length} external links — all secure`,
    })
  } else {
    items.push({
      label: 'Safe external links',
      status: 'warn',
      value: `${unsafeExternal.length} of ${trueExternal.length} external links missing a security tag`,
      recommendation:
        'Some outgoing links are missing a small security tag that prevents the linked page from interacting with yours. This is a minor technical fix — your developer or site builder can add it quickly.',
    })
  }

  // 3. Form action security
  const forms = getAllTags(html, 'form')
  const insecureForms = forms.filter((form) => {
    const action = attr(form, 'action') ?? ''
    return action.startsWith('http://')
  })
  if (forms.length === 0) {
    items.push({
      label: 'Form security',
      status: 'pass',
      value: 'No forms on page',
    })
  } else if (insecureForms.length === 0) {
    items.push({
      label: 'Form security',
      status: 'pass',
      value: `${forms.length} form${forms.length > 1 ? 's' : ''} checked — all secure`,
    })
  } else {
    items.push({
      label: 'Form security',
      status: 'fail',
      value: `${insecureForms.length} form${insecureForms.length > 1 ? 's' : ''} submitting over HTTP`,
      recommendation:
        'Forms submitting over HTTP send data without encryption — anything visitors type could be intercepted. Change form actions to use HTTPS.',
    })
  }

  // 4. Password fields
  const passwordFields = getAllSelfClosing(html, 'input').filter(
    (input) => attr(input, 'type')?.toLowerCase() === 'password',
  )
  if (passwordFields.length === 0) {
    items.push({
      label: 'Password field exposure',
      status: 'pass',
      value: 'No password fields on page',
    })
  } else if (isHttps) {
    items.push({
      label: 'Password field exposure',
      status: 'pass',
      value: `${passwordFields.length} password field${passwordFields.length > 1 ? 's' : ''} — protected by HTTPS`,
    })
  } else {
    items.push({
      label: 'Password field exposure',
      status: 'fail',
      value: 'Password fields on a non-HTTPS page',
      recommendation:
        'Password fields on an insecure page mean passwords are sent in plain text. This is a serious security issue. Switch to HTTPS immediately.',
    })
  }

  // 5. Content Security Policy
  const cspMeta = meta(html, 'Content-Security-Policy')
    ?? html.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i)
  const cspHeader = headers['content-security-policy']

  if (cspMeta || cspHeader) {
    items.push({
      label: 'Content security policy',
      status: 'pass',
      value: cspHeader ? 'Set via HTTP header' : 'Set via meta tag',
    })
  } else {
    items.push({
      label: 'Content security policy',
      status: 'warn',
      value: 'No CSP found',
      recommendation:
        'A Content Security Policy tells browsers which scripts and resources are allowed to run on your page. Without one, your site is more vulnerable to code injection. This is an advanced setting — ask your developer about it.',
    })
  }

  // 6. Privacy policy
  const privacyRe = /href=["'][^"']*(privacy|datenschutz|privacidad|legal|terms|policies\/privacy|cookie-policy)[^"']*["']/i
  const privacyTextRe = />([^<]*(privacy policy|privacy notice|cookie policy)[^<]*)</i
  const hasPrivacyLink = privacyRe.test(html) || privacyTextRe.test(html)
  if (hasPrivacyLink) {
    items.push({
      label: 'Privacy policy',
      status: 'pass',
      value: 'Privacy policy link found',
    })
  } else {
    items.push({
      label: 'Privacy policy',
      status: 'fail',
      value: 'No privacy policy link found',
      recommendation:
        'A privacy policy is legally required in most regions if you collect any visitor data (contact forms, analytics, cookies). It also builds trust. Add a link in your footer.',
    })
  }

  return items
}

/* ── 7. Accessibility ──────────────────────────────────────────────── */

function parseAccessibility(page: FetchedPage): AuditItem[] {
  const { html } = page
  const items: AuditItem[] = []

  // 1. Language attribute — <html lang="...">
  const langMatch = html.match(/<html[^>]*\slang=["']([^"']*)["']/i)
  if (langMatch && langMatch[1].trim()) {
    items.push({
      label: 'Language attribute',
      status: 'pass',
      value: `Language set: ${langMatch[1].trim()}`,
    })
  } else {
    items.push({
      label: 'Language attribute',
      status: 'fail',
      value: 'No language declared',
      recommendation:
        'Screen readers need to know what language your page is in to pronounce words correctly. Add lang="en" (or your language) to the <html> tag.',
    })
  }

  // 2. Skip navigation link
  const hasSkipLink =
    /href=["']#(main|content|main-content|maincontent|skip)["']/i.test(html) ||
    /class=["'][^"']*(skip|sr-only|visually-hidden)[^"']*["'][^>]*>.*?(skip|jump|go) to/i.test(html)
  if (hasSkipLink) {
    items.push({
      label: 'Skip navigation',
      status: 'pass',
      value: 'Skip link found',
    })
  } else {
    items.push({
      label: 'Skip navigation',
      status: 'warn',
      value: 'No skip navigation link',
      recommendation:
        'Keyboard users have to tab through every menu link to reach your content. A "Skip to content" link at the top of the page lets them jump straight to what matters.',
    })
  }

  // 3. ARIA landmarks — <main>, <nav>, <header>, <footer>, role attributes
  const hasMain = /<main[\s>]/i.test(html) || /role=["']main["']/i.test(html)
  const hasNav = /<nav[\s>]/i.test(html) || /role=["']navigation["']/i.test(html)
  const hasHeader = /<header[\s>]/i.test(html) || /role=["']banner["']/i.test(html)
  const hasFooter = /<footer[\s>]/i.test(html) || /role=["']contentinfo["']/i.test(html)
  const landmarks = [
    hasMain && 'main',
    hasNav && 'nav',
    hasHeader && 'header',
    hasFooter && 'footer',
  ].filter(Boolean) as string[]

  if (landmarks.length >= 3) {
    items.push({
      label: 'Page landmarks',
      status: 'pass',
      value: `${landmarks.length} landmark regions found`,
      extracted: landmarks.join(', '),
    })
  } else if (landmarks.length >= 1) {
    items.push({
      label: 'Page landmarks',
      status: 'warn',
      value: `Only ${landmarks.length} landmark region${landmarks.length > 1 ? 's' : ''} found`,
      extracted: landmarks.join(', '),
      recommendation:
        'Screen readers use landmark regions (<main>, <nav>, <header>, <footer>) to let users jump between sections of your page. Adding more landmarks makes your site easier to navigate.',
    })
  } else {
    items.push({
      label: 'Page landmarks',
      status: 'fail',
      value: 'No landmark regions found',
      recommendation:
        'Without landmarks, screen reader users have no way to jump between sections of your page. Use semantic HTML tags like <main>, <nav>, <header>, and <footer> to define the structure.',
    })
  }

  // 4. Form labels — inputs should have associated <label> elements
  const inputs = getAllSelfClosing(html, 'input')
  const formInputs = inputs.filter((inp) => {
    const type = attr(inp, 'type')?.toLowerCase() ?? 'text'
    // Skip hidden, submit, button, image — they don't need visible labels
    if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) return false
    // Skip aria-hidden inputs (honeypots, decorative)
    if (attr(inp, 'aria-hidden') === 'true') return false
    return true
  })

  if (formInputs.length === 0) {
    items.push({
      label: 'Form labels',
      status: 'pass',
      value: 'No form inputs to check',
    })
  } else {
    // Check each input for label association (id+for, aria-label, aria-labelledby, title, placeholder)
    let labeled = 0
    for (const inp of formInputs) {
      const id = attr(inp, 'id')
      const ariaLabel = attr(inp, 'aria-label')
      const ariaLabelledby = attr(inp, 'aria-labelledby')
      const title = attr(inp, 'title')
      const hasForLabel = id
        ? new RegExp(`<label[^>]*\\sfor=["']${escRe(id)}["']`, 'i').test(html)
        : false
      // Wrapping label (label > input)
      const hasWrappingLabel = id
        ? new RegExp(`<label[^>]*>[\\s\\S]*?id=["']${escRe(id)}["'][\\s\\S]*?</label>`, 'i').test(html)
        : false

      if (hasForLabel || hasWrappingLabel || ariaLabel || ariaLabelledby || title) {
        labeled++
      }
    }

    const ratio = labeled / formInputs.length
    if (ratio >= 1) {
      items.push({
        label: 'Form labels',
        status: 'pass',
        value: `All ${formInputs.length} input${formInputs.length > 1 ? 's' : ''} labeled`,
      })
    } else if (ratio >= 0.5) {
      items.push({
        label: 'Form labels',
        status: 'warn',
        value: `${labeled} of ${formInputs.length} inputs labeled`,
        score: Math.max(ratio, 0.25),
        recommendation:
          'Some form fields are missing labels. Screen readers announce the label when a user focuses an input — without one, they have no idea what to type. Add a <label> with a matching "for" attribute, or use aria-label.',
      })
    } else {
      items.push({
        label: 'Form labels',
        status: 'fail',
        value: labeled === 0 ? 'No inputs have labels' : `Only ${labeled} of ${formInputs.length} inputs labeled`,
        score: Math.max(ratio, 0),
        recommendation:
          'Form fields need labels so screen reader users know what information to enter. Add a <label> element with a "for" attribute matching each input\'s "id", or add an aria-label attribute directly.',
      })
    }
  }

  // 5. Link purpose — generic link text like "click here", "read more", "learn more"
  const linkRe = /<a\b[^>]*>([\s\S]*?)<\/a>/gi
  const links: string[] = []
  let linkMatch
  while ((linkMatch = linkRe.exec(html)) !== null) {
    const text = linkMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase()
    if (text) links.push(text)
  }
  const genericPhrases = /^(click here|here|read more|more|learn more|link|this|click|go|download|submit|info|details|page)$/i
  const genericLinks = links.filter((t) => genericPhrases.test(t))

  if (links.length === 0) {
    items.push({
      label: 'Link purpose',
      status: 'pass',
      value: 'No links to check',
    })
  } else if (genericLinks.length === 0) {
    items.push({
      label: 'Link purpose',
      status: 'pass',
      value: 'All links have descriptive text',
    })
  } else if (genericLinks.length <= 2) {
    items.push({
      label: 'Link purpose',
      status: 'warn',
      value: `${genericLinks.length} generic link${genericLinks.length > 1 ? 's' : ''} found`,
      extracted: [...new Set(genericLinks)].map((t) => `"${t}"`).join(', '),
      recommendation:
        'Screen reader users often navigate by tabbing through links. Generic text like "click here" or "read more" tells them nothing about where the link goes. Use descriptive text like "view our pricing" or "read the case study."',
    })
  } else {
    items.push({
      label: 'Link purpose',
      status: 'fail',
      value: `${genericLinks.length} generic links found`,
      extracted: [...new Set(genericLinks)].slice(0, 5).map((t) => `"${t}"`).join(', '),
      recommendation:
        'Too many links use generic text like "click here" or "read more." Screen readers announce link text out of context — a user tabbing through links would just hear "click here, click here, read more." Make each link describe its destination.',
    })
  }

  // 6. Focus visibility — detecting outline:none or outline:0 that kills focus indicators
  const styleBlocks = getAllTags(html, 'style')
  const allStyles = styleBlocks.join(' ')
  const killsFocus =
    /outline\s*:\s*(none|0)\b/i.test(allStyles) &&
    !/outline\s*:\s*(none|0)[^}]*focus-visible/i.test(allStyles)
  // Check for :focus { outline: none } pattern without a replacement
  const focusOutlineKill = /:focus\s*\{[^}]*outline\s*:\s*(none|0)/i.test(allStyles)
  const hasFocusVisible = /focus-visible/i.test(allStyles)

  if (focusOutlineKill && !hasFocusVisible) {
    items.push({
      label: 'Focus indicators',
      status: 'fail',
      value: 'Focus outlines removed in CSS',
      recommendation:
        'Keyboard users rely on focus outlines to see which element is selected. Removing them with outline:none makes your site unusable for anyone not using a mouse. If the default outline doesn\'t match your design, replace it with a custom focus style — don\'t remove it.',
    })
  } else if (killsFocus && !hasFocusVisible) {
    items.push({
      label: 'Focus indicators',
      status: 'warn',
      value: 'Some outlines removed — verify focus is still visible',
      recommendation:
        'Your CSS removes outlines in some places. Make sure keyboard users can still see which element is focused. Consider using :focus-visible to show outlines only for keyboard navigation.',
    })
  } else {
    items.push({
      label: 'Focus indicators',
      status: 'pass',
      value: hasFocusVisible ? 'Custom focus styles detected' : 'Default focus indicators intact',
    })
  }

  return items
}

/* ── Main Parser ─────────────────────────────────────────────────────── */

export function parseAudit(page: FetchedPage): ParsedAuditResult {
  return {
    url: page.url,
    categories: [
      { name: 'Search', items: parseSearch(page) },
      { name: 'AI', items: parseAI(page) },
      { name: 'Social', items: parseSocial(page) },
      { name: 'Mobile', items: parseMobile(page) },
      { name: 'Structure', items: parseStructure(page) },
      { name: 'Security', items: parseSecurity(page) },
      { name: 'Accessibility', items: parseAccessibility(page) },
    ],
  }
}
