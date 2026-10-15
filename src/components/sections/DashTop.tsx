import type { BlogHandsStats, CalEvent, Health, MailAccount, SalesDb, SgmState } from '@/lib/admin-dashboard'
import type { AdminOverview } from '@/lib/admin-audit'
import { ago } from '@/lib/dash-format'
import { TZ, WORK_END, WORK_START, fmtMins, type Workday } from '@/lib/dash-feed'
import { DashRefresh } from './DashRefresh'

/* Top of the dashboard + the right column beside the Feed (Nostromo B4, 2026-10-15).
 * Header = one slim line (date, summary, sync + refresh); the console under it is the hero.
 * Today card = Wins (one row), Schedule (meetings today), Due today / tomorrow, Inbox. */

const nyDay = (iso: string) => (iso.length === 10 ? iso : new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }))
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
const pct = (m: number) => ((Math.min(Math.max(m, WORK_START), WORK_END) - WORK_START) / (WORK_END - WORK_START)) * 100
const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** "Blog Hands" → BH, "Swift Growth Marketing" → SGM, one word → its first 3 letters. */
const abbr = (label: string) => {
  const w = label.split(/\s+/).filter(Boolean)
  return (w.length > 1 ? w.map((x) => x[0]).join('') : label.slice(0, 3)).toUpperCase()
}

/** The day bar, drawn as a 1px line: time gone, meetings, and a now marker. No hour labels. */
function ScheduleBar({ day }: { day: Workday }) {
  const over = day.nowMin >= WORK_END
  return (
    <div
      className="relative my-3.5 h-3"
      role="img"
      aria-label={over ? 'The work day is over' : `${day.blocks.length} meeting${day.blocks.length === 1 ? '' : 's'} today, ${fmtMins(day.meetingMins)} in total`}
    >
      <span className="absolute inset-x-0 top-1/2 h-px bg-[#2e333b]" />
      <span className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 bg-[#4a4f57]" style={{ width: `${pct(day.nowMin)}%` }} />
      {day.blocks.map((b, i) => (
        <span
          key={i}
          title={`${b.title} ${clock(b.start)}–${clock(b.end)}`}
          className="absolute top-1/2 box-border h-[11px] -translate-y-1/2 border border-[#5fd394] bg-[#3f6b55]"
          style={{ left: `${pct(b.start)}%`, width: `${Math.max(pct(b.end) - pct(b.start), 1.2)}%` }}
        />
      ))}
      {!over && day.nowMin > WORK_START && (
        <span className="absolute top-0 h-3 w-px bg-[#a8f2c8] shadow-[0_0_8px_#5fd394]" style={{ left: `${pct(day.nowMin)}%` }} />
      )}
    </div>
  )
}

/** Today card: Wins, the schedule, what is due, and the inbox counts. */
export function DashToday({
  events,
  connected,
  day,
  mail,
  mailUpdated,
  wins,
}: {
  /** The Wins block (client): the "Today" heading, level + streak, ring, day squares. */
  wins: React.ReactNode
  events: CalEvent[]
  connected: boolean
  day: Workday
  mail: MailAccount[] | null
  mailUpdated?: string
}) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ })
  const now = Date.now()
  const upcoming = events.filter((e) => e.allDay || Date.parse(e.end ?? e.start) >= now)
  const todays = upcoming.filter((e) => nyDay(e.start) === today)
  const allDay = todays.filter((e) => e.allDay)
  const live = todays.find((e) => !e.allDay && Date.parse(e.start) <= now)
  const next = todays.find((e) => !e.allDay && Date.parse(e.start) > now)
  const later = upcoming.filter((e) => nyDay(e.start) > today)
  const days = new Map<string, CalEvent[]>()
  for (const e of later) days.set(nyDay(e.start), [...(days.get(nyDay(e.start)) ?? []), e])
  const hasWeek = connected && later.length > 0

  const weekList = (
    <div className="mt-2 grid max-h-72 gap-3 overflow-y-auto pb-1">
      {[...days.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([d, evs]) => (
        <div key={d}>
          <p className="nx-lab">{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <ul className="mt-1 grid gap-1">
            {evs.map((e, i) => (
              <li key={i} className="flex gap-3 text-[13px]">
                <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{e.allDay ? 'All day' : time(e.start)}</span>
                <span className="min-w-0">{e.title} <span className="text-xs text-muted-foreground">· {e.calendar}</span></span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )

  return (
    <section aria-labelledby="today-h" className="nx-box min-w-0 p-5 md:px-6 md:py-5.5">
      {wins}

      <div className="mt-4.5 border-t border-border pt-4">
        {hasWeek ? (
          <details>
            <summary className="nx-lab flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 md:min-h-0 [&::-webkit-details-marker]:hidden">
              <span>Schedule · meetings today</span>
              <span className="text-[#8d929a]">This week ▸ {later.length} more</span>
            </summary>
            {weekList}
          </details>
        ) : (
          <p className="nx-lab">Schedule · meetings today</p>
        )}
        <ScheduleBar day={day} />
        <div className="grid gap-1 text-[14px]">
          {!connected ? (
            <p className="text-muted-foreground">
              Calendar not connected. Paste each calendar&apos;s secret iCal link after <code>ACCOUNT_N_ICS_URL=</code> in <code>dashboard.env</code>.
            </p>
          ) : (
            <>
              {live && (
                <p className="flex flex-wrap justify-between gap-x-3">
                  <span>
                    <span className="nx-lab !text-primary">Now</span>&nbsp; {live.title} <span className="text-xs text-muted-foreground">· until {time(live.end ?? live.start)}</span>
                  </span>
                  <span className="nx-lab !tracking-[0.1em]">{live.calendar}</span>
                </p>
              )}
              {next ? (
                <p className="flex flex-wrap justify-between gap-x-3">
                  <span>
                    <span className="nx-lab !text-[#a8f2c8]">Next</span>&nbsp; <span className="nx-num text-[15px]">{time(next.start)}</span> {next.title}
                  </span>
                  <span className="nx-lab !tracking-[0.1em]">{next.calendar}</span>
                </p>
              ) : (
                !live && <p className="text-muted-foreground">No more meetings today.</p>
              )}
              {allDay.map((e, i) => (
                <p key={i} className="text-xs text-muted-foreground">All day: {e.title}</p>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="mt-4.5 flex flex-wrap items-center justify-between gap-x-4 border-t border-border pt-3.5">
        <p className="nx-lab" title={mail ? `Updated ${ago(mailUpdated)}` : undefined}>Inbox</p>
        {!mail ? (
          <p className="text-[13px] text-muted-foreground">Not connected. Add each Gmail app password to <code>dashboard.env</code> on your PC.</p>
        ) : (
          <p className="flex flex-wrap items-center gap-x-1 text-[12px]">
            {mail.map((a, i) => (
              <span key={a.email} className="inline-flex items-center">
                {i > 0 && <span className="px-1.5 text-[#8d929a]" aria-hidden="true">·</span>}
                {a.ok ? (
                  <a
                    href={a.inbox}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${a.label}: open inbox`}
                    className={`nx-lab inline-flex min-h-11 items-center !tracking-[0.12em] md:min-h-0 ${a.unread_primary ? '!text-[#a8f2c8]' : '!text-[#d9d6cf]'} hover:underline`}
                  >
                    {abbr(a.label)} {a.unread_primary ?? 0}
                  </a>
                ) : (
                  <span className="nx-lab !text-danger">{abbr(a.label)} not connected</span>
                )}
                {a.ok && (a.unread_other ?? 0) > 0 && (
                  <a
                    href={a.inbox.replace('#inbox', '#search/in%3Ainbox+is%3Aunread+category%3Aprimary')}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${a.unread_other} other unread in ${a.label}: bills, orders, promos and the like. Opens Gmail.`}
                    className="nx-lab ml-2 inline-flex min-h-11 items-center !tracking-[0.08em] !text-[#8d929a] hover:!text-[#d9d6cf] hover:underline md:min-h-0"
                  >
                    +{a.unread_other} other ↗
                  </a>
                )}
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  )
}

const BH_ORDER: [keyof BlogHandsStats, string][] = [
  ['signups_7d', 'sign-ups this week'],
  ['active_subs', 'active subscriptions'],
  ['posts_delivered_7d', 'posts delivered this week'],
  ['free_claims_7d', 'free posts claimed this week'],
  ['grader_runs_7d', 'Blog Grader runs this week'],
  ['accounts_total', 'accounts, all time'],
]

/** Pulse: the growth numbers that are not tasks. Each row opens where the detail lives. */
export function DashPulse({ overview, bh, health, sgm, salesDb }: { overview: AdminOverview | null; bh: BlogHandsStats | null; health: Health | null; sgm: SgmState | null; salesDb: SalesDb | null }) {
  // Chris Hornak = every chrishornak.com tool, not just Findability.
  const ch = salesDb?.tool_runs_7d
  const chTotal = ch ? ch.findability + ch.authority + ch.og : overview?.last_7d ?? null
  const week = Date.now() - 7 * 864e5
  const sgmScans = sgm?.scans?.filter((x) => Date.parse(x.created_at) >= week).length ?? 0
  const sgmLeads = (sgm?.checks?.filter((x) => Date.parse(x.created_at) >= week).length ?? 0) + (sgm?.audits?.filter((x) => Date.parse(x.created_at) >= week).length ?? 0)
  const bhTop = bh ? BH_ORDER.find(([k]) => Number(bh[k]) > 0) : undefined
  const f0 = health?.f0rmless
  const f0Issues = /(\d+) persisted/.exec(f0?.status ?? '')?.[1]
  const f0Red = f0?.status.includes('🔴')
  const vit = (re: RegExp) => re.exec(f0?.vitals ?? '')?.[1]

  const rows: { label: string; value: React.ReactNode; sub: React.ReactNode; href: string; ext?: boolean; dot?: 'red' | 'ok' }[] = [
    {
      label: 'Chris Hornak',
      value: chTotal !== null ? chTotal.toLocaleString('en-US') : '—',
      sub: ch ? <>tool runs this week · Findability {ch.findability} · Authority {ch.authority} · OG {ch.og}</> : overview ? <>Findability scans this week</> : 'not reachable',
      href: '#leads',
    },
    {
      label: 'Blog Hands',
      value: bh ? (bhTop ? Number(bh[bhTop[0]]).toLocaleString('en-US') : '0') : '—',
      sub: bh ? (bhTop ? bhTop[1] : 'activity this week') : 'not connected',
      href: 'https://bloghands.com/admin',
      ext: true,
    },
    {
      label: 'Swift Growth',
      value: sgm?.ok ? sgmScans.toLocaleString('en-US') : '—',
      sub: !sgm ? 'not read yet' : !sgm.ok ? 'not reachable' : (
        <>
          tool runs this week · {sgmLeads} lead{sgmLeads === 1 ? '' : 's'}
          {!sgm.live && <span className="text-warning"> · new site not live yet</span>}
        </>
      ),
      href: '#leads',
    },
    {
      label: 'f0rmless',
      value: vit(/entries=(\d+)/) ?? '—',
      sub: <>matches · {vit(/\blive=(\d+)/) ?? '—'} live{f0Red ? <span className="text-danger"> · {f0Issues ?? ''} issues</span> : ''}</>,
      href: '#health',
      dot: f0 ? (f0Red ? 'red' : 'ok') : undefined,
    },
  ]

  return (
    <section aria-labelledby="pulse-h" className="nx-box min-w-0 p-5 md:px-6 md:py-5">
      <h2 id="pulse-h" className="text-lg font-normal">Pulse</h2>
      <ul className="mt-2.5">
        {rows.map((r) => (
          <li key={r.label} className="border-t border-border first:border-t-0">
            <a
              href={r.href}
              {...(r.ext && { target: '_blank', rel: 'noopener noreferrer' })}
              className="group flex min-h-11 flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="w-28 shrink-0 text-[13px] text-[#d9d6cf]">
                {r.dot && <i className={`mr-1.5 inline-block h-1.5 w-1.5 align-middle ${r.dot === 'red' ? 'bg-danger' : 'bg-primary'}`} />}
                {r.label}
              </span>
              <span className="nx-num text-[22px]">{r.value}</span>
              <span className="min-w-0 flex-1 basis-40 truncate text-xs text-muted-foreground">{r.sub}</span>
              <span className="text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true">{r.ext ? '↗' : '→'}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function DashHeader({ brief, refreshed, requested }: { brief: React.ReactNode; refreshed?: string; requested?: string }) {
  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: TZ })
  const rest = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ })
  const stale = !refreshed || Date.now() - Date.parse(refreshed) > 3 * 3600e3
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="m-0 text-[17px] font-normal tracking-[0.02em] text-[#d9d6cf]">
          {weekday}, <span className="nx-num !font-normal">{rest}</span>
        </h1>
        <p className="m-0 text-[13px] leading-snug tracking-[0.02em] text-muted-foreground">{brief}</p>
      </div>
      <div className="flex items-center gap-3.5">
        <span className={`nx-lab ${stale ? '!text-warning' : ''}`} title="The hourly pull from your PC">
          Sync <span className={stale ? '' : 'text-[#d9d6cf]'}>{ago(refreshed)}</span>
        </span>
        <DashRefresh refreshed={refreshed} requested={requested} />
      </div>
    </header>
  )
}
