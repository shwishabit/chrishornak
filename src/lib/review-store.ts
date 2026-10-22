/* ── Client review store (server-only) ────────────────────────────────────
 * Backs /review/<token>. Two backends behind one interface:
 *   - supabase: the 0023_client-reviews RPCs (production).
 *   - file: .review-data/reviews.json, for local testing before the tables
 *     exist. Used when REVIEW_STORE=file, or when Supabase is unconfigured in
 *     development. Never used in production.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { getSupabase } from '@/lib/supabase'
import { adminKey } from '@/lib/admin-auth'

export type Reaction = '' | 'like' | 'dislike' | 'change'

export interface ReviewComment {
  reaction: Reaction
  note: string
  updated_at: string
}

export interface ReviewRecord {
  slug: string
  token: string
  title: string
  client_name: string
  status: 'open' | 'final'
  finalized_at: string | null
  created_at: string
}

export interface ReviewState {
  slug: string
  title: string
  client_name: string
  status: 'open' | 'final'
  finalized_at: string | null
  comments: Record<string, ReviewComment>
}

export const REACTIONS: Reaction[] = ['', 'like', 'dislike', 'change']
export const SECTION_KEY = /^[A-Za-z0-9_-]{1,40}$/
export const NOTE_MAX = 4000

export function newToken(): string {
  return randomBytes(18).toString('base64url')
}

function useFileStore(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return process.env.REVIEW_STORE === 'file' || !getSupabase()
}

/* ── file backend ─────────────────────────────────────────────────────── */

interface FileDb {
  reviews: ReviewRecord[]
  comments: Record<string, Record<string, ReviewComment>>
}

const FILE = path.join(process.cwd(), '.review-data', 'reviews.json')

async function readDb(): Promise<FileDb> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as FileDb
  } catch {
    return { reviews: [], comments: {} }
  }
}

async function writeDb(db: FileDb): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(db, null, 2))
}

// One read-modify-write at a time, so two saves landing together don't drop one.
let queue: Promise<unknown> = Promise.resolve()
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.catch(() => undefined)
  return run
}

function stateOf(r: ReviewRecord, comments: Record<string, ReviewComment> = {}): ReviewState {
  return { slug: r.slug, title: r.title, client_name: r.client_name, status: r.status, finalized_at: r.finalized_at, comments }
}

/* ── public API ───────────────────────────────────────────────────────── */

export async function getReview(token: string): Promise<ReviewState | null> {
  if (useFileStore()) {
    const db = await readDb()
    const r = db.reviews.find((x) => x.token === token)
    return r ? stateOf(r, db.comments[r.token]) : null
  }
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.rpc('review_get', { p_token: token })
  if (error) throw new Error(`review_get: ${error.message}`)
  return (data as ReviewState | null) ?? null
}

/** Saves one section. False when the review is missing or already final. */
export async function saveComment(token: string, section: string, reaction: Reaction, note: string): Promise<boolean> {
  if (useFileStore()) {
    return locked(async () => {
      const db = await readDb()
      const r = db.reviews.find((x) => x.token === token)
      if (!r || r.status !== 'open') return false
      db.comments[token] = db.comments[token] ?? {}
      db.comments[token][section] = { reaction, note: note.slice(0, NOTE_MAX), updated_at: new Date().toISOString() }
      await writeDb(db)
      return true
    })
  }
  const sb = getSupabase()
  if (!sb) return false
  const { data, error } = await sb.rpc('review_save', { p_token: token, p_section: section, p_reaction: reaction, p_note: note })
  if (error) throw new Error(`review_save: ${error.message}`)
  return data === true
}

/** Locks the review. Returns the final state, or null if it was missing or already final. */
export async function finalizeReview(token: string): Promise<ReviewState | null> {
  if (useFileStore()) {
    return locked(async () => {
      const db = await readDb()
      const r = db.reviews.find((x) => x.token === token)
      if (!r || r.status !== 'open') return null
      r.status = 'final'
      r.finalized_at = new Date().toISOString()
      await writeDb(db)
      return stateOf(r, db.comments[token])
    })
  }
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.rpc('review_finalize', { p_token: token })
  if (error) throw new Error(`review_finalize: ${error.message}`)
  return (data as ReviewState | null) ?? null
}

export async function listReviews(): Promise<(ReviewRecord & { comment_count: number })[]> {
  if (useFileStore()) {
    const db = await readDb()
    return db.reviews
      .map((r) => ({ ...r, comment_count: Object.keys(db.comments[r.token] ?? {}).length }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return []
  const { data, error } = await sb.rpc('reviews_admin', { p_secret: key })
  if (error) throw new Error(`reviews_admin: ${error.message}`)
  return (data ?? []) as (ReviewRecord & { comment_count: number })[]
}

export async function createReview(slug: string, title: string, clientName: string): Promise<ReviewRecord> {
  const token = newToken()
  if (useFileStore()) {
    return locked(async () => {
      const db = await readDb()
      if (db.reviews.some((x) => x.slug === slug)) throw new Error(`A review for "${slug}" already exists.`)
      const r: ReviewRecord = { slug, token, title, client_name: clientName, status: 'open', finalized_at: null, created_at: new Date().toISOString() }
      db.reviews.push(r)
      await writeDb(db)
      return r
    })
  }
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) throw new Error('Supabase or ADMIN_KEY is not configured.')
  const { data, error } = await sb.rpc('review_create', { p_secret: key, p_slug: slug, p_token: token, p_title: title, p_client: clientName })
  if (error) throw new Error(`review_create: ${error.message}`)
  return { slug, token, title, client_name: clientName, status: 'open', finalized_at: null, created_at: (data as { created_at: string }).created_at }
}

export async function reopenReview(slug: string): Promise<boolean> {
  if (useFileStore()) {
    return locked(async () => {
      const db = await readDb()
      const r = db.reviews.find((x) => x.slug === slug)
      if (!r) return false
      r.status = 'open'
      r.finalized_at = null
      await writeDb(db)
      return true
    })
  }
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return false
  const { data, error } = await sb.rpc('review_reopen', { p_secret: key, p_slug: slug })
  if (error) throw new Error(`review_reopen: ${error.message}`)
  return data === true
}
