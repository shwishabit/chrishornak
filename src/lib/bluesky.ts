// Bluesky poster used by the daily cron (src/app/api/cron/bluesky). Plain XRPC over
// fetch, no SDK: log in with an app password, upload images, build link cards and
// clickable links/hashtags, then post one post or a thread (each part replies to the last).
// Docs: https://docs.bsky.app/docs/advanced-guides/posts

export type BlueskyImage = {
  /** Site path under public/, e.g. /images/bluesky/2026-10-16.png */
  src: string
  alt: string
  width: number
  height: number
}

/** One post. A part carries an image OR a link card, never both (Bluesky allows one embed). */
export type BlueskyPart = { text: string; image?: BlueskyImage; link?: string }

/** One calendar day. One part = a single post, 2-4 parts = a thread. */
export type BlueskyPost = { date: string; parts: BlueskyPart[] }

type Ref = { uri: string; cid: string }
type Blob = Record<string, unknown>
type Card = { uri: string; title: string; description: string; image?: string }

const PDS = 'https://bsky.social'
const APPVIEW = 'https://public.api.bsky.app'
export const MAX_GRAPHEMES = 300
const MAX_PARTS = 4
// Bluesky rejects blobs near 1 MB, so stay under it.
const MAX_BLOB_BYTES = 950_000

export function graphemeLength(text: string): number {
  return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].length
}

/** Today's date (YYYY-MM-DD) in New York, so the calendar day matches Chris's day. */
export function todayInNewYork(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Everything wrong with a calendar entry, so a bad post fails before it reaches Bluesky. */
export function validatePost(post: BlueskyPost): string[] {
  const problems: string[] = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) problems.push(`date "${post.date}" is not YYYY-MM-DD`)
  if (post.parts.length < 1 || post.parts.length > MAX_PARTS) {
    problems.push(`${post.parts.length} parts (allowed: 1-${MAX_PARTS})`)
  }
  post.parts.forEach((part, i) => {
    const n = `part ${i + 1}`
    const len = graphemeLength(part.text)
    if (!part.text.trim()) problems.push(`${n}: empty text`)
    if (len > MAX_GRAPHEMES) problems.push(`${n}: ${len} characters (max ${MAX_GRAPHEMES})`)
    if (part.image && part.link) problems.push(`${n}: has an image and a link card (pick one)`)
    if (part.image && !part.image.alt.trim()) problems.push(`${n}: image has no alt text`)
    if (part.image && !part.image.src.startsWith('/')) problems.push(`${n}: image src must be a site path`)
  })
  return problems
}

// Bare domains count as links too (chrishornak.com/tools), so posts can read naturally.
const URL_RE = /\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|marketing|app|io|org|net|social|dev|co)\b(?:\/[^\s]*)?/gi
const TAG_RE = /(^|\s)#([a-z][a-z0-9_]{0,63})/gi

/** Link and hashtag facets. Bluesky indexes them by UTF-8 byte offset, not string index. */
export function buildFacets(text: string) {
  const enc = new TextEncoder()
  const byteAt = (i: number) => enc.encode(text.slice(0, i)).length
  const facets: { index: { byteStart: number; byteEnd: number }; features: Record<string, string>[] }[] = []

  for (const m of text.matchAll(URL_RE)) {
    const raw = m[0].replace(/[.,!?;:)]+$/, '')
    const start = m.index ?? 0
    const uri = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    facets.push({
      index: { byteStart: byteAt(start), byteEnd: byteAt(start + raw.length) },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
    })
  }
  for (const m of text.matchAll(TAG_RE)) {
    const start = (m.index ?? 0) + m[1].length
    facets.push({
      index: { byteStart: byteAt(start), byteEnd: byteAt(start + m[2].length + 1) },
      features: [{ $type: 'app.bsky.richtext.facet#tag', tag: m[2] }],
    })
  }
  return facets
}

async function xrpc<T>(nsid: string, token: string | null, body: BodyInit, contentType = 'application/json'): Promise<T> {
  const res = await fetch(`${PDS}/xrpc/${nsid}`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body,
  })
  if (!res.ok) throw new Error(`${nsid} failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  return res.json() as Promise<T>
}

async function fetchBytes(url: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`could not load ${url} (${res.status})`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  return { bytes, mime: res.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream' }
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function metaContent(html: string, key: string): string | undefined {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, 'i'))?.[0]
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1]
  return content ? decode(content) : undefined
}

/** The page's own share card (OG tags), which is what Bluesky shows for the link. */
async function readCard(uri: string): Promise<Card> {
  const res = await fetch(uri, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`link card: ${uri} returned ${res.status}`)
  const html = await res.text()
  const image = metaContent(html, 'og:image')
  return {
    uri,
    title: metaContent(html, 'og:title') ?? decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? uri),
    description: metaContent(html, 'og:description') ?? metaContent(html, 'description') ?? '',
    image: image ? new URL(image, uri).href : undefined,
  }
}

async function uploadBlob(url: string, token: string): Promise<Blob> {
  const { bytes, mime } = await fetchBytes(url)
  if (bytes.length > MAX_BLOB_BYTES) throw new Error(`${url} is ${bytes.length} bytes (max ${MAX_BLOB_BYTES})`)
  const { blob } = await xrpc<{ blob: Blob }>('com.atproto.repo.uploadBlob', token, bytes as BodyInit, mime)
  return blob
}

async function buildEmbed(part: BlueskyPart, base: string, token: string) {
  if (part.image) {
    const image = await uploadBlob(new URL(part.image.src, base).href, token)
    return {
      $type: 'app.bsky.embed.images',
      images: [{ alt: part.image.alt, image, aspectRatio: { width: part.image.width, height: part.image.height } }],
    }
  }
  if (part.link) {
    const card = await readCard(part.link)
    // A card without its thumbnail still posts; a missing image shouldn't cost the day's post.
    const thumb = card.image ? await uploadBlob(card.image, token).catch(() => undefined) : undefined
    return {
      $type: 'app.bsky.embed.external',
      external: { uri: card.uri, title: card.title, description: card.description, ...(thumb ? { thumb } : {}) },
    }
  }
  return undefined
}

/** True when the day's first post is already on the feed (a re-run, or Chris posted it by hand). */
export async function alreadyPosted(handle: string, firstText: string): Promise<boolean> {
  const url = `${APPVIEW}/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=30&filter=posts_no_replies`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`feed check failed (${res.status})`)
  const { feed } = (await res.json()) as { feed: { post: { record: { text?: string } } }[] }
  return feed.some((item) => item.post.record.text?.trim() === firstText.trim())
}

/** What would post, without logging in or posting: text, length, links, image size, card. */
export async function previewPost(post: BlueskyPost, base: string) {
  return Promise.all(
    post.parts.map(async (part) => ({
      text: part.text,
      characters: graphemeLength(part.text),
      links: buildFacets(part.text).map((f) => f.features[0].uri ?? `#${f.features[0].tag}`),
      image: part.image
        ? { ...part.image, bytes: (await fetchBytes(new URL(part.image.src, base).href)).bytes.length }
        : undefined,
      card: part.link ? await readCard(part.link) : undefined,
    })),
  )
}

/** Posts the day's entry. Each part after the first replies to the one before it. */
export async function publishPost(
  post: BlueskyPost,
  creds: { identifier: string; password: string },
  base: string,
): Promise<Ref[]> {
  const session = await xrpc<{ accessJwt: string; did: string }>(
    'com.atproto.server.createSession',
    null,
    JSON.stringify(creds),
  )
  const refs: Ref[] = []
  for (const [i, part] of post.parts.entries()) {
    const facets = buildFacets(part.text)
    const embed = await buildEmbed(part, base, session.accessJwt)
    const record = {
      $type: 'app.bsky.feed.post',
      text: part.text,
      createdAt: new Date().toISOString(),
      langs: ['en'],
      ...(facets.length ? { facets } : {}),
      ...(embed ? { embed } : {}),
      ...(refs.length ? { reply: { root: refs[0], parent: refs[refs.length - 1] } } : {}),
    }
    try {
      const { uri, cid } = await xrpc<Ref>(
        'com.atproto.repo.createRecord',
        session.accessJwt,
        JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
      )
      refs.push({ uri, cid })
    } catch (err) {
      const done = refs.length ? ` Parts 1-${i} are already posted.` : ''
      throw new Error(`part ${i + 1} of ${post.parts.length} failed.${done} ${err instanceof Error ? err.message : err}`)
    }
  }
  return refs
}
