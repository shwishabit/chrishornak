/* ── GET /api/og-check?url= ────────────────────────────────────────────────
 * The OG image checker's one server call. Reads the page once and the
 * og:image once (no redirect following), measures the image
 * from its own bytes, runs the 8 checks in lib/og-check.ts, and logs the
 * domain + failed check ids (no IP, no full URL) to og_checks.
 * ─────────────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse, after } from 'next/server'
import {
  IMAGE_HEADERS,
  FETCH_TIMEOUT,
  clientIp,
  createRateLimiter,
  fetchPageWithRetry,
  pageErrorMessage,
  resolveAndCheck,
} from '@/lib/fetch-guard'
import {
  bareHost,
  buildResult,
  readImageSize,
  readPage,
  type ImageFacts,
  type OgCheckResult,
} from '@/lib/og-check'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const MAX_HTML = 2 * 1024 * 1024 // 2 MB, same as /api/audit
const MAX_IMAGE = 8 * 1024 * 1024 // Meta's limit; stop reading past it
const MAX_INLINE = 2.5 * 1024 * 1024 // embed as data: URI up to this (response stays under Vercel's 4.5 MB)

const isRateLimited = createRateLimiter(10, 60_000)

/* ── The one image fetch ────────────────────────────────────────────────── */

async function fetchImage(url: string): Promise<ImageFacts> {
  const facts: ImageFacts = { url }
  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return facts
  }
  if (await resolveAndCheck(host)) return facts

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: IMAGE_HEADERS,
      redirect: 'manual',
    })
    facts.status = res.status
    facts.contentType = res.headers.get('content-type') ?? undefined
    const loc = res.headers.get('location')
    if (res.status >= 300 && res.status < 400 && loc) {
      try {
        facts.location = new URL(loc, url).toString()
      } catch {
        facts.location = loc
      }
    }
    if (res.status < 200 || res.status >= 300 || !res.body) {
      await res.body?.cancel()
      return facts
    }

    // Read up to the cap, then stop.
    const chunks: Uint8Array[] = []
    let total = 0
    const reader = res.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.byteLength
      if (total > MAX_IMAGE) {
        facts.bytesOver = true
        await reader.cancel()
        break
      }
    }
    const bytes = new Uint8Array(total)
    let off = 0
    for (const c of chunks) {
      bytes.set(c, off)
      off += c.byteLength
    }
    const declared = Number(res.headers.get('content-length'))
    facts.bytes = facts.bytesOver && declared > total ? declared : total

    const size = readImageSize(bytes)
    if (size) {
      facts.width = size.width
      facts.height = size.height
      facts.format = size.format
    }
    const isImage = !!facts.contentType && /^image\//i.test(facts.contentType)
    if (isImage && !facts.bytesOver) {
      if (total <= MAX_INLINE) {
        const type = facts.contentType!.split(';')[0].trim()
        facts.dataUri = `data:${type};base64,${Buffer.from(bytes).toString('base64')}`
      } else {
        facts.tooBigToShow = true
      }
    } else if (isImage) {
      facts.tooBigToShow = true
    }
    return facts
  } catch {
    return facts
  } finally {
    clearTimeout(timeout)
  }
}

/* ── Log (domain + check ids only) ──────────────────────────────────────── */

function logCheck(row: {
  domain: string
  passed: number
  failed: string[]
  warned: string[]
  status: 'completed' | 'error'
}) {
  after(async () => {
    const sb = getSupabase()
    if (!sb || !row.domain.includes('.')) return
    await sb.from('og_checks').insert(row)
  })
}

/* ── Handler ────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  if (isRateLimited(clientIp(request.headers))) {
    return NextResponse.json(
      { error: 'Too many checks. Please wait a minute and try again.' },
      { status: 429 },
    )
  }

  const targetUrl = request.nextUrl.searchParams.get('url')
  if (!targetUrl) {
    return NextResponse.json({ error: 'Paste a link to check.' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol')
  } catch {
    return NextResponse.json(
      { error: 'That doesn’t look like a web address. Try yoursite.com/page.' },
      { status: 400 },
    )
  }

  if (await resolveAndCheck(parsed.hostname)) {
    return NextResponse.json(
      { error: 'Cannot fetch internal or private addresses' },
      { status: 400 },
    )
  }

  const page = await fetchPageWithRetry(targetUrl, MAX_HTML)
  const pageError = pageErrorMessage(page, parsed.hostname)
  if (!page || pageError) {
    logCheck({ domain: bareHost(targetUrl), passed: 0, failed: [], warned: [], status: 'error' })
    return NextResponse.json({ error: pageError }, { status: 502 })
  }

  const { tags } = readPage(page.body)
  let image: ImageFacts | null = null
  if (tags.image) {
    let resolved: string | null = null
    try {
      resolved = new URL(tags.image, page.finalUrl).toString()
    } catch {
      resolved = null
    }
    image = resolved && /^https?:/i.test(resolved) ? await fetchImage(resolved) : { url: tags.image }
  }

  const result: OgCheckResult = buildResult({ url: page.finalUrl, html: page.body, image })

  logCheck({
    domain: result.domain,
    passed: result.passed,
    failed: result.checks.filter((c) => c.status === 'fail').map((c) => c.id),
    warned: result.checks.filter((c) => c.status === 'warn').map((c) => c.id),
    status: 'completed',
  })

  return NextResponse.json(result, { status: 200 })
}
