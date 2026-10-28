'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReviewState, Reaction } from '@/lib/review-store'

export type Comments = ReviewState['comments']
export type SaveState = 'idle' | 'saving' | 'saved' | 'error'
export type Update = (key: string, patch: Partial<{ reaction: Reaction; note: string }>) => void

const SAVE_DELAY = 700

/** Autosave for one review link: each key saves on its own after a short pause,
 * everything pending saves when the tab is hidden, and finalize locks it. */
export function useReviewSave(token: string, initial: ReviewState) {
  const [comments, setComments] = useState<Comments>(initial.comments)
  const [status, setStatus] = useState(initial.status)
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pending = useRef<Record<string, { reaction: Reaction; note: string }>>({})
  const locked = status !== 'open'

  const flush = useCallback(
    async (key: string) => {
      const body = pending.current[key]
      if (!body) return
      delete pending.current[key]
      setSaveState((s) => ({ ...s, [key]: 'saving' }))
      try {
        // keepalive: a save that starts as the tab closes or a phone switches apps still lands.
        const res = await fetch(`/api/review/${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: key, ...body }),
          keepalive: true,
        })
        if (res.status === 409) setStatus('final')
        setSaveState((s) => ({ ...s, [key]: res.ok ? 'saved' : 'error' }))
      } catch {
        setSaveState((s) => ({ ...s, [key]: 'error' }))
      }
    },
    [token],
  )

  const update: Update = useCallback(
    (key, patch) => {
      if (locked) return
      setComments((prev) => {
        const cur = prev[key] ?? { reaction: '' as Reaction, note: '', updated_at: '' }
        const next = { ...cur, ...patch }
        pending.current[key] = { reaction: next.reaction, note: next.note }
        return { ...prev, [key]: next }
      })
      clearTimeout(timers.current[key])
      timers.current[key] = setTimeout(() => flush(key), patch.reaction !== undefined ? 0 : SAVE_DELAY)
    },
    [flush, locked],
  )

  const flushAll = useCallback(async () => {
    Object.values(timers.current).forEach(clearTimeout)
    await Promise.all(Object.keys(pending.current).map((k) => flush(k)))
  }, [flush])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushAll()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [flushAll])

  /** Saves everything, then locks the review. True when it is locked. */
  const finalize = useCallback(async (): Promise<boolean> => {
    setSending(true)
    setSendError('')
    await flushAll()
    let ok = false
    try {
      const res = await fetch(`/api/review/${token}/finalize`, { method: 'POST' })
      if (res.ok || res.status === 409) {
        setStatus('final')
        ok = true
      } else {
        setSendError('Something went wrong. Please try again in a minute.')
      }
    } catch {
      setSendError('Could not reach the server. Check your connection and try again.')
    }
    setSending(false)
    return ok
  }, [flushAll, token])

  return { comments, locked, saveState, update, finalize, sending, sendError }
}
