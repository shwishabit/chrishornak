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
  const started = useRef(Date.now())

  // Done when the data's refresh time passes the request time.
  useEffect(() => {
    if (askedAt && refreshed && Date.parse(refreshed) >= askedAt) setAskedAt(null)
  }, [refreshed, askedAt])

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

  return (
    <button
      type="button"
      disabled={!!askedAt}
      onClick={async () => {
        setFailed(false)
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
      {askedAt ? 'Asked your PC…' : failed ? 'Try again' : 'Refresh now'}
    </button>
  )
}
