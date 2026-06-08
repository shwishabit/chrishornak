/* ── Real HTML Audit Parser ───────────────────────────────────────────────
 *
 * Accepts raw HTML + metadata from the fetch-url API and runs checks
 * across 7 categories. Returns plain data (no React nodes) —
 * the component maps category names to icons.
 *
 * Categories (in order):
 *   Search (10) · AI (8) · Social (6) · Mobile (6) · Structure (7) · Accessibility (6) · Security (7)
 *
 * Harmful-signal checks (these actively hurt findability):
 *   noindex/nofollow (zeros Search), conflicting canonicals, meta refresh,
 *   hidden text, mixed content, internal nofollow, blocked CSS/JS
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
  /** Concatenated CSS from linked external stylesheets — capped by route.ts.
   * Optional for backwards compat; checks that need it should fall back to inline `<style>` only. */
  externalCss?: string
  /** Direct-fetch result for the page's og:image, performed by route.ts using
   * a Facebook-like UA and manual redirect handling. Lets us distinguish
   * "og:image is in the markup" (current Share image check) from "og:image
   * actually serves as an image to social scrapers" (Share image reachability).
   * Optional — undefined when no og:image was in markup, or when the fetch failed. */
  ogImage?: {
    url: string
    status?: number
    redirected?: boolean
    contentType?: string
  }
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

  // 1. Indexability (critical — noindex or nofollow zeros the category)
  const robotsMeta = meta(html, 'robots') ?? ''
  const isNoindex = /noindex/i.test(robotsMeta)
  const isNofollow = /nofollow/i.test(robotsMeta)

  if (isNoindex) {
    items.push({
      label: 'Indexability',
      status: 'fail',
      value: 'Page is blocked from indexing',
      extracted: `<meta name="robots" content="${robotsMeta}" />`,
      weight: 2,
      recommendation:
        'Your page has a "noindex" tag, which tells Google not to show it in search results. If this page should be findable, remove the noindex directive.',
    })
  } else if (isNofollow) {
    items.push({
      label: 'Indexability',
      status: 'fail',
      value: 'Page blocks all link following',
      extracted: `<meta name="robots" content="${robotsMeta}" />`,
      weight: 2,
      recommendation:
        'Your page has a "nofollow" directive, which tells Google not to follow any links on this page. This kills your internal linking structure and prevents Google from discovering your other pages. Remove the nofollow directive.',
    })
  } else {
    items.push({
      label: 'Indexability',
      status: 'pass',
      value: 'Page is indexable',
      extracted: robotsMeta
        ? `<meta name="robots" content="${robotsMeta}" />`
        : 'No robots meta tag found (defaults to indexable)',
      weight: 2,
    })
  }

  // 2. Page title (high weight — most visible element in search results)
  //    Graduated scoring: ≤60 pass, 61-80 warn (sliding score), >80 fail
  //    Also flags generic titles ("Homepage") and too-short titles
  const title = getTag(html, 'title')
  const isGenericTitle = title
    ? /^(home\s*page|welcome|untitled|website|my site|site title|page title)$/i.test(title.trim())
    : false

  if (!title) {
    items.push({
      label: 'Page title',
      status: 'fail',
      value: 'Missing',
      weight: 1.5,
      recommendation:
        'The page title is the first thing people see in search results and browser tabs. Every page needs a clear, descriptive title.',
    })
  } else if (isGenericTitle) {
    items.push({
      label: 'Page title',
      status: 'fail',
      value: `Generic title: "${title}"`,
      extracted: `<title>${title}</title>`,
      weight: 1.5,
      recommendation:
        'Your title says "' + title + '" — that tells search engines and visitors nothing about what this page is. Replace it with a clear, specific title that describes your business or the page content.',
    })
  } else if (title.length < 15) {
    items.push({
      label: 'Page title',
      status: 'warn',
      value: `${title.length} characters — too short to be descriptive`,
      extracted: `<title>${title}</title>`,
      weight: 1.5,
      recommendation:
        'Your title is very short. A good page title tells searchers exactly what this page is about and why they should click. Aim for 30–60 characters.',
    })
  } else if (title.length > 80) {
    items.push({
      label: 'Page title',
      status: 'fail',
      value: `${title.length} characters — will be heavily truncated`,
      extracted: `<title>${truncate(title, 120)}</title>`,
      weight: 1.5,
      recommendation: 'Your title is way too long — Google will cut it off and visitors won\'t see your full message. Aim for under 60 characters.',
    })
  } else if (title.length > 60) {
    const titleScore = Math.max((80 - title.length) / 20, 0.1)
    items.push({
      label: 'Page title',
      status: 'warn',
      value: title.length <= 65
        ? `${title.length} characters — slightly over, but likely fine`
        : `${title.length} characters — may be truncated in search results`,
      extracted: `<title>${truncate(title, 120)}</title>`,
      score: titleScore,
      weight: 1.5,
      recommendation: title.length <= 65
        ? 'Your title is a few characters over the ideal 60-character limit. It\'ll probably display fine, but trimming it slightly would be safer.'
        : 'Keep your title under 60 characters so it displays fully in search results.',
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

  // 3. Page description — graduated scoring like title
  const desc = meta(html, 'description')
  if (!desc) {
    items.push({
      label: 'Page description',
      status: 'fail',
      value: 'Missing',
      recommendation:
        'The meta description is the short summary that appears under your link in Google. Without one, Google will pick a random snippet from your page. Add a compelling 120–160 character description.',
    })
  } else if (desc.length > 220) {
    items.push({
      label: 'Page description',
      status: 'fail',
      value: `${desc.length} characters — will be heavily truncated`,
      extracted: `<meta name="description" content="${truncate(desc, 200)}" />`,
      recommendation:
        'Your description is far too long — Google will cut it off and the message won\'t land. Aim for 120–160 characters.',
    })
  } else if (desc.length > 160) {
    const descScore = Math.max((220 - desc.length) / 60, 0.1)
    items.push({
      label: 'Page description',
      status: 'warn',
      value: desc.length <= 170
        ? `${desc.length} characters — slightly over, but likely fine`
        : `${desc.length} characters — may be cut off in search results`,
      extracted: `<meta name="description" content="${truncate(desc, 200)}" />`,
      score: descScore,
      recommendation: desc.length <= 170
        ? 'Your description is a few characters over the ideal 160-character limit. It\'ll probably display fine, but trimming it slightly would be safer.'
        : 'This is the short summary under your link in Google. Keep it under 160 characters so it doesn\'t get cut off.',
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

  // 4. Canonical URL — check for missing, conflicting, or self-referencing
  const canonicalRe1 = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/gi
  const canonicalRe2 = /<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/gi
  const canonicalUrls = new Set<string>()
  let cMatch
  while ((cMatch = canonicalRe1.exec(html)) !== null) canonicalUrls.add(cMatch[1])
  while ((cMatch = canonicalRe2.exec(html)) !== null) canonicalUrls.add(cMatch[1])

  if (canonicalUrls.size > 1) {
    items.push({
      label: 'Canonical URL',
      status: 'fail',
      value: `${canonicalUrls.size} conflicting canonical tags`,
      extracted: [...canonicalUrls].join(' vs '),
      weight: 1.5,
      recommendation:
        'Your page has multiple canonical tags pointing to different URLs. This sends contradictory signals to Google — it\'s worse than having no canonical at all. Remove the extras and keep one.',
    })
  } else if (canonicalUrls.size === 1) {
    const canonical = [...canonicalUrls][0]
    items.push({
      label: 'Canonical URL',
      status: 'pass',
      value: 'Set',
      extracted: `<link rel="canonical" href="${canonical}" />`,
    })
  } else {
    items.push({
      label: 'Canonical URL',
      status: 'warn',
      value: 'Not set',
      recommendation:
        'A canonical tag tells search engines which version of a page is the main one. Most single-page sites work fine without one, but it\'s good practice — especially if your content is accessible at multiple URLs.',
    })
  }

  // 5. Crawl permissions (robots.txt) + search engine specific blocks
  // Parse robots.txt blocks by user-agent
  const robotsBlocks = robotsTxt
    ? robotsTxt.split(/(?=User-agent:)/i).map((block) => {
        const agentMatch = block.match(/User-agent:\s*(.+)/i)
        const agent = agentMatch?.[1]?.trim().toLowerCase() ?? ''
        const hasDisallow = /Disallow:\s*\/\s*$/m.test(block)
        return { agent, hasDisallow, block }
      })
    : []

  const blanketDisallow = robotsBlocks.some((b) => b.agent === '*' && b.hasDisallow)
  // A blanket "Disallow: /" is overridden for Google if Googlebot has its own
  // block that doesn't disallow — a common "block everyone, allow Google" posture.
  const googlebotAllowed = robotsBlocks.some((b) => b.agent === 'googlebot' && !b.hasDisallow)
  const blocksCssJs = robotsTxt ? /Disallow:.*\.(css|js)/im.test(robotsTxt) : false

  // Check for search-engine-specific blocks. Distinguish essential search engines
  // (Google/Bing/Apple — losing these kills findability for an English-speaking
  // audience) from "foreign" / aggressive bots (Yandex, Baidu, AI scrapers) that
  // many US sites legitimately block as part of normal posture.
  const essentialSearchBots = ['googlebot', 'bingbot', 'applebot']
  const blockedEssential = essentialSearchBots.filter((bot) =>
    robotsBlocks.some((b) => b.agent === bot && b.hasDisallow),
  )

  if (blanketDisallow && !googlebotAllowed) {
    items.push({
      label: 'Crawl permissions',
      status: 'fail',
      value: 'robots.txt blocks all crawlers',
      extracted: truncate(robotsTxt, 300),
      recommendation:
        'Your robots.txt is telling search engines not to crawl your site. If your site should be findable, change "Disallow: /" to "Allow: /".',
    })
  } else if (blockedEssential.length > 0) {
    items.push({
      label: 'Crawl permissions',
      status: 'fail',
      value: `robots.txt blocks ${blockedEssential.join(', ')}`,
      extracted: truncate(robotsTxt, 300),
      weight: 1.5,
      recommendation:
        `Your robots.txt is specifically blocking ${blockedEssential.join(' and ')} from crawling your site. If this isn't intentional, remove the Disallow rules for ${blockedEssential.length > 1 ? 'these crawlers' : 'this crawler'}.`,
    })
  } else if (blocksCssJs) {
    // Google renders JS and usually recovers fine; this is worth flagging but is
    // rarely the catastrophe a hard FAIL implies.
    items.push({
      label: 'Crawl permissions',
      status: 'warn',
      weight: 0.5,
      value: 'robots.txt blocks some CSS or JavaScript files',
      extracted: truncate(robotsTxt, 300),
      recommendation:
        'Your robots.txt blocks Google from loading some CSS or JavaScript. Google can usually still render the page, but to be safe it should see your styles and scripts — remove any lines disallowing .css and .js files.',
    })
  } else {
    items.push({
      label: 'Crawl permissions',
      status: 'pass',
      value: 'robots.txt allows crawling',
      extracted: truncate(robotsTxt, 300),
    })
  }

  if (!robotsTxt) {
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
      // Cross-domain redirects often reflect intentional brand consolidation
      // (rebrand, parent company, mergers) rather than misconfiguration.
      // Surface as info-weighted, with copy that doesn't presume a problem.
      const issues: string[] = []
      if (unexpectedHostChange) issues.push(`${reqUrl.hostname} → ${finUrl.hostname}`)
      if (unexpectedPathChange) issues.push('path changed')
      items.push({
        label: 'URL redirects',
        status: 'warn',
        value: `Redirects to a different URL (${issues.join(', ')})`,
        extracted: `${page.requestedUrl} → ${page.url}`,
        recommendation:
          'Your URL redirects to a different destination — this is often intentional (rebrand, parent company). If so, no action needed. If unexpected, make sure your links point directly to the final URL so SEO signals don\'t dilute through a hop.',
        weight: 0.3,
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

  // 8. Response time — single-shot measurement, so noisy by definition.
  // Cold-start hosting can spike a single fetch by 5-10 seconds even on
  // healthy sites. Thresholds widened + copy now flags the methodology.
  // Weight 0.5 — influenced by network and server factors outside the page.
  const ms = page.responseTimeMs
  if (ms < 1500) {
    items.push({
      label: 'Response time',
      status: 'pass',
      value: `${ms}ms (single request)`,
      weight: 0.5,
    })
  } else if (ms < 5000) {
    items.push({
      label: 'Response time',
      status: 'warn',
      value: `${ms}ms — slower than ideal (single request)`,
      recommendation:
        'Your page took over 1.5 seconds to respond on a single test request. Could be a cold start, a slow database query, or a hosting issue. Re-run the audit a few times — if the number is consistent, it\'s worth investigating with your hosting provider.',
      weight: 0.5,
    })
  } else {
    items.push({
      label: 'Response time',
      status: 'fail',
      value: `${ms}ms — too slow (single request — could be cold start)`,
      recommendation:
        'Your page took over 5 seconds to respond. This is severe enough to hurt SEO and user experience even if it\'s a cold-start outlier. Re-run a couple times to confirm — if it\'s consistent, talk to your hosting provider about server performance, caching, or a faster plan.',
      weight: 0.5,
    })
  }

  // 9. Meta refresh redirect — outdated, harmful to SEO
  const metaRefresh = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["']([^"']*)["']/i)
  if (metaRefresh) {
    const content = metaRefresh[1]
    const hasRedirect = /url=/i.test(content)
    if (hasRedirect) {
      items.push({
        label: 'Meta refresh redirect',
        status: 'fail',
        value: 'Page uses meta refresh to redirect',
        extracted: `<meta http-equiv="refresh" content="${truncate(content, 100)}" />`,
        weight: 1.5,
        recommendation:
          'Your page uses a meta refresh tag to redirect visitors. This is an outdated technique that search engines handle poorly — it can split your link equity and confuse crawlers. Use a server-side 301 redirect instead.',
      })
    }
  }

  // 10. Hidden text patterns — potential search engine penalty
  const styleBlocks = getAllTags(html, 'style')
  const inlineStyles = styleBlocks.join(' ')
  // Look for suspicious patterns: display:none with large text blocks, font-size:0, text-indent off-screen
  const hasHiddenTextCSS =
    /display\s*:\s*none[^}]*\{[^}]*\b(keyword|seo|tag)/i.test(inlineStyles) ||
    /font-size\s*:\s*0(?:px|em|rem|%)?[^}]*[a-z]{20,}/i.test(inlineStyles)
  // Check for large hidden divs with lots of text content
  const hiddenDivs = html.match(/<div[^>]*style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>[\s\S]{500,}?<\/div>/gi)
  const hasHiddenTextBlock = hiddenDivs?.some((div) => {
    const text = div.replace(/<[^>]+>/g, '').trim()
    // If the hidden block has 200+ characters of text, it's suspicious
    // (skip if it looks like a menu/nav — those legitimately use display:none)
    return text.length > 200 && !/nav|menu|modal|dialog|dropdown|accordion|tab/i.test(div)
  }) ?? false

  if (hasHiddenTextCSS || hasHiddenTextBlock) {
    items.push({
      label: 'Hidden text',
      status: 'fail',
      value: 'Suspicious hidden text detected',
      weight: 2,
      recommendation:
        'Your page appears to have large blocks of hidden text. Google has penalized sites for hiding text from visitors while showing it to crawlers. If this is intentional (like accordion content), make sure it\'s accessible via user interaction, not permanently hidden.',
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
  // Native disclosure pattern — <details><summary>Question?</summary>... — is
  // the most accessible no-JS FAQ. Question word inside <summary> isn't required;
  // the trailing "?" is the signal, matching the threshold for hasQAPatterns.
  const hasDetailsFaq = /<details\b[\s\S]*?<summary\b[^>]*>[\s\S]*?\?[\s\S]*?<\/summary>/i.test(html)

  if (hasFaqSchema) {
    items.push({
      label: 'Answerable content',
      status: 'pass',
      value: 'FAQ schema found',
    })
  } else if (hasQAPatterns || hasFaqHtml || hasDetailsFaq) {
    items.push({
      label: 'Answerable content',
      status: 'pass',
      value: 'Q&A-style content found',
    })
  } else {
    // Most small business homepages aren't supposed to be FAQ-style. Lower the
    // weight and soften the copy so this reads as an opportunity, not a defect.
    items.push({
      label: 'Answerable content',
      status: 'warn',
      value: 'No Q&A content found',
      weight: 0.5,
      recommendation:
        'If your business answers common questions ("how does X work?", "what does Y cost?"), adding a FAQ section makes it easier for AI tools like ChatGPT to cite your page. For visual-led or service businesses where this isn\'t a fit, you can ignore this.',
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
  } else {
    // Original data / stats / quotes are publisher traits. Most local and service
    // businesses (the majority of sites) legitimately won't have them, so this is
    // informational (weight 0) — it surfaces as an opportunity without penalizing.
    items.push({
      label: 'Citability',
      status: 'pass',
      weight: 0,
      value:
        citabilitySignals === 1
          ? 'Some citable content — optional to expand'
          : 'No original data found — optional for service businesses',
      recommendation:
        'AI tools are more likely to cite pages with original data, specific stats, or quotable statements. This is optional — most service and local businesses don\'t need it — but if you have results, numbers, or expert opinions worth sharing, surfacing them on the homepage helps AI cite you.',
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
    /(we help|we provide|we offer|we build|we create|we specialize|we write|we ship|we publish|we draft|we author|we edit|we produce|i help|i provide|i build|i write|our (service|solution|product|mission)|what we do|what i do|specializing in|dedicated to|serving|your\b.*\b(partner|team|expert|solution)|providing)/i.test(
      earlyContent,
    )
  const hasDescriptionMeta = descMeta.length > 30 &&
    /(service|product|solution|help|offer|provide|special|expert|consult|coach|therapy|agency|studio|shop|store|moving|clean|repair|design|marketing|law|dental|medical|real estate|insurance|financial|restaurant|salon|spa|construction|plumb|electric|landscap|photograph|catering|fitness|wellness|handcraft|custom|premium|professional|blog|content|writing|writer|copywriter|editorial|publishing|publisher|ghostwrit|newsletter|magazine|publication|market|grocer|grocery|butcher|meat|deli|bakery|brewery|brewing|distiller|winery|cafe|coffee|diner|grill|tavern|pizz|auto|automotive|tire|dealer|jewel|furniture|mattress|hardware|supply|lumber|veterinar|animal|pet|groom|barber|nail|tattoo|gym|academy|dance|optical|optometr|vision|chiropract|pharmac|florist|funeral|hotel|motel|inn|equipment|hvac|heating|cooling|roofing|flooring|bank|union)/i.test(descMeta)
  const hasSchemaDescription =
    jsonLdBlocks?.some((b) => /"description"/i.test(b)) ?? false
  const hasValueProp =
    /(help|grow|save|improve|transform|increase|reduce|solve|deliver|strategy|solution|service|product|business|studio|therapy|coaching|consulting|agency|moving|soap|craft|design|marketing|expert|professional|premier|trusted|leading|quality|custom|market|grocer|butcher|meat|deli|bakery|brew|cafe|coffee|diner|grill|pizz|auto|tire|dealer|jewel|furniture|mattress|hardware|lumber|veterinar|animal|pet|groom|barber|salon|gym|dental|dentist|optical|chiropract|pharmac|florist|funeral|hotel|inn|repair|write|writing|content|publish)/i.test(
      h1Text,
    )

  const descSignals = [hasServiceLanguage, hasDescriptionMeta, hasSchemaDescription, hasValueProp].filter(
    Boolean,
  ).length

  if (descSignals >= 2) {
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

  // 7. AI crawler access — check if robots.txt blocks AI crawlers
  const aiCrawlers = [
    { name: 'GPTBot', agent: 'gptbot' },
    { name: 'ClaudeBot', agent: 'claudebot' },
    { name: 'Google-Extended', agent: 'google-extended' },
    { name: 'CCBot', agent: 'ccbot' },
    { name: 'PerplexityBot', agent: 'perplexitybot' },
    { name: 'Bytespider', agent: 'bytespider' },
  ]

  if (page.robotsTxt) {
    const aiRobotsBlocks = page.robotsTxt.split(/(?=User-agent:)/i).map((block) => {
      const agentMatch = block.match(/User-agent:\s*(.+)/i)
      const agent = agentMatch?.[1]?.trim().toLowerCase() ?? ''
      const hasDisallow = /Disallow:\s*\/\s*$/m.test(block)
      return { agent, hasDisallow }
    })

    const blockedAI = aiCrawlers.filter((crawler) =>
      aiRobotsBlocks.some((b) => b.agent === crawler.agent && b.hasDisallow),
    )

    if (blockedAI.length >= 4) {
      items.push({
        label: 'AI crawler access',
        status: 'fail',
        value: `Blocking ${blockedAI.length} AI crawlers`,
        extracted: blockedAI.map((c) => c.name).join(', '),
        weight: 1.5,
        recommendation:
          'Your robots.txt is blocking most AI crawlers from accessing your site. This means ChatGPT, Claude, Perplexity, and other AI tools can\'t read your content — and can\'t recommend your business. If you want to be found by AI, remove these blocks.',
      })
    } else if (blockedAI.length > 0) {
      items.push({
        label: 'AI crawler access',
        status: 'warn',
        value: `Blocking ${blockedAI.length} AI crawler${blockedAI.length > 1 ? 's' : ''}`,
        extracted: blockedAI.map((c) => c.name).join(', '),
        recommendation:
          `Your robots.txt blocks ${blockedAI.map((c) => c.name).join(' and ')} from reading your site. These AI tools can\'t recommend you if they can\'t see your content. If this is intentional, you\'re trading AI visibility for content control.`,
      })
    }
  }

  // 8. AI site summary (llms.txt) — low weight, emerging standard
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
    // Emerging, optional standard almost no site has yet. Informational only
    // (weight 0, no warning) — it surfaces as an opportunity, not a defect.
    items.push({
      label: 'AI site summary (llms.txt)',
      status: 'pass',
      value: 'No llms.txt — optional, emerging standard',
      weight: 0,
      recommendation:
        'llms.txt is an emerging, optional standard that helps AI tools understand your site. It\'s a plain-text file at /llms.txt that describes what your site is about, what pages matter, and how to cite you — like a README for AI crawlers. Worth adding as the standard matures, but not a problem to skip today.',
    })
  }

  return items
}

/* ── 3. Structure ────────────────────────────────────────────────────── */

function parseStructure(page: FetchedPage): AuditItem[] {
  const { html } = page
  const items: AuditItem[] = []

  // 0. Page rendering — detect cases where the initial HTML doesn't reflect what
  // visitors actually see. Two distinct classes:
  //   (a) SPA shell — React/Next/Vue/Angular mount point + thin body. Real content
  //       arrives via JavaScript, so most structural checks below will look broken.
  //   (b) JS redirect — tiny HTML containing window.location.href = "...". The audit
  //       ran on the redirect stub, not the destination. Search engines also struggle.
  // Both warn at weight 0 (informational, no score impact) so users understand why
  // results may look incorrect.
  const visibleWords = wordCount(html)
  const spaSignals = [
    /<div\s+id=["'](root|app|__next|__nuxt|svelte)["']/i,
    /__NEXT_DATA__/,
    /window\.__NUXT__/,
    /window\.__INITIAL_STATE__/,
    /data-reactroot/i,
    /ng-version=/i,
    /data-v-app/i,
    /<div\s+data-server-rendered/i,
  ]
  const matchedSpaSignals = spaSignals.filter((re) => re.test(html)).length
  const jsRedirect =
    /window\.location\.(href|replace|assign)\s*=/i.test(html) ||
    /<meta\s+http-equiv=["']refresh["']/i.test(html)
  const looksLikeShell = matchedSpaSignals >= 1 && visibleWords < 50
  const looksLikeJsRedirect = jsRedirect && html.length < 600 && visibleWords < 30

  if (looksLikeJsRedirect) {
    items.push({
      label: 'Page rendering',
      status: 'warn',
      weight: 0,
      value: 'JavaScript redirect detected — audit ran on the redirect stub',
      recommendation:
        'Your home page uses a JavaScript redirect (or meta refresh) instead of a server-side 301. The audit only saw the stub, not your real content. Search engines and AI tools handle these poorly — some skip your site entirely. Use a proper server-side 301 redirect from your hosting/DNS instead.',
    })
  } else if (looksLikeShell) {
    items.push({
      label: 'Page rendering',
      status: 'warn',
      weight: 0,
      value: 'JavaScript-rendered page detected — audit may miss content',
      recommendation:
        'Your page renders most content with JavaScript. The audit only sees the initial HTML, so some results below (headlines, content depth, internal links, landmarks) may show as missing even when they\'re visible to real visitors. For findability, consider adding server-side rendering or pre-rendering — search engines and AI tools also struggle with JS-only content.',
    })
  }

  // 1. H1
  const h1s = getAllTags(html, 'h1')
  if (h1s.length === 0) {
    items.push({
      label: 'Main headline (H1)',
      status: looksLikeShell ? 'warn' : 'fail',
      value: looksLikeShell ? 'None in initial HTML — page is JavaScript-rendered' : 'None found',
      recommendation: looksLikeShell
        ? 'No H1 was found in the initial HTML, but this page renders with JavaScript — your H1 may be visible to people yet invisible to this audit and to crawlers that don\'t run JS. Confirm an H1 exists, and consider server-side rendering so search engines reliably see it.'
        : 'Every page needs one main headline (H1) that tells visitors and search engines what the page is about. Add a clear, descriptive H1.',
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
      status: h1s.length <= 2 ? 'warn' : 'fail',
      value: `${h1s.length} found — should be 1`,
      score: h1s.length === 2 ? 0.7 : undefined,
      extracted: h1Texts.join(' | '),
      recommendation:
        h1s.length === 2
          ? 'Two H1 tags is a common pattern when a logo is wrapped in an H1 and the page heading is also an H1 — Google handles this fine, but if you can, demote the logo H1 to a div or H2 so search engines have one clear topic for the page.'
          : 'Multiple H1 tags can confuse search engines about the main topic of your page. Use one H1 for the page title and H2s for sections.',
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

  // 3. Image descriptions (alt text) — percentage-based scoring.
  // Decorative images using alt="" + role="presentation" or aria-hidden="true"
  // are WCAG-compliant and counted as handled, not missing.
  const allImgs = getAllSelfClosing(html, 'img')
  const imgs = allImgs.filter(isRealImage)

  const described: string[] = []
  const decorative: string[] = []
  const missingAlt: string[] = []
  for (const img of imgs) {
    const alt = attr(img, 'alt')
    if (alt !== null && alt.trim() !== '') {
      described.push(img)
      continue
    }
    const role = attr(img, 'role')
    const ariaHidden = attr(img, 'aria-hidden')
    if (alt === '' && (role === 'presentation' || ariaHidden === 'true')) {
      decorative.push(img)
      continue
    }
    missingAlt.push(img)
  }
  const handled = described.length + decorative.length
  const breakdown =
    decorative.length > 0
      ? ` (${described.length} described, ${decorative.length} decorative)`
      : ''

  if (imgs.length === 0) {
    items.push({
      label: 'Image descriptions',
      status: 'pass',
      value: 'No images found on page',
    })
  } else if (imgs.length <= 2 && handled < imgs.length) {
    // Tiny-N edge case: 0/1 or 1/2 looks like 0% or 50% which is harsh given
    // single-image samples are noisy. Always show as warn with explicit count
    // rather than fail with a misleading percentage.
    items.push({
      label: 'Image descriptions',
      status: 'warn',
      value: `${imgs.length - missingAlt.length} of ${imgs.length} image${imgs.length > 1 ? 's' : ''} ${imgs.length > 1 ? 'have' : 'has'} a description`,
      score: handled / imgs.length,
      extracted: missingAlt
        .slice(0, 3)
        .map((img) => attr(img, 'src') ?? 'unknown')
        .map((s) => s.split('/').pop() ?? s)
        .join(', '),
      recommendation:
        'Your page has very few images, but the one(s) without alt text are still worth describing — screen readers and search engines can\'t see images without text descriptions. If the image is purely decorative, use alt="" with role="presentation".',
    })
  } else {
    const pct = handled / imgs.length
    const pctDisplay = Math.round(pct * 100)
    if (pct === 1) {
      items.push({
        label: 'Image descriptions',
        status: 'pass',
        value:
          decorative.length > 0
            ? `All ${imgs.length} images handled${breakdown}`
            : `All ${imgs.length} images have descriptions`,
      })
    } else if (pctDisplay >= 50) {
      items.push({
        label: 'Image descriptions',
        status: 'warn',
        value:
          decorative.length > 0
            ? `${handled} of ${imgs.length} images handled${breakdown} (${pctDisplay}%)`
            : `${described.length} of ${imgs.length} images have descriptions (${pctDisplay}%)`,
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
        value:
          decorative.length > 0
            ? `Only ${handled} of ${imgs.length} images handled${breakdown} (${pctDisplay}%)`
            : `Only ${described.length} of ${imgs.length} images have descriptions (${pctDisplay}%)`,
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

  // 4. Content depth — homepages are concise, so the pass bar is moderate (400+).
  // If the page is a JS shell, the audit only sees initial HTML — don't hard-fail
  // for content it openly can't see.
  const words = wordCount(html)
  if (words >= 400) {
    items.push({
      label: 'Content depth',
      status: 'pass',
      value: `~${words.toLocaleString()} words`,
    })
  } else if (words >= 150) {
    const depthScore = 0.5 + 0.5 * ((words - 150) / 250)
    items.push({
      label: 'Content depth',
      status: 'warn',
      value: `~${words.toLocaleString()} words — could go deeper`,
      score: depthScore,
      recommendation:
        'Search engines and AI prefer pages with thorough, well-organized content. Expanding your key topics with more detail makes your page more likely to rank and get cited.',
    })
  } else if (looksLikeShell) {
    items.push({
      label: 'Content depth',
      status: 'warn',
      score: 0.5,
      value: `~${words.toLocaleString()} words in initial HTML — JavaScript-rendered`,
      recommendation:
        'This page renders its content with JavaScript, so the audit sees a near-empty initial HTML. Your content may be fine for visitors, but crawlers and AI tools that don\'t run JavaScript see the same thin page. Server-side rendering or pre-rendering fixes this.',
    })
  } else {
    items.push({
      label: 'Content depth',
      status: 'fail',
      value: `~${words.toLocaleString()} words — very thin`,
      recommendation:
        'This page has almost no readable content. Search engines and AI need text to understand what the page is about. Add meaningful content that describes your business or topic.',
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

  // 7. Nofollow on internal links — actively bleeds PageRank
  const internalLinkReFull = /<a\b[^>]*href=["']([^"']*?)["'][^>]*>/gi
  let ilMatch
  const nofollowedInternal: string[] = []
  while ((ilMatch = internalLinkReFull.exec(html)) !== null) {
    const href = ilMatch[1]
    const fullTag = ilMatch[0]
    const isInternal =
      href.startsWith('/') ||
      href.startsWith('#') ||
      href.startsWith(parsedUrl.origin)
    if (isInternal && /rel=["'][^"']*nofollow/i.test(fullTag)) {
      nofollowedInternal.push(href)
    }
  }

  if (nofollowedInternal.length > 0) {
    items.push({
      label: 'Internal link nofollow',
      status: 'fail',
      value: `${nofollowedInternal.length} internal link${nofollowedInternal.length > 1 ? 's' : ''} marked nofollow`,
      extracted: nofollowedInternal.slice(0, 5).join(', '),
      weight: 1.5,
      recommendation:
        'Some links to your own pages have rel="nofollow", which tells Google not to follow them. This bleeds ranking power from your own site. Remove the nofollow attribute from internal links.',
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

  // 3. Share image (og:image) — markup presence check
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

  // 3b. Share image reachability — verifies the og:image actually fetches cleanly
  // for social scrapers. PA Pardon hit this 2026-05-08: og:image URL was the
  // non-www domain, server 307'd to www, and Facebook's scraper doesn't follow
  // redirects on og:image. The image was technically valid but invisible to FB.
  // Only fires when og:image is in markup AND route.ts attempted the fetch.
  if (ogImage && page.ogImage) {
    const { status, redirected, contentType } = page.ogImage
    const isImage = !!contentType && /^image\//i.test(contentType)

    if (status && status >= 200 && status < 300 && isImage && !redirected) {
      items.push({
        label: 'Share image reachability',
        status: 'pass',
        value: `Fetches as ${contentType?.split(';')[0] ?? 'image'} (no redirect)`,
        weight: 0.5,
      })
    } else if (redirected) {
      items.push({
        label: 'Share image reachability',
        status: 'warn',
        value: `Redirects (${status}) — some social scrapers won't follow`,
        weight: 0.5,
        extracted: page.ogImage.url,
        recommendation:
          'Your og:image URL redirects (e.g., non-www → www, or http → https). Facebook\'s scraper specifically does not follow redirects on og:image and may show no preview, or fall back to an unrelated image on your page. Update your og:image meta tag to point at the final URL directly.',
      })
    } else if (status && status >= 400) {
      items.push({
        label: 'Share image reachability',
        status: 'fail',
        value: `Returns ${status} — broken link`,
        weight: 0.5,
        extracted: page.ogImage.url,
        recommendation:
          'Your og:image URL doesn\'t load — social platforms will show no preview when your link is shared. Verify the URL works in your browser, then update the meta tag.',
      })
    } else if (contentType && !isImage) {
      items.push({
        label: 'Share image reachability',
        status: 'fail',
        value: `Serves ${contentType.split(';')[0]} instead of an image`,
        weight: 0.5,
        extracted: page.ogImage.url,
        recommendation:
          'Your og:image URL responds, but with the wrong content type — social scrapers expect image/jpeg, image/png, etc. Check that the URL points to the actual image file, not an HTML page.',
      })
    } else {
      // status is undefined — fetch failed entirely (timeout, DNS, connection
      // refused, host blocking automated requests). Soft-warn rather than silent
      // pass: if our auditor can't reach it, social scrapers may also fail.
      items.push({
        label: 'Share image reachability',
        status: 'warn',
        value: 'Could not verify — og:image fetch failed',
        weight: 0.5,
        extracted: page.ogImage.url,
        recommendation:
          'We couldn\'t fetch your og:image URL — it may be timing out, blocked by the host, or pointing at a non-existent file. Verify the URL works in your browser. If it does, your hosting may be blocking automated requests (including social scrapers).',
      })
    }
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
  // SMB calibration: most small businesses have 1-3 social presences, not all 5.
  // Pass at 2+ (covers the typical Facebook + Instagram footprint), warn at 1
  // (worth adding a second), warn at 0 (worth surfacing for SEO knowledge graph).
  if (foundProfiles.length >= 2) {
    items.push({
      label: 'Social profiles',
      status: 'pass',
      value: `${foundProfiles.length} platform${foundProfiles.length > 1 ? 's' : ''} linked`,
      extracted: `Found: ${foundProfiles.map((p) => p.name).join(', ')}`,
    })
  } else if (foundProfiles.length === 1) {
    items.push({
      label: 'Social profiles',
      status: 'warn',
      value: `1 platform linked (${foundProfiles[0].name})`,
      weight: 0.5,
      extracted: `Found: ${foundProfiles[0].name}`,
      recommendation:
        'Linking to two or more social profiles helps search engines connect your brand across the web. Most small businesses use Facebook + Instagram or Facebook + LinkedIn — add the second platform you actually post to.',
    })
  } else {
    items.push({
      label: 'Social profiles',
      status: 'warn',
      value: 'No social profile links found',
      weight: 0.5,
      recommendation:
        'Adding links to your social media profiles helps search engines connect your website to your brand. If you have any social presence, link to it from the footer — even one or two profiles is enough for the signal.',
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
    const legacyRatio = legacyFormats.length / imgSrcs.length
    // Nearly every real site still uses JPG/PNG, so the old >50%-or-10+ threshold
    // warned ~80% of sites — alarm fatigue for a low-impact issue. Only warn when
    // it's egregious: the page is overwhelmingly legacy (≥80%) AND image-heavy (≥10).
    if (legacyRatio < 0.8 || legacyFormats.length < 10) {
      items.push({
        label: 'Image file formats',
        status: 'pass',
        value: `${legacyFormats.length} image${legacyFormats.length > 1 ? 's' : ''} could use modern formats — minor`,
      })
    } else {
      items.push({
        label: 'Image file formats',
        status: 'warn',
        value: `${legacyFormats.length} of ${imgSrcs.length} images using older formats`,
        score: Math.max(modernRatio, 0.25),
        weight: 0.5,
        extracted: legacyFormats
          .slice(0, 5)
          .map((s) => s.split('/').pop() ?? s)
          .join(', '),
        recommendation:
          'Most of your images use older file formats (PNG/JPG) that load slower on mobile. Converting to WebP or AVIF typically cuts file size 25–35% with no visible quality loss.',
      })
    }
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

  // 2. Mixed content — an HTTPS page loading SUB-RESOURCES over HTTP (browsers
  // block these). Only actual resource loads count: src=/srcset= on media and
  // scripts, plus stylesheet/preload <link> tags. A plain <a href="http://">
  // link is NOT mixed content — the old regex matched anchor href too, failing
  // ~65% of sites for normal outbound links (at the heaviest weight in the tool).
  if (isHttps) {
    const srcMixed = html.match(/\b(?:src|srcset)=["'][^"']*http:\/\/[^"']+["']/gi) ?? []
    const linkMixed = (html.match(/<link\b[^>]*>/gi) ?? []).filter(
      (tag) =>
        /href=["']http:\/\//i.test(tag) &&
        /rel=["'][^"']*(stylesheet|preload|prefetch|modulepreload)/i.test(tag),
    )
    const realMixed = [...srcMixed, ...linkMixed]
    if (realMixed.length > 0) {
      const examples = realMixed.slice(0, 3).map((r) => {
        const urlMatch = r.match(/(http:\/\/[^"']+)/i)
        return urlMatch ? urlMatch[1].split('/').pop() ?? urlMatch[1] : r
      })
      items.push({
        label: 'Mixed content',
        status: 'fail',
        value: `${realMixed.length} resource${realMixed.length > 1 ? 's' : ''} loaded over HTTP`,
        extracted: examples.join(', '),
        weight: 1.5,
        recommendation:
          'Your page is HTTPS but loads some resources (images, scripts, stylesheets) over insecure HTTP. Browsers block these, so images may not display and scripts may not run. Change all resource URLs to use https://.',
      })
    }
  }

  // 3. Safe external links — only target="_blank" links ever carried an
  // "opener" risk (reverse tabnabbing), and every modern browser (Chrome/Edge/
  // Firefox/Safari since ~2021) applies noopener to them automatically. So a
  // missing rel="noopener" is no longer a real vulnerability. This is now an
  // informational check (never a warning) — flagging it on the ~85% of sites
  // that omit the tag was alarm fatigue for a non-issue.
  const extLinkRe = /<a\b[^>]*href=["']https?:\/\/[^"']*["'][^>]*>/gi
  const extLinks = [...html.matchAll(extLinkRe)].map((m) => m[0])
  let parsedOrigin: string
  try {
    parsedOrigin = new URL(url).origin
  } catch {
    parsedOrigin = ''
  }
  const trueExternal = extLinks.filter((link) => !link.includes(parsedOrigin))
  // Only new-tab links can be affected; same-tab links never had opener access.
  const newTabExternal = trueExternal.filter((link) => /target=["']?_blank/i.test(link))
  const unsafeNewTab = newTabExternal.filter(
    (link) => !/rel=["'][^"']*(noopener|noreferrer)/i.test(link),
  )

  if (trueExternal.length === 0) {
    items.push({
      label: 'Safe external links',
      status: 'pass',
      value: 'No external links to evaluate',
    })
  } else if (newTabExternal.length === 0 || unsafeNewTab.length === 0) {
    items.push({
      label: 'Safe external links',
      status: 'pass',
      value: `${trueExternal.length} external link${trueExternal.length > 1 ? 's' : ''} — safe`,
    })
  } else {
    // New-tab links without an explicit rel="noopener". Browsers neutralize this
    // automatically now, so it's a quiet hygiene note — a pass, not a warning.
    items.push({
      label: 'Safe external links',
      status: 'pass',
      value: `${trueExternal.length} external links — protected by the browser's built-in safeguards`,
      recommendation:
        'A few links open in a new tab without an explicit rel="noopener". Modern browsers add that protection automatically, so there\'s no real risk — adding the tag is optional hygiene for very old browsers.',
    })
  }

  // 4. Form action security
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

  // 5. Password fields
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
      weight: 0.5,
    })
  } else {
    items.push({
      label: 'Content security policy',
      status: 'warn',
      value: 'No CSP found',
      weight: 0.5,
      recommendation:
        'A Content Security Policy tells browsers which scripts and resources are allowed to run on your page. Without one, your site is more vulnerable to code injection. This is an advanced setting — ask your developer about it.',
    })
  }

  // 6. Privacy policy
  const privacyRe = /href=["'][^"']*(privacy|datenschutz|privacidad|legal|terms|policies\/privacy|cookie-policy)[^"']*["']/i
  const privacyTextRe = />([^<]*(privacy policy|privacy notice|cookie policy)[^<]*)</i
  const hasPrivacyLink = privacyRe.test(html) || privacyTextRe.test(html)
  const hasDataCollection = forms.length > 0 ||
    /google-analytics|gtag|googletagmanager|facebook\.com\/tr|analytics|pixel/i.test(html)

  if (hasPrivacyLink) {
    items.push({
      label: 'Privacy policy',
      status: 'pass',
      value: 'Privacy policy link found',
    })
  } else if (hasDataCollection) {
    items.push({
      label: 'Privacy policy',
      status: 'fail',
      value: 'No privacy policy — but page collects data',
      recommendation:
        'Your page has forms or analytics tracking, which means you\'re collecting visitor data. A privacy policy is legally required in most regions. Add a link in your footer.',
    })
  } else {
    items.push({
      label: 'Privacy policy',
      status: 'warn',
      value: 'No privacy policy link found',
      recommendation:
        'A privacy policy builds trust and is legally required if you collect any visitor data. Even if this page doesn\'t collect data directly, it\'s good practice to have one linked.',
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
    // 78% of audited small business sites lack a skip link. Real WCAG concern,
    // but always-fires-as-warn produces alarm fatigue. Lower the weight so
    // missing it is a small ding, not a category-dragging hit.
    items.push({
      label: 'Skip navigation',
      status: 'warn',
      value: 'No skip navigation link',
      weight: 0.5,
      recommendation:
        'Keyboard users have to tab through every menu link to reach your content. A "Skip to content" link at the top of the page lets them jump straight to what matters. Most templates don\'t include this by default — adding it once helps every visitor who relies on a keyboard.',
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

  // 6. Focus visibility — detect outline:none / outline:0 that kills focus indicators.
  // Inspect both inline <style> blocks AND any external CSS the route fetched
  // (route.ts pulls up to N linked stylesheets, capped). Sites that bundle their
  // CSS (Next/React/Vue/most modern sites) put `:focus { outline: none }` in
  // external files; without inspecting those, this check produced silent false
  // negatives.
  const styleBlocks = getAllTags(html, 'style')
  const inlineCss = styleBlocks.join(' ')
  const externalCss = page.externalCss ?? ''
  const allStyles = inlineCss + ' ' + externalCss
  const killsFocus =
    /outline\s*:\s*(none|0)\b/i.test(allStyles) &&
    !/outline\s*:\s*(none|0)[^}]*focus-visible/i.test(allStyles)
  const focusOutlineKill = /:focus\s*\{[^}]*outline\s*:\s*(none|0)/i.test(allStyles)
  const hasFocusVisible = /focus-visible/i.test(allStyles)
  const hasAnyCss = inlineCss.length > 200 || externalCss.length > 200

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
  } else if (!hasAnyCss) {
    // No CSS to inspect at all — neither inline nor external fetched. Don't claim a pass.
    items.push({
      label: 'Focus indicators',
      status: 'warn',
      value: 'CSS not inspected — verify focus visibility manually',
      recommendation:
        'We couldn\'t reach your stylesheets to verify focus indicators. Check that keyboard focus is visible on links and form fields by tabbing through the page in your browser.',
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
      { name: 'Accessibility', items: parseAccessibility(page) },
      { name: 'Security', items: parseSecurity(page) },
    ],
  }
}
