import type { JobLead } from '@/lib/admin-jobs'
import type { CalEvent, TodayItem } from '@/lib/admin-dashboard'
import { CONTRA_JOBS, ago } from '@/lib/dash-format'
import { CopyButton, OutLink } from './DashParts'

/* Top of the dashboard (v3, 2026-10-15): date + one-line brief, then Next up
 * beside a right column of Calendar over People you can help. */

const TZ = 'America/New_York'
const LEVEL_DOT: Record<TodayItem['level'], string> = { red: 'bg-danger', amber: 'bg-warning', plain: 'bg-muted-foreground', green: 'bg-primary' }

const nyDay = (iso: string) => (iso.length === 10 ? iso : new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }))
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })

/** Calendar card for the right column: today first, then the rest of the week. */
export function DashCalendar({ events, connected }: { events: CalEvent[]; connected: boolean }) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ })
  const now = Date.now()
  const upcoming = events.filter((e) => e.allDay || Date.parse(e.end ?? e.start) >= now)
  const days = new Map<string, CalEvent[]>()
  for (const e of upcoming) days.set(nyDay(e.start), [...(days.get(nyDay(e.start)) ?? []), e])
  if (!days.has(today)) days.set(today, [])
  const ordered = [...days.entries()].sort(([x], [y]) => x.localeCompare(y))

  return (
    <section aria-labelledby="cal-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="cal-h" className="font-heading text-lg font-semibold">Calendar</h2>
        <span className="text-xs text-muted-foreground">next 7 days · both accounts</span>
      </div>
      {!connected ? (
        <div className="mt-3 text-sm text-muted-foreground">
          <p>Not connected yet.</p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-xs">
            <li>Google Calendar → Settings → your calendar → <b className="text-foreground">Integrate calendar</b></li>
            <li>Copy <b className="text-foreground">Secret address in iCal format</b></li>
            <li>Paste it after <code>ACCOUNT_N_ICS_URL=</code> in <code>C:\Users\Blog Hands\.claude\dashboard.env</code></li>
          </ol>
        </div>
      ) : (
        <div className="mt-3 grid max-h-80 gap-4 overflow-y-auto">
          {ordered.map(([d, evs]) => (
            <div key={d}>
              <p className={`text-[11px] font-medium uppercase tracking-wide ${d === today ? 'text-primary' : 'text-muted-foreground'}`}>
                {d === today ? 'Today' : new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              {evs.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Nothing else today.</p>
              ) : (
                <ul className="mt-1.5 grid gap-1.5">
                  {evs.map((e, i) => {
                    const live = !e.allDay && Date.parse(e.start) <= now
                    return (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className={`w-16 shrink-0 tabular-nums ${live ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                          {e.allDay ? 'All day' : live ? 'Now' : time(e.start)}
                        </span>
                        <span className="min-w-0">
                          {e.title} <span className="text-xs text-muted-foreground">· {e.calendar}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/70">Shows events you made or said yes to. Unanswered invites stay hidden.</p>
        </div>
      )}
    </section>
  )
}

export function DashHeader({ brief, refreshed }: { brief: React.ReactNode; refreshed?: string }) {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: TZ })
  const stale = !refreshed || Date.now() - Date.parse(refreshed) > 3 * 3600e3
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Dashboard</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight md:text-4xl">{date}</h1>
        <p className="mt-2 max-w-[68ch] text-base text-muted-foreground md:text-[17px]">{brief}</p>
      </div>
      <div>
        <span className={`inline-flex items-center gap-1.5 text-xs ${stale ? 'text-warning' : 'text-muted-foreground'}`}>
          <i className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-warning' : 'bg-primary'}`} />
          Refreshed {ago(refreshed)} · every hour
        </span>
      </div>
    </header>
  )
}

export function DashNextUp({ items }: { items: TodayItem[] }) {
  const rank: Record<TodayItem['kind'], number> = { alert: 0, top3: 1, due: 2, followup: 3, question: 4, play: 5, house: 6 }
  const lvl: Record<TodayItem['level'], number> = { red: 0, amber: 1, plain: 2, green: 3 }
  const tasks = items.filter((t) => t.kind !== 'house' && t.kind !== 'play' && t.kind !== 'question')
    .sort((a, b) => lvl[a.level] - lvl[b.level] || rank[a.kind] - rank[b.kind])
  const top = tasks.slice(0, 3)
  const rest = [...tasks.slice(3), ...items.filter((t) => t.kind === 'play'), ...items.filter((t) => t.kind === 'house')]

  return (
    <section aria-labelledby="next-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="next-h" className="font-heading text-lg font-semibold">Next up</h2>
        <span className="text-xs text-muted-foreground">in order</span>
      </div>
      {top.length === 0 && <p className="mt-4 text-sm text-muted-foreground">Nothing urgent. Pick a project below.</p>}
      <ol className="mt-2">
        {top.map((t, i) => (
          <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-t border-border py-4 first:border-t-0 sm:grid-cols-[28px_minmax(0,1fr)_auto]">
            <span className="pt-px font-heading text-[15px] text-muted-foreground/60">{i + 1}</span>
            <div className="min-w-0">
              <span className="mb-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <i className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[t.level]}`} />
                {t.badge}
              </span>
              <h3 className="text-[15px] font-semibold">
                {t.href ? (
                  <a href={t.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                    {t.title}
                  </a>
                ) : (
                  t.title
                )}
              </h3>
              {t.detail && <p className="mt-0.5 max-w-[70ch] text-[13px] text-muted-foreground">{t.detail}</p>}
            </div>
            <div className="col-start-2 sm:col-start-3">
              <CopyButton text={t.say} />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-1 grid grid-cols-[22px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-dashed border-primary-line bg-primary-deep px-4 py-3 sm:grid-cols-[28px_minmax(0,1fr)_auto]">
        <span className="text-primary" aria-hidden="true">↻</span>
        <p className="text-sm">
          Look at Contra&apos;s job board <span className="text-muted-foreground">· every day</span>
        </p>
        <div className="col-start-2 sm:col-start-3">
          <OutLink href={CONTRA_JOBS}>Open Contra jobs</OutLink>
        </div>
      </div>

      {rest.length > 0 && (
        <details className="mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer text-[13px] text-muted-foreground hover:text-foreground">{rest.length} more when you have time</summary>
          <ul className="mt-1">
            {rest.map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-2 pl-6 text-[13px]">
                <p className="min-w-0 flex-1">
                  {t.title} <span className="text-muted-foreground">· {t.badge}</span>
                </p>
                <CopyButton text={t.say} label="Copy" />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

export function DashHelp({ questions }: { questions: JobLead[] }) {
  return (
    <section aria-labelledby="help-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="help-h" className="font-heading text-lg font-semibold">People you can help</h2>
        <span className="text-xs text-muted-foreground">Bluesky · checked hourly</span>
      </div>
      {questions.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No new questions. The finder checks every hour.</p>}
      <ul className="mt-2">
        {questions.slice(0, 4).map((q) => (
          <li key={q.id} className="border-t border-border py-4 first:border-t-0">
            <p className="text-[13.5px]">{q.ask.length > 280 ? q.ask.slice(0, 279) + '…' : q.ask}</p>
            {q.fit_why && <p className="mt-1.5 text-xs text-muted-foreground">{q.fit_why.replace(/^.*Reply angle:\s*/, 'Angle: ')}</p>}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                @{q.handle} · {q.posted}
              </a>
              <CopyButton text={`draft a value-only Bluesky reply to ${q.link}`} label="Draft a reply" />
            </div>
          </li>
        ))}
      </ul>
      {questions.length > 4 && <p className="text-xs text-muted-foreground">+ {questions.length - 4} more in the Questions tab</p>}
    </section>
  )
}
