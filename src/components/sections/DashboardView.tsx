import 'server-only'
import { getJobLeads } from '@/lib/admin-jobs'
import { getBlogHandsStats, getDashState, type TodayItem } from '@/lib/admin-dashboard'
import { getAdminOverview, getDomainLog } from '@/lib/admin-audit'
import { DashboardTabs } from './DashboardTabs'
import { DashCalendar, DashHeader, DashHelp, DashNextUp } from './DashTop'
import { DashStats } from './DashStats'
import { logout } from '@/app/audit/admin/actions'

const DAY = 864e5
const FOLLOW_UP_AFTER_DAYS = 5
const FIT_RANK = { strong: 0, good: 1, weak: 2, skip: 3 } as const

/* Layout (v3, 2026-10-15, Chris's order): date + brief + calendar · key numbers
 * (click to expand) · Next up beside People you can help · tabs. */
export async function DashboardView() {
  const [leadData, state, overview, domainLog, bh] = await Promise.all([
    getJobLeads(),
    getDashState(),
    getAdminOverview(),
    getDomainLog({ limit: 500 }),
    getBlogHandsStats(),
  ])
  const now = Date.now()
  const rows = leadData?.rows ?? []
  const jobLeads = rows.filter((l) => l.lead_type !== 'question')
  const questionLeads = rows.filter((l) => l.lead_type === 'question')
  const newQuestions = questionLeads.filter((l) => l.status === 'new')
  const newLeads = jobLeads.filter((l) => l.status === 'new').sort((a, b) => FIT_RANK[a.fit] - FIT_RANK[b.fit])
  const within = (iso: string | null, days: number) => !!iso && now - Date.parse(iso) <= days * DAY

  // Pitches with no reply after 5 days → a follow-up in Next up.
  const followups = jobLeads.filter(
    (l) => l.status === 'pitched' && l.status_changed && now - Date.parse(l.status_changed) > FOLLOW_UP_AFTER_DAYS * DAY,
  )
  const counts = jobLeads.reduce<Record<string, number>>((m, l) => ((m[l.status] = (m[l.status] ?? 0) + 1), m), {})

  const items: TodayItem[] = [
    ...(state?.today?.items ?? []),
    ...followups.slice(0, 5).map<TodayItem>((l) => ({
      kind: 'followup',
      level: 'amber',
      title: `Follow up with ${l.who}`,
      detail: `You pitched ${Math.floor((now - Date.parse(l.status_changed!)) / DAY)} days ago and have no reply yet.`,
      badge: 'follow-up',
      say: `draft a short follow-up to ${l.who} for job lead ${l.id}`,
      href: l.link,
    })),
  ]
  const topCount = Math.min(3, items.filter((t) => t.kind !== 'house' && t.kind !== 'play' && t.kind !== 'question').length)
  const mail = state?.mail?.accounts ?? null
  const mailNew = mail?.reduce((t, a) => t + (a.unread_primary ?? 0), 0) ?? 0

  const brief = (
    <>
      {topCount > 0 ? <><b className="font-medium text-foreground">{topCount} thing{topCount === 1 ? '' : 's'}</b> need you first. </> : 'Nothing urgent today. '}
      {mail && mailNew > 0 && <><b className="font-medium text-foreground">{mailNew} new email{mailNew === 1 ? '' : 's'}</b> in Primary. </>}
      {newQuestions.length > 0 && <><b className="font-medium text-foreground">{newQuestions.length} {newQuestions.length === 1 ? 'person' : 'people'}</b> asked something you can answer. </>}
      {overview && overview.last_7d > 0 && <><b className="font-medium text-foreground">{overview.last_7d} sites</b> ran the Findability tool this week.</>}
    </>
  )

  return (
    <main id="main-content" className="relative min-h-screen px-4 py-10 md:px-10 md:py-12">
      <div className="mx-auto grid max-w-310 gap-8 min-[1800px]:max-w-370">
        <DashHeader brief={brief} refreshed={state?.updated.today} />

        {!state && (
          <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
            The hourly data is not reachable. If this is new, run migration 0015 in the Supabase SQL Editor.
          </p>
        )}

        <DashStats
          overview={overview}
          domains={domainLog.rows}
          bh={bh}
          jobs={{
            counts,
            pitched7d: jobLeads.filter((l) => ['pitched', 'replied', 'won'].includes(l.status) && within(l.status_changed, 7)).length,
            followupsDue: followups.length,
          }}
          newLeads={newLeads}
          mail={mail}
          mailUpdated={state?.updated.mail}
          health={state?.health ?? null}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <DashNextUp items={items} />
          <div className="grid min-w-0 content-start gap-5">
            <DashCalendar events={state?.calendar?.events ?? []} connected={!!state?.calendar?.calendars.length} />
            <DashHelp questions={newQuestions} />
          </div>
        </div>

        <DashboardTabs
          overview={overview}
          domains={domainLog.rows}
          projects={state?.projects?.items ?? []}
          scorecard={state?.scorecard ?? null}
          health={state?.health ?? null}
          catalog={state?.catalog ?? null}
          updated={state?.updated ?? {}}
          jobLeads={jobLeads}
          questionLeads={questionLeads}
          today={new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}
        />

        <form action={logout} className="justify-self-end">
          <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button>
        </form>
      </div>
    </main>
  )
}
