import type { BlogHandsStats, CalEvent, Health, MailAccount, SalesDb, SgmState } from '@/lib/admin-dashboard'
import type { AdminOverview } from '@/lib/admin-audit'
import { ago } from '@/lib/dash-format'
import { TZ, WORK_END, WORK_START, fmtMins, type Workday } from '@/lib/dash-feed'
import { OutLink } from './DashParts'

/* Top of the dashboard + the right column beside the Feed (v5, 2026-10-15).
 * The stats bar is gone: inbox counts sit in the Today card, the growth numbers
 * sit in Pulse, and everything that is a task lives in the Feed. */

const nyDay = (iso: string) => (iso.length === 10 ? iso : new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }))
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
const pct = (m: number) => ((Math.min(Math.max(m, WORK_START), WORK_END) - WORK_START) / (WORK_END - WORK_START)) * 100
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{children}</p>
)

/** 10 AM → 6 PM: time gone, meetings ahead, and a now marker. */
function TimeLeft({ day }: { day: Workday }) {
  const over = day.nowMin >= WORK_END
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted-foreground [&_b]:font-medium [&_b]:tabular-nums [&_b]:text-foreground">
        <span>Work day</span>
        {over ? (
          <span>Done for today</span>
        ) : (
          <span>
            <b>{fmtMins(day.leftMins)}</b> left · <b>{fmtMins(day.freeMins)}</b> free
            {day.meetingMins > 0 && <> · {fmtMins(day.meetingMins)} in meetings</>}
          </span>
        )}
      </div>
      <div
        className="relative mt-1.5 h-2.5 overflow-hidden rounded-full bg-well"
        role="img"
        aria-label={over ? 'The work day is over' : `${fmtMins(day.freeMins)} of free work time left today`}
      >
        <span className="absolute inset-y-0 left-0 bg-muted-foreground/25" style={{ width: `${pct(day.nowMin)}%` }} />
        {day.blocks.map((b, i) => (
          <span key={i} title={b.title} className="absolute inset-y-0 bg-warning/70" style={{ left: `${pct(b.start)}%`, width: `${Math.max(pct(b.end) - pct(b.start), 0.8)}%` }} />
        ))}
        {!over && day.nowMin > WORK_START && <span className="absolute inset-y-0 w-0.5 bg-primary" style={{ left: `${pct(day.nowMin)}%` }} />}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground/70">
        <span>10 AM</span>
        <span>2 PM</span>
        <span>6 PM</span>
      </div>
    </div>
  )
}

/** Today card: work-day bar, Now / Next, inbox counts, and the rest of the week folded away. */
export function DashToday({
  events,
  connected,
  day,
  mail,
  mailUpdated,
  wins,
}: {
  /** The Wins block (client), shown right under the heading. */
  wins?: React.ReactNode
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

  return (
    <section aria-labelledby="today-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5">
      <h2 id="today-h" className="font-heading text-lg font-semibold">Today</h2>
      {wins && <div className="mt-2">{wins}</div>}
      <div className={wins ? 'mt-3 border-t border-border pt-3' : 'mt-3'}>
        <TimeLeft day={day} />
      </div>

      <div className="mt-4 grid gap-1.5 text-[13.5px]">
        {!connected ? (
          <p className="text-muted-foreground">
            Calendar not connected. Paste each calendar&apos;s secret iCal link after <code>ACCOUNT_N_ICS_URL=</code> in <code>dashboard.env</code>.
          </p>
        ) : (
          <>
            {live && (
              <p>
                <span className="mr-2 font-medium text-primary">Now</span>
                {live.title} <span className="text-xs text-muted-foreground">· until {time(live.end ?? live.start)}</span>
              </p>
            )}
            {next ? (
              <p>
                <span className="mr-2 text-muted-foreground">Next</span>
                <span className="tabular-nums">{time(next.start)}</span> {next.title} <span className="text-xs text-muted-foreground">· {next.calendar}</span>
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

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <Label>Inbox</Label>
          {mail && <span className="text-[11px] text-muted-foreground">updated {ago(mailUpdated)}</span>}
        </div>
        {!mail ? (
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Not connected. Add each Gmail app password to <code>dashboard.env</code> on your PC.
          </p>
        ) : (
          <ul className="mt-1">
            {mail.map((a) => (
              <li key={a.email} className="flex items-center gap-3 py-1 text-[13.5px]">
                <span className="min-w-0 flex-1 truncate">{a.label}</span>
                {a.ok ? (
                  <span className={`tabular-nums ${a.unread_primary ? 'font-medium' : 'text-muted-foreground'}`}>{a.unread_primary ?? 0} new</span>
                ) : (
                  <span className="text-xs text-danger">not connected</span>
                )}
                <OutLink href={a.inbox}>Open</OutLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      {connected && later.length > 0 && (
        <details className="mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {later.length} more event{later.length === 1 ? '' : 's'} this week
          </summary>
          <div className="mt-2 grid max-h-72 gap-3 overflow-y-auto">
            {[...days.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([d, evs]) => (
              <div key={d}>
                <Label>{new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Label>
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
        </details>
      )}
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
    <section aria-labelledby="pulse-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5">
      <h2 id="pulse-h" className="font-heading text-lg font-semibold">Pulse</h2>
      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.label} className="border-t border-border first:border-t-0">
            <a
              href={r.href}
              {...(r.ext && { target: '_blank', rel: 'noopener noreferrer' })}
              className="group flex items-baseline gap-3 py-2.5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="w-24 shrink-0 text-[13px] text-muted-foreground">
                {r.dot && <i className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${r.dot === 'red' ? 'bg-danger' : 'bg-primary'}`} />}
                {r.label}
              </span>
              <span className="font-heading text-lg font-semibold tabular-nums">{r.value}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{r.sub}</span>
              <span className="text-muted-foreground/50 transition-colors group-hover:text-foreground" aria-hidden="true">{r.ext ? '↗' : '→'}</span>
            </a>
          </li>
        ))}
      </ul>
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
