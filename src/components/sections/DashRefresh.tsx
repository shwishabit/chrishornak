'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestDashRefresh } from '@/app/audit/admin/dashboard/actions'

/* "Refresh now" (2026-10-15). The site can't run the PC jobs, so this leaves a request that
 * dash-refresh.ps1 picks up within 5 minutes (Task Scheduler runs it every 5). Meanwhile the
 * page re-reads itself every 30 seconds until the new data lands, then goes quiet. */

const POLL_MS = 30_000
const GIVE_UP_MS = 10 * 60_000

export function DashRefresh({ refreshed, requested }: { refreshed?: string; requested?: string }) {
  const router = useRouter()
  // Pending = a request newer than the last refresh (also survives a reload).
  const pendingFromServer = !!requested && (!refreshed || Date.parse(requested) > Date.parse(refreshed))
  const [askedAt, setAskedAt] = useState<number | null>(pendingFromServer ? Date.parse(requested!) : null)
  const [failed, setFailed] = useState(false)
  const [done, setDone] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const started = useRef(Date.now())

  // Done when the data's refresh time passes the request time. Say so for a few seconds.
  useEffect(() => {
    if (askedAt && refreshed && Date.parse(refreshed) >= askedAt) {
      setAskedAt(null)
      setDone(true)
    }
  }, [refreshed, askedAt])

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 6000)
    return () => clearTimeout(t)
  }, [done])

  // Count up while we wait, so it is clear something is happening.
  useEffect(() => {
    if (!askedAt) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [askedAt])

  useEffect(() => {
    if (!askedAt) return
    started.current = Date.now()
    const t = setInterval(() => {
      if (Date.now() - started.current > GIVE_UP_MS) {
        clearInterval(t)
        setAskedAt(null)
        setFailed(true)
        return
      }
      router.refresh()
    }, POLL_MS)
    return () => clearInterval(t)
  }, [askedAt, router])

  const secs = askedAt ? Math.max(0, Math.floor((now - askedAt) / 1000)) : 0
  const elapsed = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
  const label = askedAt ? `Waiting for your PC… ${elapsed}` : done ? 'Updated just now' : failed ? 'No answer. Try again' : 'Refresh now'

  return (
    <>
    <button
      type="button"
      disabled={!!askedAt}
      style={askedAt || done ? { opacity: 1, borderColor: '#5fd394', color: '#a8f2c8' } : undefined}
      onClick={async () => {
        setFailed(false)
        setDone(false)
        setAskedAt(Date.now())
        router.refresh()
        const at = await requestDashRefresh().catch(() => null)
        if (!at) {
          setAskedAt(null)
          setFailed(true)
        }
      }}
      title="Reads the page again now, and asks your PC for a fresh pull (your PC must be on). Can take up to 5 minutes."
      className="nx-ghost"
    >
      <svg viewBox="0 0 16 16" className={`h-3 w-3 ${askedAt ? 'animate-spin motion-reduce:animate-none' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" />
      </svg>
      {label}
    </button>
    <span role="status" className="sr-only">{askedAt ? 'Refresh requested. Waiting for your PC.' : done ? 'Dashboard updated.' : failed ? 'Refresh failed.' : ''}</span>
    </>
  )
}
