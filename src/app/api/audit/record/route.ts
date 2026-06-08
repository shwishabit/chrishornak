/* ── POST /api/audit/record ───────────────────────────────────────────────
 * Captures one completed audit into the benchmark corpus and returns where the
 * site stands vs. everyone else. Called fire-and-forget by the client after a
 * score renders — a failure here must never affect the user's audit.
 *
 * Server-authoritative: re-derives the registrable domain, clamps scores,
 * whitelists categories, caps the issues array. Stats are directional, not
 * financial, so v1 trusts the client's numbers within those bounds.
 * ─────────────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { TBL_AUDIT_RUNS, RPC_RANK, CATEGORY_ORDER } from '@/lib/benchmark-config'

export const dynamic = 'force-dynamic'

const RATE_WINDOW = 60_000
const RATE_LIMIT = 15
const rateMap = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (rateMap.get(ip) ?? []).filter((t) => t > now - RATE_WINDOW)
  if (hits.length >= RATE_LIMIT) {
    rateMap.set(ip, hits)
    return true
  }
  hits.push(now)
  rateMap.set(ip, hits)
  return false
}

const CATEGORIES = new Set<string>(CATEGORY_ORDER)

function registrableDomain(input: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    return host.includes('.') ? host : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const b = body as Record<string, unknown>

  const domain = registrableDomain(String(b?.domain ?? ''))
  const overall = Math.round(Number(b?.overall))
  if (!domain || !Number.isFinite(overall) || overall < 0 || overall > 100) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Whitelist + clamp category scores
  const categoryScores: Record<string, number> = {}
  if (b?.categoryScores && typeof b.categoryScores === 'object') {
    for (const [k, v] of Object.entries(b.categoryScores as Record<string, unknown>)) {
      if (!CATEGORIES.has(k)) continue
      const n = Math.round(Number(v))
      if (Number.isFinite(n) && n >= 0 && n <= 100) categoryScores[k] = n
    }
  }

  // Sanitize issues (fails + warns only), cap at 60
  const issues: { c: string; l: string; s: string }[] = []
  if (Array.isArray(b?.issues)) {
    for (const raw of (b.issues as unknown[]).slice(0, 60)) {
      const it = raw as Record<string, unknown>
      const c = String(it?.c ?? '')
      const l = String(it?.l ?? '').slice(0, 120)
      const s = String(it?.s ?? '')
      if (CATEGORIES.has(c) && l && (s === 'fail' || s === 'warn')) {
        issues.push({ c, l, s })
      }
    }
  }

  const sb = getSupabase()
  if (!sb) {
    // Analytics not configured — succeed silently so the client badge no-ops.
    return NextResponse.json({ ok: true, n: 0, betterThanPct: null })
  }

  const { error } = await sb.from(TBL_AUDIT_RUNS).insert({
    domain,
    overall_score: overall,
    category_scores: categoryScores,
    issues,
    status: 'completed',
    is_synthetic: false,
  })
  if (error) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  const { data: rank } = await sb.rpc(RPC_RANK, { p_score: overall })
  return NextResponse.json({
    ok: true,
    n: Number(rank?.n ?? 0),
    betterThanPct: rank?.better_than_pct ?? null,
  })
}
