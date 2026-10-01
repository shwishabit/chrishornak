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
      rule: 'At least 1200 × 630',
      sources: [SOURCES.meta],
    }
    if (hasDims) {
      row.value = `${w} × ${h}`
      if (w! >= 1200 && h! >= 630) row.status = 'pass'
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
}): OgCheckResult {
  const { tags, htmlTitle, h1 } = readPage(input.html)
  const domain = bareHost(input.url)
  const checks = buildChecks(tags, input.image, domain)
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
  }
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
