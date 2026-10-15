'use client'

import { useEffect, useRef, useState } from 'react'
import { fmtMins, nyDate } from '@/lib/dash-feed'
import { SCALE, chime, isMuted, setMuted as saveMuted } from '@/lib/dash-sound'
import { onWins, type Win } from '@/lib/dash-wins'
import { brandChip } from '@/lib/dash-format'
import { CopyButton } from './DashParts'

/* Wins (2026-10-15, Chris: "a dopamine fix area… in gaming they call this juicy").
 * Lives inside the Today card. Every 30 minutes of finished work is a level; the ring
 * fills toward the next one. One pip per win, in its brand's color. A finish plays a
 * SOFT chime (Chris: no sharp sounds) that steps up for back-to-back wins, with a +Nm
 * float and a pop; level-ups get a rise and a glow.
 * Day streak: days in a row with at least one win. Weekdays build it; a weekend never
 * breaks it but counts when worked. Today's first win extends it with its own chime.
 * Recap: today's wins by brand, ready to copy or to turn into a LinkedIn post.
 * Motion respects prefers-reduced-motion. */

const LEVEL_MINS = 30
const COMBO_WINDOW_MS = 3 * 60_000
const PIP: Record<string, string> = { 'Swift Growth': 'bg-[#e8955f]', 'Blog Hands': 'bg-[#8fb2e8]', 'Chris Hornak': 'bg-[#c9f5dc]' }

const shiftDay = (d: string, n: number) => {
  const x = new Date(d + 'T12:00:00Z')
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}
const weekday = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay() // 0 Sun … 6 Sat

/** Days in a row with a win, ending today (or yesterday if today has none yet). Weekends never break it. */
function streakOf(days: Set<string>, today: string, todayWon: boolean): number {
  let n = todayWon ? 1 : 0
  let d = shiftDay(today, -1)
  for (let i = 0; i < 90; i++, d = shiftDay(d, -1)) {
    if (days.has(d)) n++
    else if (weekday(d) !== 0 && weekday(d) !== 6) break
  }
  return n
}

export function DashWins({ initial, days }: { initial: Win[]; days: string[] }) {
  const today = nyDate()
  const past = new Set(days.filter((d) => d !== today))
  const [wins, setWins] = useState(initial)
  const [muted, setMuted] = useState(false)
  const [floats, setFloats] = useState<{ key: number; text: string }[]>([])
  const [pop, setPop] = useState(0)
  const [levelUp, setLevelUp] = useState(false)
  const [recap, setRecap] = useState(false)
  const combo = useRef({ n: 0, at: 0 })
  const winsRef = useRef(wins)
  winsRef.current = wins

  useEffect(() => setMuted(isMuted()), [])

  const float = (text: string, delay = 0) => {
    const key = Date.now() + Math.random()
    setTimeout(() => setFloats((f) => [...f, { key, text }]), delay)
    setTimeout(() => setFloats((f) => f.filter((x) => x.key !== key)), delay + 1400)
  }

  useEffect(
    () =>
      onWins(
        (w) => {
          if (winsRef.current.some((x) => x.id === w.id)) return
          const before = winsRef.current.reduce((t, x) => t + x.mins, 0)
          const after = before + w.mins
          const leveled = Math.floor(after / LEVEL_MINS) > Math.floor(before / LEVEL_MINS)
          const firstToday = winsRef.current.length === 0
          const now = Date.now()
          combo.current = { n: now - combo.current.at < COMBO_WINDOW_MS ? Math.min(combo.current.n + 1, SCALE.length - 2) : 0, at: now }
          const i = combo.current.n
          if (firstToday) chime([SCALE[0], SCALE[2], SCALE[4], SCALE[6]], 0.1)
          else chime(leveled ? [SCALE[2], SCALE[4], SCALE[6]] : [SCALE[i], SCALE[i + 1]], leveled ? 0.11 : 0.08)
          setWins((cur) => [...cur, w])
          setPop((p) => p + 1)
          float(i > 0 ? `+${fmtMins(w.mins)} · combo ×${i + 1}` : `+${fmtMins(w.mins)}`)
          if (firstToday) float(`Streak ${streakOf(past, today, true)}!`, 500)
          if (leveled) {
            setLevelUp(true)
            setTimeout(() => setLevelUp(false), 1800)
          }
        },
        (id) => setWins((cur) => cur.filter((x) => x.id !== id)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const mins = wins.reduce((t, w) => t + w.mins, 0)
  const level = Math.floor(mins / LEVEL_MINS) + 1
  const into = mins % LEVEL_MINS
  const streak = streakOf(past, today, wins.length > 0)
  const week = Array.from({ length: 7 }, (_, k) => shiftDay(today, k - 6))
  const R = 27
  const C = 2 * Math.PI * R
  const pad2 = (n: number) => String(n).padStart(2, '0')

  return (
    <section aria-labelledby="today-h" className="relative min-w-0">
      <style>{`
        @keyframes dash-float { from { opacity: 0; transform: translateY(6px) } 15% { opacity: 1 } to { opacity: 0; transform: translateY(-34px) } }
        @keyframes dash-pop { 0% { transform: scale(1) } 35% { transform: scale(1.18) } 100% { transform: scale(1) } }
        @keyframes dash-pip { from { transform: scale(0) } 70% { transform: scale(1.35) } to { transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) { .dash-anim { animation: none !important } }
      `}</style>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="today-h" className="text-xl font-normal tracking-[0.02em]">Today</h2>
        <span className="nx-lab !tracking-[0.14em]">
          Level {pad2(level)} · streak {streak} {streak === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Wins in one row: ring, count + level line, then the last 7 days on the right. */}
      <div className="mt-4 flex items-center gap-3.5">
        <div className={`relative h-10 w-10 shrink-0 transition-shadow duration-500 ${levelUp ? 'shadow-[0_0_18px_2px_rgba(95,211,148,.45)]' : ''}`}>
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="5" stroke="#1a1d22" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              strokeWidth="5"
              stroke="#5fd394"
              className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - into / LEVEL_MINS)}
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p key={`n-${pop}`} className="dash-anim" style={{ animation: pop ? 'dash-pop 420ms ease-out' : undefined }}>
            <span className="nx-num text-2xl">{wins.length}</span>{' '}
            <span className="text-[#a6aab2]">
              win{wins.length === 1 ? '' : 's'} · {fmtMins(mins)}
            </span>
          </p>
          <p className="nx-lab mt-0.5 !tracking-[0.1em]">
            {levelUp ? (
              <span className="!text-primary">Level up! Now level {pad2(level)}</span>
            ) : wins.length === 0 ? (
              'finish one thing to get going'
            ) : (
              `${fmtMins(LEVEL_MINS - into)} to level ${pad2(level + 1)}`
            )}
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-[repeat(7,8px)] gap-1" aria-label="Last 7 days">
          {week.map((d) => {
            const won = past.has(d) || (d === today && wins.length > 0)
            const weekend = weekday(d) === 0 || weekday(d) === 6
            return (
              <span
                key={d}
                title={`${new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${won ? ' · win' : ''}`}
                className={`h-2 w-2 ${won ? 'bg-[#5fd394]' : weekend ? 'bg-[#22262c]' : 'bg-[#2e333b]'}`}
              />
            )
          })}
        </div>
      </div>

      {wins.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1" aria-label={`${wins.length} wins today`}>
          {wins.slice(-60).map((w) => (
            <span
              key={w.id}
              title={`${w.title}${w.brand ? ` · ${w.brand}` : ''} · ${fmtMins(w.mins)}`}
              className={`dash-anim h-2 w-2 ${w.brand && PIP[w.brand] ? PIP[w.brand] : 'bg-[#6b7079]'}`}
              style={{ animation: 'dash-pip 380ms ease-out' }}
            />
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center justify-end gap-1">
        <button type="button" onClick={() => setRecap(true)} className="nx-lab inline-flex min-h-11 items-center px-2 hover:!text-[#d9d6cf] md:min-h-0 md:py-1">
          Recap
        </button>
        <button
          type="button"
          onClick={() => {
            const m = !muted
            setMuted(m)
            saveMuted(m)
            if (!m) chime([SCALE[0], SCALE[2]], 0.09, true)
          }}
          aria-pressed={!muted}
          className="nx-lab inline-flex min-h-11 items-center px-2 hover:!text-[#d9d6cf] md:min-h-0 md:py-1"
        >
          {muted ? 'Sound off' : 'Sound on'}
        </button>
      </div>

      {floats.map((f) => (
        <span
          key={f.key}
          aria-hidden="true"
          className="dash-anim pointer-events-none absolute right-2 top-10 whitespace-nowrap text-sm font-medium text-primary"
          style={{ animation: 'dash-float 1300ms ease-out forwards' }}
        >
          {f.text}
        </span>
      ))}
      <p className="sr-only" aria-live="polite">
        {wins.length ? `${wins.length} wins, ${fmtMins(mins)} done, level ${level}, ${streak}-day streak` : ''}
      </p>

      {recap && <Recap wins={wins} mins={mins} streak={streak} onClose={() => setRecap(false)} />}
    </section>
  )
}

/** End-of-day recap: today's wins by brand, with copy buttons for a plain list and a LinkedIn draft. */
function Recap({ wins, mins, streak, onClose }: { wins: Win[]; mins: number; streak: number; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])
  const groups = new Map<string, Win[]>()
  for (const w of wins) groups.set(w.brand || 'Other', [...(groups.get(w.brand || 'Other') ?? []), w])
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
  const text = [
    `${date}: ${wins.length} wins, ${fmtMins(mins)} done${streak > 1 ? `, ${streak}-day streak` : ''}.`,
    ...[...groups.entries()].flatMap(([b, ws]) => [``, `${b}:`, ...ws.map((w) => `- ${w.title}${w.note ? ` (${w.note})` : ''}`)]),
  ].join('\n')

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/90 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="recap-h" className="nx-box max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="recap-h" className="text-lg font-normal">Today&apos;s recap</h2>
          <button type="button" onClick={onClose} autoFocus className="nx-ghost" aria-label="Close">
            ×
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {date} · <b className="font-semibold text-foreground">{wins.length}</b> wins · <b className="font-semibold text-foreground">{fmtMins(mins)}</b> done
          {streak > 1 && <> · {streak}-day streak</>}
        </p>
        {wins.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No wins yet today. Finish one thing and it shows up here.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {[...groups.entries()].map(([b, ws]) => (
              <div key={b}>
                <p className="flex items-center gap-2">
                  <span className={brandChip(b)}>{b}</span>
                  <span className="text-xs text-muted-foreground">{ws.length} · {fmtMins(ws.reduce((t, w) => t + w.mins, 0))}</span>
                </p>
                <ul className="mt-1.5 grid gap-1">
                  {ws.map((w) => (
                    <li key={w.id} className="text-[13.5px]">
                      · {w.title}
                      {w.note && <span className="block pl-3 text-xs text-muted-foreground">✎ {w.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
          <CopyButton text={text} label="Copy recap" />
          <CopyButton text={`draft a LinkedIn post from what I shipped today (teach, don't sell):\n\n${text}`} label="Copy LinkedIn draft request" />
        </div>
      </div>
    </div>
  )
}
