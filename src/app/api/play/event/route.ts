/* ── POST /api/play/event ─────────────────────────────────────────────────
 * Anonymous play counts for the games under /play/ (Block Sector first, 2026-11-11). The game sends one small event
 * with navigator.sendBeacon: page open, intro watched, run ended, left mid-run, and (2026-11-12) the one-tap rating after a run. Fire-and-forget: a failure here must
 * never touch the game.
 *
 * Anonymous by design: a random per-device id made by the game, no name, no email, no cookies, and the IP is used
 * only for the in-memory rate limit (never stored). Every field is whitelisted and clamped here; unknown keys drop.
 * Rows land in game_events (migration 0024): insert-only for the anon key, no row is readable from outside.
 * ─────────────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const RATE_WINDOW = 60_000
const RATE_LIMIT = 30
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

const GAMES = new Set(['project-iq'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BUILD = /^[\w.-]{1,32}$/

type Field = { n: number } | { b: true } | { s: readonly string[] } | { re: RegExp }
const int = (n: number): Field => ({ n })
const bool: Field = { b: true }
const one = (...s: string[]): Field => ({ s })
const text = (re: RegExp): Field => ({ re })

/** What each kind may carry. Numbers are whole numbers from 0 to the cap. */
const SHAPE: Record<string, Record<string, Field>> = {
  open: { new: bool, day: int(3650), app: bool, runs: int(100000) },
  intro: { secs: int(600), len: int(600), how: one('end', 'skip', 'error'), from: one('first', 'howto') },
  // dead / rage / mood: Block Sector 3.48 quiet signals (taps that did nothing, fast-tap bursts in one spot, danger step at the end)
  run: { n: int(100000), wave: int(999), score: int(1_000_000_000), secs: int(36000), takes: int(1_000_000), how: one('lost', 'ended', 'restart', 'menu', 'idle'), dead: int(100000), rage: int(10000), mood: int(9),
    // Block Sector 3.68: one row per puzzle, "level:type:misses:lost" comma-separated (type = 2-letter codes, + joins a hard sector's)
    // (game_events.data must stay under 2 KB: migration 0024 check; 1,500 chars ≈ 160 puzzles)
    pz: text(/^[0-9a-z:+,]{1,1500}$/), pzN: int(1000) },
  away: { wave: int(999), secs: int(36000) },
  // 3.48 the one tap after a run (needs migration 0025: kind 'rate')
  rate: { n: int(100000), feel: one('hard', 'right', 'easy'), wave: int(999), secs: int(36000) },
}

function clean(kind: string, raw: unknown): Record<string, number | boolean | string> {
  const out: Record<string, number | boolean | string> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, f] of Object.entries(SHAPE[kind])) {
    const v = (raw as Record<string, unknown>)[k]
    if (v === undefined) continue
    if ('n' in f) {
      const n = Math.round(Number(v))
      if (Number.isFinite(n)) out[k] = Math.max(0, Math.min(f.n, n))
    } else if ('b' in f) {
      out[k] = v === true
    } else if ('re' in f) {
      if (typeof v === 'string' && f.re.test(v)) out[k] = v
    } else if (typeof v === 'string' && f.s.includes(v)) {
      out[k] = v
    }
  }
  return out
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) return NextResponse.json({ ok: false }, { status: 429 })

  let b: Record<string, unknown>
  try {
    // sendBeacon posts text/plain; parse the text either way
    const text = await req.text()
    if (text.length > 4096) return NextResponse.json({ ok: false }, { status: 413 })
    b = JSON.parse(text)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const game = String(b?.game ?? '')
  const build = String(b?.build ?? '')
  const player = String(b?.player ?? '')
  const visit = String(b?.visit ?? '')
  const kind = String(b?.kind ?? '')
  if (!GAMES.has(game) || !BUILD.test(build) || !UUID.test(player) || !UUID.test(visit) || !(kind in SHAPE)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ ok: true, stored: false })

  const { error } = await supabase.from('game_events').insert({ game, build, player, visit, kind, data: clean(kind, b.data) })
  if (error) {
    console.error('[play/event] insert failed:', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
