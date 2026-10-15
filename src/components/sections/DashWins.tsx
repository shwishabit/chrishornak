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
const PIP: Record<string, string> = { 'Swift Growth': 'bg-orange-400', 'Blog Hands': 'bg-blue-400', 'Chris Hornak': 'bg-primary' }

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
  const R = 26
  const C = 2 * Math.PI * R

  return (
    <section aria-labelledby="wins-h" className="relative min-w-0">
      <style>{`
        @keyframes dash-float { from { opacity: 0; transform: translateY(6px) } 15% { opacity: 1 } to { opacity: 0; transform: translateY(-34px) } }
        @keyframes dash-pop { 0% { transform: scale(1) } 35% { transform: scale(1.18) } 100% { transform: scale(1) } }
        @keyframes dash-pip { from { transform: scale(0) } 70% { transform: scale(1.35) } to { transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) { .dash-anim { animation: none !important } }
      `}</style>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="wins-h" className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Wins
        </h3>
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => setRecap(true)} className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-well hover:text-foreground">
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
            className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-well hover:text-foreground"
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </span>
      </div>

      {/* Ring = exactly the height of the text column beside it (Chris): count line 32px + level line
          16px + dots 8+10px = 66px; 48px before the first win (no dots). A fixed size, because a
          stretch-to-fit ring loops (ring grows → text wraps → column grows → ring grows). */}
      <div className="mt-2 flex items-center gap-4">
        <div
          className={`relative shrink-0 rounded-full ${wins.length > 0 ? 'h-[66px] w-[66px]' : 'h-12 w-12'} transition-shadow duration-500 ${levelUp ? 'shadow-[0_0_18px_2px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]' : ''}`}
        >
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true">
            {/* Full, clearly visible track so the ring reads as an even circle at any progress. */}
            <circle cx="32" cy="32" r={R} fill="none" strokeWidth="6" className="stroke-muted-foreground/25" />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - into / LEVEL_MINS)}
            />
          </svg>
          <span key={`lv-${level}`} className="dash-anim absolute inset-0 grid place-items-center text-center" style={{ animation: pop ? 'dash-pop 420ms ease-out' : undefined }}>
            {/* Number only: the word "Level" sits in the line beside the ring, so nothing touches the circle. */}
            <span className="font-heading text-lg font-semibold leading-none tabular-nums" aria-label={`Level ${level}`}>
              {level}
            </span>
          </span>
        </div>
        <div className="min-w-0">
          <p key={`n-${pop}`} className="dash-anim font-heading text-2xl font-semibold tabular-nums" style={{ animation: pop ? 'dash-pop 420ms ease-out' : undefined }}>
            {wins.length}{' '}
            <span className="font-sans text-sm font-normal text-muted-foreground">
              win{wins.length === 1 ? '' : 's'} · {fmtMins(mins)} done
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {levelUp ? (
              <span className="font-medium text-primary">Level up! Now level {level}</span>
            ) : wins.length === 0 ? (
              `Level ${level} · finish one thing to get going`
            ) : (
              `Level ${level} · ${fmtMins(LEVEL_MINS - into)} to level ${level + 1}`
            )}
          </p>
          {wins.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1" aria-label={`${wins.length} wins today`}>
              {wins.slice(-60).map((w) => (
                <span
                  key={w.id}
                  title={`${w.title}${w.brand ? ` · ${w.brand}` : ''} · ${fmtMins(w.mins)}`}
                  className={`dash-anim h-2.5 w-2.5 rounded-full ${w.brand && PIP[w.brand] ? PIP[w.brand] : 'bg-muted-foreground/60'}`}
                  style={{ animation: 'dash-pip 380ms ease-out' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day streak + the last 7 days */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {streak > 0 ? (
            <>
              <b className="font-semibold tabular-nums text-foreground">{streak}-day</b> streak
              {wins.length === 0 && <span> · win today to make it {streak + 1}</span>}
            </>
          ) : (
            'Start a streak today'
          )}
        </p>
        <div className="flex gap-1" aria-label="Last 7 days">
          {week.map((d) => {
            const won = past.has(d) || (d === today && wins.length > 0)
            const weekend = weekday(d) === 0 || weekday(d) === 6
            return (
              <span key={d} title={`${new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}${won ? ' · win' : ''}`} className="grid justify-items-center gap-0.5">
                <span className={`h-3 w-3 rounded-[3px] ${won ? 'bg-primary' : weekend ? 'bg-muted-foreground/10' : 'bg-muted-foreground/25'} ${d === today ? 'ring-1 ring-primary/60 ring-offset-1 ring-offset-panel' : ''}`} />
                <span className="text-[8px] uppercase text-muted-foreground/70">{'SMTWTFS'[weekday(d)]}</span>
              </span>
            )
          })}
        </div>
      </div>

      {floats.map((f) => (
        <span
          key={f.key}
          aria-hidden="true"
          className="dash-anim pointer-events-none absolute right-2 top-10 whitespace-nowrap text-sm font-semibold text-primary"
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
    ...[...groups.entries()].flatMap(([b, ws]) => [``, `${b}:`, ...ws.map((w) => `- ${w.title}`)]),
  ].join('\n')

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="recap-h" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-panel p-6 shadow-2xl">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="recap-h" className="font-heading text-lg font-semibold">Today&apos;s recap</h2>
          <button type="button" onClick={onClose} autoFocus className="rounded-md px-2 py-0.5 text-sm text-muted-foreground hover:bg-well hover:text-foreground" aria-label="Close">
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
                    <li key={w.id} className="text-[13.5px]">· {w.title}</li>
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
