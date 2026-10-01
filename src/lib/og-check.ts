/* ── OG image checker: parse + checks (pure, client-safe) ──────────────────
 * The route fetches the page once and the image once, then hands the raw
 * HTML and image facts to buildResult(). Everything here is plain data so
 * the client can render it and the admin log can store check ids.
 *
 * Every pass rule cites an official source (decision 13 in
 * drafts/og-checker-build-spec.md). No X numbers: its docs returned 402.
 * ─────────────────────────────────────────────────────────────────────── */

/* ── Sources ──────────────────────────────────────────────────────────── */

export const SOURCES = {
  meta: { label: 'Meta', href: 'https://developers.facebook.com/docs/sharing/webmasters/images' },
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/help/linkedin/answer/a521928' },
  apple: {
    label: 'Apple TN3156',
    href: 'https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages',
  },
  ogp: { label: 'ogp.me', href: 'https://ogp.me/' },
} as const

export type Source = { label: string; href: string }

/* ── Types ────────────────────────────────────────────────────────────── */

export const CHECK_IDS = [
  'size',
  'shape',
  'width',
  'filesize',
  'loads',
  'tags',
  'alt',
  'sitename',
] as const
export type CheckId = (typeof CHECK_IDS)[number]
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip'

export interface CheckRow {
  id: CheckId
  label: string
  status: CheckStatus
  /** Short measured value for the right-hand column. */
  value: string
  /** The rule in plain words, shown above the source links. */
  rule: string
  sources: Source[]
  /** Plain-word fix, only when the check does not pass. */
  fix?: string
  /** Extra fact worth saying even on a pass (e.g. tags disagree with the file). */
  note?: string
}

export interface PageTags {
  title: string | null
  description: string | null
  type: string | null
  url: string | null
  image: string | null
  imageAlt: string | null
  imageWidth: string | null
  imageHeight: string | null
  siteName: string | null
}

export interface ImageFacts {
  /** og:image resolved against the page URL. */
  url: string
  status?: number
  /** Redirect target, resolved, when the image answered 3xx. */
  location?: string
  contentType?: string
  /** File size in bytes, when known. */
  bytes?: number
  /** True when bytes is a lower bound (we stopped reading at the cap). */
  bytesOver?: boolean
  width?: number
  height?: number
  format?: string
  /** data: URI of the real bytes, for the preview (small files only). */
  dataUri?: string
  /** The file loaded but is too big to embed in the result. */
  tooBigToShow?: boolean
}

/** What the Google tab reads from the same page fetch. Shown, never scored. */
export interface GoogleFacts {
  /** <title>, else og:title, else the first <h1>. */
  title: string | null
  titleSource: 'title' | 'og:title' | 'h1' | null
  /** <meta name="description">. */
  description: string | null
  /** First real paragraph, for the snippet when there is no description. */
  bodyText: string | null
  noindex: boolean
  nosnippet: boolean
  siteName: string | null
  siteNameSource: 'schema' | 'og:site_name' | null
  /** The checked URL is a domain or subdomain root. */
  isHome: boolean
  /** BreadcrumbList item names, only when it has 2+ items. */
  breadcrumb: string[] | null
  /** yyyy-mm-dd from datePublished or article:published_time. */
  datePublished: string | null
  /** Favicon address from <link rel="icon">, else /favicon.ico. */
  faviconUrl: string
  favicon: ImageFacts | null
}

export interface OgCheckResult {
  /** The page we read (after redirects). */
  url: string
  /** Hostname without www, for the previews and the log. */
  domain: string
  checkedAt: string
  tags: PageTags
  /** <title>, used only as a suggestion in the tag block. */
  htmlTitle: string | null
  h1: string | null
  image: ImageFacts | null
  checks: CheckRow[]
  passed: number
  /** Optional so results logged or captured before the Google tab still render. */
  google?: GoogleFacts
}

/* ── HTML parsing ─────────────────────────────────────────────────────── */

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  ndash: '–', mdash: '—', hellip: '…', middot: '·',
  copy: '©', reg: '®', trade: '™', bull: '•',
}

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m
    }
    return NAMED[e.toLowerCase()] ?? m
  })
}

function clean(s: string): string {
  return decodeEntities(s).replace(/\s+/g, ' ').trim()
}

/** Every <meta> tag's property/name → content. First one wins (ogp.me: the
 * first og:image has preference). Handles either attribute order and both
 * quote styles, including an apostrophe inside a double-quoted value. */
export function parseMetaTags(html: string): Map<string, string> {
  const out = new Map<string, string>()
  const tagRe = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi
  const attrRe = /([^\s=/>"']+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  for (const tag of html.matchAll(tagRe)) {
    const attrs: Record<string, string> = {}
    for (const a of tag[0].slice(5).matchAll(attrRe)) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? ''
    }
    const key = (attrs.property ?? attrs.name ?? '').toLowerCase().trim()
    if (!key || !('content' in attrs) || out.has(key)) continue
    out.set(key, clean(attrs.content))
  }
  return out
}

function firstElementText(html: string, tag: string): string | null {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return null
  const text = clean(m[1].replace(/<[^>]+>/g, ' '))
  return text || null
}

export function readPage(html: string): { tags: PageTags; htmlTitle: string | null; h1: string | null } {
  const m = parseMetaTags(html)
  const get = (k: string) => {
    const v = m.get(k)
    return v ? v : null
  }
  return {
    tags: {
      title: get('og:title'),
      description: get('og:description'),
      type: get('og:type'),
      url: get('og:url'),
      image: get('og:image') ?? get('og:image:url') ?? get('og:image:secure_url'),
      imageAlt: get('og:image:alt'),
      imageWidth: get('og:image:width'),
      imageHeight: get('og:image:height'),
      siteName: get('og:site_name'),
    },
    htmlTitle: firstElementText(html, 'title'),
    h1: firstElementText(html, 'h1'),
  }
}

/* ── Image size from the bytes (never trust the tags alone) ───────────── */

export function readImageSize(
  b: Uint8Array,
): { width: number; height: number; format: string } | null {
  const u16be = (i: number) => (b[i] << 8) | b[i + 1]
  const u16le = (i: number) => b[i] | (b[i + 1] << 8)
  const u24le = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)
  const u32be = (i: number) => ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3]
  const ascii = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n))

  // PNG: IHDR is always the first chunk
  if (b.length >= 24 && b[0] === 0x89 && ascii(1, 3) === 'PNG') {
    return { width: u32be(16), height: u32be(20), format: 'PNG' }
  }
  // GIF
  if (b.length >= 10 && ascii(0, 4) === 'GIF8') {
    return { width: u16le(6), height: u16le(8), format: 'GIF' }
  }
  // WebP
  if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const chunk = ascii(12, 4)
    if (chunk === 'VP8 ') {
      return { width: u16le(26) & 0x3fff, height: u16le(28) & 0x3fff, format: 'WebP' }
    }
    if (chunk === 'VP8L') {
      const b0 = b[21], b1 = b[22], b2 = b[23], b3 = b[24]
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        format: 'WebP',
      }
    }
    if (chunk === 'VP8X') {
      return { width: 1 + u24le(24), height: 1 + u24le(27), format: 'WebP' }
    }
    return null
  }
  // JPEG: walk the segments to the first start-of-frame marker
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null
      const marker = b[i + 1]
      if (marker === 0xff) {
        i++
        continue
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2
        continue
      }
      const isSof =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isSof) return { width: u16be(i + 7), height: u16be(i + 5), format: 'JPEG' }
      i += 2 + u16be(i + 2)
    }
  }
  return null
}

/* ── Formatting ───────────────────────────────────────────────────────── */

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRatio(w: number, h: number): string {
  return `${(w / h).toFixed(3)} : 1`
}

/** Hostname without www. */
export function bareHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url
  }
}

/* ── Site name in title ───────────────────────────────────────────────── */

function squash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** The name to look for: og:site_name, else the domain's main label. */
function siteNameFor(tags: PageTags, domain: string): string | null {
  const name = tags.siteName?.trim()
  if (name && squash(name).length >= 3) return name
  // No og:site_name: fall back to the domain's longest label ("example" in
  // blog.example.co.uk). 4+ letters, so a short brand doesn't match common words.
  const labels = domain.split('.').slice(0, -1)
  const label = labels.sort((a, b) => b.length - a.length)[0] ?? ''
  return squash(label).length >= 4 ? label : null
}

export function titleHasSiteName(tags: PageTags, domain: string): boolean {
  if (!tags.title) return false
  const name = siteNameFor(tags, domain)
  if (!name) return false
  return squash(tags.title).includes(squash(name))
}

/** Best-effort title with the site name and its separator taken off. */
export function stripSiteName(title: string, tags: PageTags, domain: string): string {
  const name = siteNameFor(tags, domain)
  if (!name) return title
  // Split on the usual separators ("Post | Site", "Site - Post", "Post · Site")
  // and drop the parts that are the site name.
  const key = squash(name)
  const parts = title.split(/\s+[|\-–—:·•]\s+|\s*[|·•]\s*/)
  const kept = parts.filter((p) => p.trim() && !squash(p).includes(key))
  return kept.length && kept.length < parts.length ? kept.join(' - ').trim() : title
}

/* ── Title vs headline (decision 14: shown, never scored) ─────────────── */

export type TitleMatch = 'same' | 'different' | 'missing'

export function compareTitleToH1(title: string | null, h1: string | null): TitleMatch {
  if (!title || !h1) return 'missing'
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  return norm(title) === norm(h1) ? 'same' : 'different'
}

export function isArticle(tags: PageTags): boolean {
  return (tags.type ?? '').trim().toLowerCase() === 'article'
}

/* ── The 8 checks ─────────────────────────────────────────────────────── */

const MB = 1024 * 1024
const LINKEDIN_MAX = 5 * MB
const META_MAX = 8 * MB

export function buildChecks(
  tags: PageTags,
  image: ImageFacts | null,
  domain: string,
): CheckRow[] {
  const rows: CheckRow[] = []
  const loaded =
    !!image && !!image.status && image.status >= 200 && image.status < 300 &&
    !!image.contentType && /^image\//i.test(image.contentType)
  const w = image?.width
  const h = image?.height
  const hasDims = loaded && !!w && !!h
  const notMeasured = !tags.image
    ? 'No image to measure'
    : !loaded
      ? 'Image did not load'
      : 'Could not read the size'

  // 1. Size
  {
    const row: CheckRow = {
      id: 'size',
      label: 'Size',
      status: 'skip',
      value: '—',
      rule: 'At least 1200 × 630 · LinkedIn allows 627',
      sources: [SOURCES.meta, SOURCES.linkedin],
    }
    if (hasDims) {
      row.value = `${w} × ${h}`
      // Meta asks for 1200 × 630, LinkedIn for 1200 × 627: pass either.
      if (w! >= 1200 && h! >= 627) row.status = 'pass'
      else if (w! < 200 || h! < 200) {
        row.status = 'fail'
        row.fix = `Your image is ${w} × ${h}. Meta does not allow images under 200 × 200. Make it 1200 × 630.`
      } else {
        row.status = 'warn'
        row.fix = `Your image is ${w} × ${h}. Make it at least 1200 × 630.`
      }
      const tw = Number(tags.imageWidth)
      const th = Number(tags.imageHeight)
      if (tags.imageWidth && tags.imageHeight && (tw !== w || th !== h)) {
        row.note = `Your tags say ${tags.imageWidth} × ${tags.imageHeight}. The file is ${w} × ${h}.`
      }
    } else {
      row.note = notMeasured
    }
    rows.push(row)
  }

  // 2. Shape
  {
    const row: CheckRow = {
      id: 'shape',
      label: 'Shape',
      status: 'skip',
      value: '—',
      rule: 'Close to 1.91 : 1',
      sources: [SOURCES.meta, SOURCES.linkedin],
    }
    if (hasDims) {
      row.value = formatRatio(w!, h!)
      const off = Math.abs(w! / h! / 1.91 - 1)
      if (off <= 0.03) row.status = 'pass'
      else {
        row.status = 'warn'
        row.fix = `Your image is ${formatRatio(w!, h!)}. Meta asks for close to 1.91 : 1 so Feed shows the whole image without cropping. 1200 × 630 is that shape.`
      }
    } else {
      row.note = notMeasured
    }
    rows.push(row)
  }

  // 3. Width
  {
    const row: CheckRow = {
      id: 'width',
      label: 'Width',
      status: 'skip',
      value: '—',
      rule: 'At least 900 px wide',
      sources: [SOURCES.apple],
    }
    if (hasDims) {
      row.value = `${w} px`
      if (w! >= 900) row.status = 'pass'
      else {
        row.status = 'warn'
        row.fix = `Your image is ${w} px wide. Apple asks for at least 900 px.`
      }
    } else {
      row.note = notMeasured
    }
    rows.push(row)
  }

  // 4. File size
  {
    const row: CheckRow = {
      id: 'filesize',
      label: 'File size',
      status: 'skip',
      value: '—',
      rule: 'Under 5 MB (LinkedIn) · under 8 MB (Meta)',
      sources: [SOURCES.linkedin, SOURCES.meta],
    }
    if (loaded && image?.bytes !== undefined) {
      const b = image.bytes
      row.value = image.bytesOver ? `Over ${formatBytes(b)}` : formatBytes(b)
      if (image.bytesOver || b > META_MAX) {
        row.status = 'fail'
        row.fix = 'Your image is over 8 MB, the most Meta allows. Save it smaller: a JPEG or a compressed PNG at 1200 × 630 is usually well under 1 MB.'
      } else if (b >= LINKEDIN_MAX) {
        row.status = 'warn'
        row.fix = 'Your image is over 5 MB, the most LinkedIn allows. Save it smaller: a JPEG or a compressed PNG.'
      } else row.status = 'pass'
    } else {
      row.note = loaded ? 'The server did not say the file size' : notMeasured
    }
    rows.push(row)
  }

  // 5. Image loads
  {
    const row: CheckRow = {
      id: 'loads',
      label: 'Image loads',
      status: 'fail',
      value: '—',
      rule: '200, an image, no redirect · tested once, just now',
      sources: [],
    }
    if (!tags.image) {
      row.value = 'No image tag'
      row.fix = 'Your page has no og:image tag, so there is no picture to show. Add one that links to a 1200 × 630 card.'
    } else if (!image || !image.status) {
      row.value = 'No answer'
      row.fix = `We asked for your image and got no answer. Open ${image?.url ?? tags.image} in a browser. If it loads there, your host may block automated requests.`
    } else if (image.status >= 300 && image.status < 400) {
      row.value = `Redirects · ${image.status}`
      row.fix = image.location
        ? `Your image address redirects to ${image.location}. Put that final address in og:image.`
        : 'Your image address redirects. Put the final address in og:image.'
    } else if (image.status === 401 || image.status === 403) {
      row.value = `Refused · ${image.status}`
      row.fix = `Your server refused our request for the image (${image.status}). This is often a security plugin or bot shield. It may refuse the apps too, so test the link in Meta's Sharing Debugger or LinkedIn's Post Inspector.`
    } else if (image.status >= 400) {
      row.value = `Error ${image.status}`
      row.fix = `Your image address returns error ${image.status}. Check the file is there and the link in og:image is right.`
    } else if (!loaded) {
      const ct = image.contentType?.split(';')[0] ?? 'no type'
      row.value = `Not an image · ${ct}`
      row.fix = `Your image address sends back ${ct}, not an image. Point og:image at the image file itself.`
    } else {
      row.status = 'pass'
      row.value = `${image.status} · ${image.format ?? image.contentType!.split(';')[0].replace('image/', '').toUpperCase()}`
    }
    rows.push(row)
  }

  // 6. Required tags
  {
    const missing = (
      [
        ['og:title', tags.title],
        ['og:type', tags.type],
        ['og:image', tags.image],
        ['og:url', tags.url],
      ] as const
    )
      .filter(([, v]) => !v)
      .map(([k]) => k)
    rows.push({
      id: 'tags',
      label: 'Required tags',
      status: missing.length ? 'fail' : 'pass',
      value: `${4 - missing.length} of 4`,
      rule: 'og:title, og:type, og:image, og:url',
      sources: [SOURCES.ogp],
      fix: missing.length
        ? `Add ${missing.join(', ')}. The tag block below has ${missing.length === 1 ? 'it' : 'them'} ready.`
        : undefined,
    })
  }

  // 7. Image alt
  rows.push({
    id: 'alt',
    label: 'Image alt',
    status: tags.imageAlt ? 'pass' : 'warn',
    value: tags.imageAlt ? 'Present' : 'Missing',
    rule: 'og:image:alt',
    sources: [SOURCES.ogp],
    fix: tags.imageAlt
      ? undefined
      : 'Add og:image:alt: one sentence on what the picture shows, not a caption.',
  })

  // 8. No site name in og:title
  {
    const row: CheckRow = {
      id: 'sitename',
      label: 'No site name in title',
      status: 'skip',
      value: '—',
      rule: 'Put the site name in og:site_name instead',
      sources: [SOURCES.apple],
    }
    if (!tags.title) row.note = 'No share title to check'
    else if (titleHasSiteName(tags, domain)) {
      row.status = 'warn'
      row.value = 'Has site name'
      row.fix = 'Take your site name out of og:title. Apple asks for it in og:site_name instead.'
    } else {
      row.status = 'pass'
      row.value = 'Clean'
    }
    rows.push(row)
  }

  return rows
}

export function buildResult(input: {
  url: string
  html: string
  image: ImageFacts | null
  favicon?: ImageFacts | null
  xRobots?: string | null
}): OgCheckResult {
  const { tags, htmlTitle, h1 } = readPage(input.html)
  const domain = bareHost(input.url)
  const checks = buildChecks(tags, input.image, domain)
  const google = readGoogle(input.html, input.url, input.xRobots ?? null)
  google.favicon = input.favicon ?? null
  return {
    url: input.url,
    domain,
    checkedAt: new Date().toISOString(),
    tags,
    htmlTitle,
    h1,
    image: input.image,
    checks,
    passed: checks.filter((c) => c.status === 'pass').length,
    google,
  }
}

/* ── Google tab: what Google reads (shown, never scored) ──────────────────
 * Every rule is from Google Search Central, read 2026-10-01; the facts are in
 * drafts/research/google-result-preview.md. Google picks titles, snippets and
 * site names itself, so the tab says "likely" and nothing here is a check.
 * ─────────────────────────────────────────────────────────────────────── */

const GOOGLE = 'https://developers.google.com/search/docs/'

export const GOOGLE_SOURCES = {
  noindex: { label: 'Google: noindex', href: `${GOOGLE}crawling-indexing/block-indexing` },
  title: { label: 'Google: title links', href: `${GOOGLE}appearance/title-link` },
  snippet: { label: 'Google: snippets', href: `${GOOGLE}appearance/snippet` },
  siteName: { label: 'Google: site names', href: `${GOOGLE}appearance/site-names` },
  favicon: { label: 'Google: favicons', href: `${GOOGLE}appearance/favicon-in-search` },
  breadcrumb: { label: 'Google: breadcrumbs', href: `${GOOGLE}appearance/structured-data/breadcrumb` },
  date: { label: 'Google: dates', href: `${GOOGLE}appearance/publication-dates` },
  image: { label: 'Google: images', href: `${GOOGLE}appearance/google-images` },
} as const

type Json = unknown

/** Every JSON-LD node on the page, flattened out of arrays and @graph. */
export function readJsonLd(html: string): Record<string, Json>[] {
  const nodes: Record<string, Json>[] = []
  const walk = (v: Json) => {
    if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') {
      const o = v as Record<string, Json>
      nodes.push(o)
      if (o['@graph']) walk(o['@graph'])
    }
  }
  const re = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi
  for (const m of html.matchAll(re)) {
    try {
      walk(JSON.parse(m[1].trim()))
    } catch {
      // Broken JSON-LD: Google can't read it either, so skip it.
    }
  }
  return nodes
}

function hasType(node: Record<string, Json>, type: string): boolean {
  const t = node['@type']
  return Array.isArray(t) ? t.includes(type) : t === type
}

function str(v: Json): string | null {
  return typeof v === 'string' && v.trim() ? clean(v) : null
}

/** Robots rules that apply to Google: <meta name="robots|googlebot"> plus the
 * X-Robots-Tag header (a "otherbot: noindex" line is not for Google). */
export function readRobots(meta: Map<string, string>, xRobots: string | null): { noindex: boolean; nosnippet: boolean } {
  const rules: string[] = []
  for (const k of ['robots', 'googlebot']) {
    const v = meta.get(k)
    if (v) rules.push(...v.toLowerCase().split(','))
  }
  if (xRobots) {
    // "googlebot: noindex" applies; "bingbot: noindex" doesn't; plain rules apply to all.
    // A "name:" prefix sets who the following rules are for.
    const valued = ['max-snippet', 'max-image-preview', 'max-video-preview', 'unavailable_after']
    let forGoogle = true
    for (const token of xRobots.toLowerCase().split(',')) {
      const m = token.match(/^\s*([a-z0-9_-]+)\s*:\s*(.*)$/)
      if (m && !valued.includes(m[1])) {
        forGoogle = m[1] === 'googlebot'
        if (forGoogle) rules.push(m[2])
      } else if (forGoogle) rules.push(token)
    }
  }
  const has = (r: string) => rules.some((x) => x.trim() === r)
  return {
    noindex: has('noindex') || has('none'),
    nosnippet: has('nosnippet') || rules.some((x) => /^\s*max-snippet\s*:\s*0\s*$/.test(x)),
  }
}

function firstParagraph(html: string): string | null {
  const body = html.replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
  const scope = body.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? body
  for (const m of scope.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = clean(m[1].replace(/<[^>]+>/g, ' '))
    if (text.length >= 60) return text.length > 320 ? `${text.slice(0, 317).trimEnd()}…` : text
  }
  return null
}

function faviconFrom(html: string, pageUrl: string): string {
  const links = [...html.matchAll(/<link\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)].map((m) => {
    const attrs: Record<string, string> = {}
    for (const a of m[0].slice(5).matchAll(/([^\s=/>"']+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
      attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? ''
    }
    return attrs
  })
  // rel="icon" (Google's documented value; "shortcut icon" includes it). When a
  // page lists several, read the largest by its sizes attribute (Google
  // recommends larger than 48 × 48); without sizes, the first one.
  const icons = links.filter((l) => (l.rel ?? '').toLowerCase().split(/\s+/).includes('icon') && l.href)
  const side = (l: Record<string, string>) =>
    Math.max(0, ...(l.sizes ?? '').split(/\s+/).map((s) => (s.toLowerCase() === 'any' ? 1024 : Number(s.toLowerCase().split('x')[0]) || 0)))
  const icon = icons.reduce<Record<string, string> | null>((best, l) => (!best || side(l) > side(best) ? l : best), null)
  try {
    return new URL(icon?.href ?? '/favicon.ico', pageUrl).toString()
  } catch {
    return `${new URL(pageUrl).origin}/favicon.ico`
  }
}

export function readGoogle(html: string, pageUrl: string, xRobots: string | null): GoogleFacts {
  const meta = parseMetaTags(html)
  const nodes = readJsonLd(html)
  const htmlTitle = firstElementText(html, 'title')
  const ogTitle = meta.get('og:title') || null
  const h1 = firstElementText(html, 'h1')
  const title = htmlTitle ?? ogTitle ?? h1
  const titleSource = htmlTitle ? 'title' : ogTitle ? 'og:title' : h1 ? 'h1' : null

  const site = nodes.find((n) => hasType(n, 'WebSite'))
  const schemaName = site ? str(site.name) : null
  const ogSite = meta.get('og:site_name') || null

  let breadcrumb: string[] | null = null
  const list = nodes.find((n) => hasType(n, 'BreadcrumbList'))
  if (list && Array.isArray(list.itemListElement)) {
    const items = (list.itemListElement as Record<string, Json>[])
      .filter((i) => i && typeof i === 'object')
      .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
      .map((i) => str(i.name) ?? (i.item && typeof i.item === 'object' ? str((i.item as Record<string, Json>).name) : null))
      .filter((n): n is string => !!n)
    if (items.length >= 2) breadcrumb = items
  }

  const dated = nodes.map((n) => str(n.datePublished)).find(Boolean) ?? meta.get('article:published_time') ?? null
  const datePublished = dated && /^\d{4}-\d{2}-\d{2}/.test(dated) ? dated.slice(0, 10) : null

  let isHome = false
  try {
    const p = new URL(pageUrl).pathname
    isHome = p === '/' || p === ''
  } catch {
    // keep false
  }

  return {
    title,
    titleSource,
    description: meta.get('description') || null,
    bodyText: firstParagraph(html),
    ...readRobots(meta, xRobots),
    siteName: schemaName ?? ogSite,
    siteNameSource: schemaName ? 'schema' : ogSite ? 'og:site_name' : null,
    isHome,
    breadcrumb,
    datePublished,
    faviconUrl: faviconFrom(html, pageUrl),
    favicon: null,
  }
}

/** Image size for a favicon: the share-image readers plus ICO and SVG. */
export function readIconSize(b: Uint8Array): { width: number; height: number; format: string } | null {
  if (b.length >= 22 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0 && (b[4] | (b[5] << 8)) > 0) {
    // ICO: the largest picture in the directory (0 means 256).
    const count = b[4] | (b[5] << 8)
    let best = { width: 0, height: 0 }
    for (let i = 0; i < count && 6 + i * 16 + 1 < b.length; i++) {
      const w = b[6 + i * 16] || 256
      const h = b[7 + i * 16] || 256
      if (w * h > best.width * best.height) best = { width: w, height: h }
    }
    return { ...best, format: 'ICO' }
  }
  return readImageSize(b)
}

export type GoogleMark = 'ok' | 'warn' | 'info'

export interface GoogleRow {
  id: 'index' | 'title' | 'description' | 'sitename' | 'favicon' | 'breadcrumb' | 'date' | 'thumbnail'
  label: string
  mark: GoogleMark
  value: string
  why: string
  source: Source
}

export function fmtGoogleDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** The "What Google reads" list. titleCut comes from the drawn preview. */
export function buildGoogleRows(r: OgCheckResult, titleCut: boolean): GoogleRow[] {
  const g = r.google
  if (!g) return []
  const S = GOOGLE_SOURCES
  const chars = (s: string) => `${[...s].length} characters`
  const rows: GoogleRow[] = []

  rows.push(
    g.noindex
      ? { id: 'index', label: 'Can show in Google', mark: 'warn', value: 'No', source: S.noindex,
          why: 'Your page says noindex, so Google drops it from results. Take the tag out if you want it found.' }
      : { id: 'index', label: 'Can show in Google', mark: 'ok', value: 'Yes', source: S.noindex, why: 'No noindex rule found.' },
  )

  if (!g.title) {
    rows.push({ id: 'title', label: 'Title', mark: 'warn', value: 'Missing', source: S.title,
      why: 'No <title> tag, so Google has to pick a title itself. Add one that says what the page is.' })
  } else if (g.titleSource !== 'title') {
    rows.push({ id: 'title', label: 'Title', mark: 'warn', value: 'No <title>', source: S.title,
      why: `No <title> tag. Google may use your ${g.titleSource === 'og:title' ? 'share title' : 'headline'}, shown above. Add a <title>.` })
  } else if (titleCut) {
    rows.push({ id: 'title', label: 'Title', mark: 'warn', value: chars(g.title), source: S.title,
      why: 'Likely cut at the end on a computer. Put the words that matter first. Google can also pick its own title.' })
  } else {
    rows.push({ id: 'title', label: 'Title', mark: 'ok', value: chars(g.title), source: S.title,
      why: 'From your <title> tag. Google can still pick its own title.' })
  }

  if (g.nosnippet) {
    rows.push({ id: 'description', label: 'Description', mark: 'warn', value: 'Blocked', source: S.snippet,
      why: 'Your page says nosnippet, so Google shows no text under the title.' })
  } else if (!g.description) {
    rows.push({ id: 'description', label: 'Description', mark: 'warn', value: 'Missing', source: S.snippet,
      why: 'No meta description, so Google takes text from your page. Add one line on what the reader gets.' })
  } else {
    rows.push({ id: 'description', label: 'Description', mark: 'ok', value: chars(g.description), source: S.snippet,
      why: 'Google sometimes uses this, and may pick other page text for some searches.' })
  }

  const home = g.isHome ? '' : ' Google reads the site name from your home page.'
  rows.push(
    g.siteNameSource === 'schema'
      ? { id: 'sitename', label: 'Site name', mark: 'info', value: g.siteName!, source: S.siteName,
          why: `From your WebSite structured data. Google may use it, or show your domain (${r.domain}) instead.${home}` }
      : g.siteNameSource === 'og:site_name'
        ? { id: 'sitename', label: 'Site name', mark: 'info', value: g.siteName!, source: S.siteName,
            why: `From og:site_name. Google says WebSite structured data on your home page counts most. It may show ${r.domain} instead.${home}` }
        : { id: 'sitename', label: 'Site name', mark: 'info', value: r.domain, source: S.siteName,
            why: `No site name found, so Google will likely show your domain. Add WebSite structured data to your home page to name it.` },
  )

  const f = g.favicon
  const fOk = !!f?.status && f.status >= 200 && f.status < 300
  if (!fOk) {
    rows.push({ id: 'favicon', label: 'Favicon', mark: 'warn', value: 'Not found', source: S.favicon,
      why: 'We could not load a favicon, so Google may show a plain default icon. Add <link rel="icon"> to your home page.' })
  } else if (f?.format === 'SVG' || /svg/i.test(f?.contentType ?? '')) {
    rows.push({ id: 'favicon', label: 'Favicon', mark: 'ok', value: 'SVG', source: S.favicon,
      why: 'Found. An SVG scales to any size. Google asks for a square icon.' })
  } else if (f?.width && f?.height) {
    const square = f.width === f.height
    const big = f.width > 48
    rows.push({
      id: 'favicon', label: 'Favicon', mark: square && big ? 'ok' : 'warn', value: `${f.width} × ${f.height}`, source: S.favicon,
      why: !square
        ? 'Google asks for a square icon. Make it 1:1.'
        : big
          ? 'Square and larger than 48 × 48, as Google asks.'
          : 'Google recommends larger than 48 × 48 so it looks sharp.',
    })
  } else {
    rows.push({ id: 'favicon', label: 'Favicon', mark: 'info', value: 'Found', source: S.favicon,
      why: 'Found, but we could not read its size. Google asks for square, larger than 48 × 48.' })
  }

  rows.push(
    g.breadcrumb
      ? { id: 'breadcrumb', label: 'Breadcrumb', mark: 'info', value: g.breadcrumb.slice(0, -1).join(' › ') || g.breadcrumb[0], source: S.breadcrumb,
          why: 'Found in your structured data. Google may show it on computers.' }
      : { id: 'breadcrumb', label: 'Breadcrumb', mark: 'info', value: 'None', source: S.breadcrumb,
          why: 'None found, so Google shows your web address.' },
  )

  rows.push(
    g.datePublished
      ? { id: 'date', label: 'Date', mark: 'info', value: fmtGoogleDate(g.datePublished), source: S.date,
          why: 'From your page markup. Google may show it before the description.' }
      : { id: 'date', label: 'Date', mark: 'info', value: 'None', source: S.date,
          why: 'None found. Fine for pages that are not articles.' },
  )

  const loaded = !!r.image?.status && r.image.status >= 200 && r.image.status < 300
  rows.push(
    loaded
      ? { id: 'thumbnail', label: 'Picture', mark: 'info', value: 'Your share image', source: S.image,
          why: 'Google may show it beside the result, or pick another image or none. Google asks for no logo and no text in it.' }
      : { id: 'thumbnail', label: 'Picture', mark: 'info', value: 'None', source: S.image,
          why: 'No share image loaded. Google may pick one from the page, or show none.' },
  )

  return rows
}

/* ── The copy-paste tag block ─────────────────────────────────────────── */

function attr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export interface TagLine {
  code: string
  /** Why this line differs from the page, when it does. */
  mark?: string
}

/** One meta tag per line, filled with the page's real values. Lines we had to
 * add or change carry a mark that the UI shows as an HTML comment. */
export function buildTagBlock(r: OgCheckResult): TagLine[] {
  const t = r.tags
  const line = (prop: string, value: string, mark?: string): TagLine => ({
    code: `<meta property="${prop}" content="${attr(value)}" />`,
    mark,
  })
  const lines: TagLine[] = []

  if (t.title) {
    const has = titleHasSiteName(t, r.domain)
    lines.push(
      has
        ? line('og:title', stripSiteName(t.title, t, r.domain), 'changed: site name taken out')
        : line('og:title', t.title),
    )
  } else {
    const guess = r.h1 ?? r.htmlTitle ?? ''
    lines.push(line('og:title', guess, guess ? 'missing: this is your page headline, check it' : 'missing: say what the page is'))
  }

  lines.push(
    t.description
      ? line('og:description', t.description)
      : line('og:description', '', 'missing: one line on what the reader gets'),
  )

  lines.push(
    t.type
      ? line('og:type', t.type)
      : line('og:type', 'website', 'missing: use article for a blog post'),
  )

  lines.push(t.url ? line('og:url', t.url) : line('og:url', r.url, 'missing: the page address we read'))

  const img = r.image
  if (!t.image) {
    lines.push(line('og:image', `https://${r.domain}/share-card.png`, 'missing: link your 1200 × 630 card'))
  } else if (img?.location) {
    lines.push(line('og:image', img.location, 'changed: the final address, no redirect'))
  } else {
    lines.push(line('og:image', img?.url ?? t.image))
  }

  if (img?.width && img?.height) {
    const same = t.imageWidth === String(img.width) && t.imageHeight === String(img.height)
    const mark = same ? undefined : t.imageWidth || t.imageHeight ? 'changed: the real size of the file' : 'added: the real size of the file'
    lines.push(line('og:image:width', String(img.width), mark))
    lines.push(line('og:image:height', String(img.height), mark))
  } else if (t.imageWidth && t.imageHeight) {
    lines.push(line('og:image:width', t.imageWidth))
    lines.push(line('og:image:height', t.imageHeight))
  }

  lines.push(
    t.imageAlt
      ? line('og:image:alt', t.imageAlt)
      : line('og:image:alt', '', 'missing: one sentence on what the picture shows'),
  )

  if (t.siteName) lines.push(line('og:site_name', t.siteName))

  return lines
}

export function tagBlockText(lines: TagLine[]): string {
  return lines.map((l) => (l.mark ? `${l.code} <!-- ${l.mark} -->` : l.code)).join('\n')
}
