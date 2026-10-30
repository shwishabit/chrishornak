// Bluesky poster used by the daily cron (src/app/api/cron/bluesky). Plain XRPC over
// fetch, no SDK: log in with an app password, upload images and videos, build link cards
// and clickable links/hashtags, then post one post or a thread (each part replies to the last).
// Docs: https://docs.bsky.app/docs/advanced-guides/posts · https://docs.bsky.app/docs/tutorials/video

export type BlueskyImage = {
  /** Site path under public/, e.g. /images/bluesky/2026-10-16.png */
  src: string
  alt: string
  width: number
  height: number
}

/** An MP4 under public/, e.g. /videos/bluesky/2026-11-07.mp4. Same shape as an image. */
export type BlueskyVideo = BlueskyImage

/** One post. A part carries one image, one video OR one link card (Bluesky allows one embed). */
export type BlueskyPart = { text: string; image?: BlueskyImage; video?: BlueskyVideo; link?: string }

/** One calendar day. One part = a single post, 2-4 parts = a thread. */
export type BlueskyPost = { date: string; parts: BlueskyPart[] }

type Ref = { uri: string; cid: string }
type Blob = Record<string, unknown>
type Card = { uri: string; title: string; description: string; image?: string }

const PDS = 'https://bsky.social'
const APPVIEW = 'https://public.api.bsky.app'
const VIDEO_SERVICE = 'https://video.bsky.app'
export const MAX_GRAPHEMES = 300
const MAX_PARTS = 4
// Bluesky rejects image blobs near 1 MB, so stay under it.
const MAX_BLOB_BYTES = 950_000
// The PDS caps any blob at 50 MB. Our clips are a few MB; stay well under.
const MAX_VIDEO_BYTES = 40_000_000
// Video processing has to finish inside the cron's 60 s, after login and upload.
const VIDEO_WAIT_MS = 40_000

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
    if ([part.image, part.video, part.link].filter(Boolean).length > 1) {
      problems.push(`${n}: has more than one of image, video, link card (pick one)`)
    }
    if (part.image && !part.image.alt.trim()) problems.push(`${n}: image has no alt text`)
    if (part.image && !part.image.src.startsWith('/')) problems.push(`${n}: image src must be a site path`)
    if (part.video && !part.video.alt.trim()) problems.push(`${n}: video has no alt text`)
    if (part.video && !/^\/.+\.mp4$/.test(part.video.src)) problems.push(`${n}: video src must be a site path to an .mp4`)
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

type Session = { accessJwt: string; did: string; didDoc?: { service?: { id: string; serviceEndpoint: string }[] } }

/** The account's own PDS. Service auth for the video service must name it, not the bsky.social entryway. */
function pdsOf(session: Session): string {
  return session.didDoc?.service?.find((s) => s.id === '#atproto_pds')?.serviceEndpoint ?? PDS
}

type JobStatus = { jobId: string; state: string; blob?: Blob; error?: string; message?: string }

/**
 * Upload through Bluesky's video service, which processes the clip and stores it on the PDS.
 * Waits for processing so the post shows the video at once instead of a blank player.
 */
async function uploadVideo(url: string, session: Session): Promise<Blob> {
  const { bytes } = await fetchBytes(url)
  if (bytes.length > MAX_VIDEO_BYTES) throw new Error(`${url} is ${bytes.length} bytes (max ${MAX_VIDEO_BYTES})`)

  const pds = pdsOf(session)
  const exp = Math.floor(Date.now() / 1000) + 30 * 60
  const authUrl = `${pds}/xrpc/com.atproto.server.getServiceAuth?aud=${encodeURIComponent(`did:web:${new URL(pds).host}`)}&lxm=com.atproto.repo.uploadBlob&exp=${exp}`
  const authRes = await fetch(authUrl, { headers: { Authorization: `Bearer ${session.accessJwt}` } })
  if (!authRes.ok) throw new Error(`video auth failed (${authRes.status}): ${(await authRes.text()).slice(0, 300)}`)
  const { token } = (await authRes.json()) as { token: string }

  const name = url.split('/').pop() ?? 'video.mp4'
  const upRes = await fetch(
    `${VIDEO_SERVICE}/xrpc/app.bsky.video.uploadVideo?did=${encodeURIComponent(session.did)}&name=${encodeURIComponent(name)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'video/mp4' }, body: bytes as BodyInit },
  )
  // A clip uploaded before comes back as 409 with its existing job, which still gives us the blob.
  const job = (await upRes.json().catch(() => ({}))) as Partial<JobStatus>
  if (!upRes.ok && !job.jobId) throw new Error(`video upload failed (${upRes.status}): ${JSON.stringify(job).slice(0, 300)}`)
  if (job.blob) return job.blob

  const deadline = Date.now() + VIDEO_WAIT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500))
    const res = await fetch(`${VIDEO_SERVICE}/xrpc/app.bsky.video.getJobStatus?jobId=${encodeURIComponent(job.jobId!)}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) continue
    const { jobStatus } = (await res.json()) as { jobStatus: JobStatus }
    if (jobStatus.blob) return jobStatus.blob
    if (jobStatus.state === 'JOB_STATE_FAILED') throw new Error(`video processing failed: ${jobStatus.error ?? jobStatus.message ?? 'no reason given'}`)
  }
  throw new Error(`video still processing after ${VIDEO_WAIT_MS / 1000} s`)
}

async function buildEmbed(part: BlueskyPart, base: string, session: Session) {
  const token = session.accessJwt
  if (part.video) {
    const video = await uploadVideo(new URL(part.video.src, base).href, session)
    return {
      $type: 'app.bsky.embed.video',
      video,
      alt: part.video.alt,
      aspectRatio: { width: part.video.width, height: part.video.height },
    }
  }
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
      video: part.video
        ? { ...part.video, bytes: (await fetchBytes(new URL(part.video.src, base).href)).bytes.length }
        : undefined,
      card: part.link ? await readCard(part.link) : undefined,
    })),
  )
}

/**
 * Posts the day's entry. Each part after the first replies to the one before it.
 * A video that fails to upload or process doesn't cost the day's post: the part goes out
 * as text and the reason lands in `warnings` for the cron to email.
 */
export async function publishPost(
  post: BlueskyPost,
  creds: { identifier: string; password: string },
  base: string,
  warnings: string[] = [],
): Promise<Ref[]> {
  const session = await xrpc<Session>('com.atproto.server.createSession', null, JSON.stringify(creds))
  const refs: Ref[] = []
  for (const [i, part] of post.parts.entries()) {
    const facets = buildFacets(part.text)
    const embed = await buildEmbed(part, base, session).catch((err) => {
      if (!part.video) throw err
      warnings.push(`part ${i + 1}: posted without its video. ${err instanceof Error ? err.message : err}`)
      return undefined
    })
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
