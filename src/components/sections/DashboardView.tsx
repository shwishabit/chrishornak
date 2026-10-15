import 'server-only'
import { getJobLeads } from '@/lib/admin-jobs'
import { getBlogHandsStats, getDashState, getFeedMins, getFeedStatus, getSalesDb, getTodos, getWinDays } from '@/lib/admin-dashboard'
import { getAdminOverview, getDomainLog } from '@/lib/admin-audit'
import { buildFeed } from '@/lib/dash-feed-build'
import { WORK_END, nyDate, workday } from '@/lib/dash-feed'
import { DashboardTabs } from './DashboardTabs'
import { DashHeader, DashPulse, DashToday } from './DashTop'
import { DashFeed } from './DashFeed'
import { DashSales } from './DashSales'
import { DashBrief } from './DashBrief'
import { DashTodo } from './DashTodo'
import { DashWins } from './DashWins'
import { TODO_WIN_MINS, type Win } from '@/lib/dash-wins'
import { DashToolLeads } from './DashToolLeads'
import { logout } from '@/app/audit/admin/actions'

/* Layout (v5, 2026-10-15, Chris's call): date + brief · tabs, Feed first. The
 * Feed tab is the Feed beside a right column of Today (work-day bar, Now/Next,
 * inbox counts), a hand-typed To-do list and Pulse (growth numbers). The stats
 * bar is gone: its task counts live in the Feed, its numbers in Pulse + tabs. */
export async function DashboardView() {
  const [leadData, state, overview, domainLog, bh, statuses, salesDb, todos, minsOverride, winDays] = await Promise.all([
    getJobLeads(),
    getDashState(),
    getAdminOverview(),
    getDomainLog({ limit: 500 }),
    getBlogHandsStats(),
    getFeedStatus(),
    getSalesDb(),
    getTodos(),
    getFeedMins(),
    getWinDays(),
  ])
  const now = Date.now()
  const today = nyDate(new Date(now))
  const rows = leadData?.rows ?? []
  const jobLeads = rows.filter((l) => l.lead_type !== 'question')
  const questionLeads = rows.filter((l) => l.lead_type === 'question')

  // ── Feed ──
  // Chris's own time estimates (click "~15m" on an item) win over the defaults.
  const feed = buildFeed({ state, jobLeads, questionLeads, salesDb, todos, now }).map((i) => (minsOverride[i.id] ? { ...i, mins: minsOverride[i.id], minsSet: true } : i))
  const hidden = new Set(statuses.filter((s) => s.status !== 'snoozed' || (s.until ?? '') > today).map((s) => s.id))
  const open = feed.filter((i) => !hidden.has(i.id))
  const openIn = (g: string) => open.filter((i) => i.group === g)
  const day = workday(state?.calendar?.events ?? [], new Date(now))
  const mail = state?.mail?.accounts ?? null
  // Today's wins: Feed items marked Done today + to-dos ticked today (New York day).
  const brandById = new Map(feed.map((i) => [i.id, i.brand]))
  const wins: Win[] = [
    ...statuses
      .filter((s) => s.status === 'done' && nyDate(new Date(s.at)) === today)
      .map((s) => ({ id: s.id, title: s.title, mins: s.mins, brand: s.brand || brandById.get(s.id), note: s.note || undefined, at: s.at })),
    ...todos
      .filter((t) => t.done_at && nyDate(new Date(t.done_at)) === today)
      .map((t) => ({ id: `todo:${t.id}`, title: t.text, mins: TODO_WIN_MINS, at: t.done_at! })),
  ].sort((a, b) => a.at.localeCompare(b.at))

  const brief = (
    <DashBrief
      initial={{ open: open.length, urgent: open.filter((i) => i.level === 'red').length, email: openIn('email').length, sales: openIn('sales').length }}
      findability7d={overview?.last_7d ?? null}
    />
  )

  return (
    <main id="main-content" className="relative min-h-screen px-4 py-10 md:px-10 md:py-12">
      <div className="mx-auto grid max-w-310 gap-8 min-[1800px]:max-w-370">
        <DashHeader brief={brief} refreshed={state?.updated.today} requested={state?.updated.refresh_request} />

        {!state && (
          <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
            The hourly data is not reachable. If this is new, run migration 0015 in the Supabase SQL Editor.
          </p>
        )}

        <DashboardTabs
          feedCount={open.length}
          salesCount={openIn('sales').length}
          feed={
            // Keys on the four cards: this block is built on the server and handed to the
            // client-side tabs, where React needs them. Phone order: Today (with Wins), To-do, Feed, Pulse. Desktop: Feed left, the three cards right.
            // The last row is 1fr so the Feed's height never stretches the right-hand cards.
            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_1fr]">
              <div key="today" className="lg:col-start-2 lg:row-start-1">
                <DashToday
                  events={state?.calendar?.events ?? []}
                  connected={!!state?.calendar?.calendars.length}
                  day={day}
                  mail={mail}
                  mailUpdated={state?.updated.mail}
                  wins={<DashWins initial={wins} days={winDays.map((d) => d.d)} />}
                />
              </div>
              <div key="todo" className="lg:col-start-2 lg:row-start-2">
                <DashTodo initial={todos} />
              </div>
              <div key="feed" className="lg:col-start-1 lg:row-span-4 lg:row-start-1">
                <DashFeed
                  items={feed}
                  statuses={statuses}
                  freeMins={day.freeMins}
                  dayOver={day.nowMin >= WORK_END}
                />
              </div>
              <div key="pulse" className="lg:col-start-2 lg:row-start-3">
                <DashPulse overview={overview} bh={bh} health={state?.health ?? null} sgm={state?.sales?.sgm ?? null} salesDb={salesDb} />
              </div>
            </div>
          }
          sales={<DashSales sales={state?.sales ?? null} salesDb={salesDb} mail={mail} updated={state?.updated.sales} />}
          leads={<DashToolLeads mail={mail} salesDb={salesDb} sgm={state?.sales?.sgm ?? null} />}
          leadsCount={
            (mail ?? []).reduce((t, a) => t + (a.leads?.length ?? 0), 0) +
            (salesDb ? salesDb.signups.length + salesDb.claims.length : 0) +
            (state?.sales?.sgm?.checks?.length ?? 0) +
            (state?.sales?.sgm?.audits?.length ?? 0)
          }
          overview={overview}
          domains={domainLog.rows}
          projects={state?.projects?.items ?? []}
          scorecard={state?.scorecard ?? null}
          health={state?.health ?? null}
          catalog={state?.catalog ?? null}
          updated={state?.updated ?? {}}
          jobLeads={jobLeads}
          questionLeads={questionLeads}
          today={today}
        />

        <form action={logout} className="justify-self-end">
          <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button>
        </form>
      </div>
    </main>
  )
}
