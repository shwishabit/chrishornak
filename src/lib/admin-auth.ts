/* ── Admin auth (server-only) ─────────────────────────────────────────────
 * Single-admin passphrase gate for /audit/admin. The passphrase lives in the
 * ADMIN_KEY env var (Vercel + local .env.local). A correct passphrase sets an
 * httpOnly cookie scoped to /audit/admin; every render re-checks it server-side.
 * No user table, no session store — deliberately minimal for a one-person tool.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { cookies } from 'next/headers'

const COOKIE = 'ch_admin'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function adminKey(): string | undefined {
  const k = process.env.ADMIN_KEY
  return k && k.length > 0 ? k : undefined
}

/** True only when ADMIN_KEY is configured AND the cookie matches it. */
export async function isAdmin(): Promise<boolean> {
  const key = adminKey()
  if (!key) return false
  const jar = await cookies()
  return jar.get(COOKIE)?.value === key
}

export async function setAdminCookie(): Promise<void> {
  const key = adminKey()
  if (!key) return
  const jar = await cookies()
  jar.set(COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/audit/admin',
    maxAge: MAX_AGE,
  })
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete({ name: COOKIE, path: '/audit/admin' })
}
