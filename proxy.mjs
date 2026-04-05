/**
 * Lightweight fetch proxy for the audit tool.
 * Runs on port 3100 alongside Next.js dev server.
 *
 * Usage:  node proxy.mjs
 *
 * The audit tool calls: GET /fetch?url=https://example.com
 * Returns JSON with { url, html, robotsTxt, sitemapXml, headers, statusCode, isHttps }
 *
 * For production, this gets replaced by audit.php on InfinityFree.
 */

import http from 'node:http'

const PORT = 3100
const MAX_HTML = 2 * 1024 * 1024 // 2 MB
const TIMEOUT = 15_000

async function safeFetch(url, signal) {
  try {
    return await fetch(url, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    })
  } catch {
    return null
  }
}

async function safeText(res, max) {
  if (!res || !res.ok) return ''
  const text = await res.text()
  return text.slice(0, max)
}

const server = http.createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`)
  if (reqUrl.pathname !== '/fetch') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found. Use GET /fetch?url=...' }))
    return
  }

  const targetUrl = reqUrl.searchParams.get('url')
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing ?url= parameter' }))
    return
  }

  let parsed
  try {
    parsed = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'URL must use http or https' }))
      return
    }
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid URL' }))
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const [pageRes, robotsRes, sitemapRes] = await Promise.all([
      safeFetch(targetUrl, controller.signal),
      safeFetch(`${parsed.origin}/robots.txt`, controller.signal),
      safeFetch(`${parsed.origin}/sitemap.xml`, controller.signal),
    ])

    clearTimeout(timeout)

    if (!pageRes || !pageRes.ok) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          error: `Could not reach ${parsed.hostname} (${pageRes?.status ?? 'no response'})`,
        }),
      )
      return
    }

    const html = await safeText(pageRes, MAX_HTML)
    const robotsTxt = await safeText(robotsRes, 50_000)
    const sitemapXml = await safeText(sitemapRes, 50_000)

    const headers = {}
    for (const key of [
      'content-security-policy',
      'x-frame-options',
      'strict-transport-security',
      'x-content-type-options',
    ]) {
      const val = pageRes.headers.get(key)
      if (val) headers[key] = val
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        url: pageRes.url,
        html,
        robotsTxt,
        sitemapXml,
        headers,
        statusCode: pageRes.status,
        isHttps: pageRes.url.startsWith('https'),
      }),
    )
  } catch (err) {
    clearTimeout(timeout)
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: `Fetch failed: ${err.message ?? 'Unknown error'}` }))
  }
})

server.listen(PORT, () => {
  console.log(`\n  Audit proxy running at http://localhost:${PORT}`)
  console.log(`  Test: http://localhost:${PORT}/fetch?url=https://example.com\n`)
})
