'use client'

import { useEffect, useState } from 'react'
import { onFeedCounts } from '@/lib/dash-wins'
import type { JobLead } from '@/lib/admin-jobs'
import type { Catalog, DashProject, Health, Scorecard } from '@/lib/admin-dashboard'
import type { AdminOverview, DomainLogRow } from '@/lib/admin-audit'
import { AdminFindability } from './AdminFindability'
import { AdminProjects } from './AdminProjects'
import { AdminJobLeads } from './AdminJobLeads'
import { AdminQuestions } from './AdminQuestions'
import { DashClaude } from './DashClaude'
import { DashHealth } from './DashHealth'
import { DashConsole } from './DashConsole'
import { FilterProvider } from '@/lib/dash-console'

// Chris's order (2026-10-15): Feed first, Sales next (a lead is money), then Job hunt,
// Projects, Questions, Tools & leads (was Findability), Site health, Claude (was Skills & agents).
// Week (2026-10-16): second, after the Feed: done by goal, stalled, blocked, decisions due.
type Tab = 'feed' | 'week' | 'sales' | 'projects' | 'jobs' | 'questions' | 'leads' | 'health' | 'claude'
// Old links keep working.
const ALIAS: Record<string, Tab> = { findability: 'leads', toolbox: 'claude' }
const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'week', label: 'Week' },
  { id: 'sales', label: 'Sales' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'projects', label: 'Projects' },
  { id: 'questions', label: 'Questions' },
  { id: 'leads', label: 'Tools & leads' },
  { id: 'health', label: 'Health' },
  { id: 'claude', label: 'Claude' },
]

export function DashboardTabs({
  feed,
  week,
  weekCount,
  sales,
  leads,
  leadsCount,
  feedCount,
  salesCount,
  overview,
  domains,
  projects,
  scorecard,
  health,
  catalog,
  updated,
  jobLeads,
  questionLeads,
  today,
  people,
}: {
  /** Feed + Calendar, rendered on the server. */
  feed: React.ReactNode
  /** The Week tab, rendered on the server. */
  week: React.ReactNode
  /** Stalled items + decisions due. */
  weekCount: number
  sales: React.ReactNode
  /** Merged tool + form leads across the three brands. */
  leads: React.ReactNode
  leadsCount: number
  feedCount: number
  salesCount: number
  overview: AdminOverview | null
  domains: DomainLogRow[]
  projects: DashProject[]
  scorecard: Scorecard | null
  health: Health | null
  catalog: Catalog | null
  updated: Partial<Record<string, string>>
  jobLeads: JobLead[]
  questionLeads: JobLead[]
  today: string
  /** Names for the console's People & companies suggestions. */
  people: string[]
}) {
  const [tab, setTab] = useState<Tab>('feed')
  // Live badges: the Feed announces its open counts as items are done.
  const [live, setLive] = useState({ feed: feedCount, sales: salesCount })
  useEffect(() => onFeedCounts((c) => setLive({ feed: c.open, sales: c.sales })), [])

  // #jobs, #toolbox … deep-link straight to a tab; in-page links (Pulse) switch tabs too.
  useEffect(() => {
    const go = (scroll: boolean) => {
      const raw = window.location.hash.slice(1)
      const h = (ALIAS[raw] ?? raw) as Tab
      if (!TABS.some((t) => t.id === h)) return
      setTab(h)
      if (scroll) document.getElementById('dash-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    go(false)
    const onHash = () => go(true)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const counts: Partial<Record<Tab, number>> = {
    feed: live.feed,
    week: weekCount,
    sales: live.sales,
    projects: projects.filter((p) => p.lane === 'you').length,
    jobs: jobLeads.filter((l) => l.status === 'new').length,
    questions: questionLeads.filter((l) => l.status === 'new').length,
    leads: leadsCount,
  }

  return (
    <FilterProvider>
    <section>
      <DashConsole
        tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))}
        tab={tab}
        people={people}
        onTab={(id) => {
          setTab(id)
          // Clear an old #hash so the same Pulse link works again next time.
          if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search)
        }}
      />

      {/* The Feed stays mounted so its filters and Done marks survive a tab switch. */}
      <div hidden={tab !== 'feed'}>{feed}</div>
      {tab === 'week' && week}
      {tab === 'sales' && sales}
      {tab === 'projects' &&<AdminProjects projects={projects} scorecard={scorecard} updated={updated.scorecard} />}
      {tab === 'jobs' && <AdminJobLeads leads={jobLeads} today={today} />}
      {tab === 'questions' && <AdminQuestions leads={questionLeads} />}
      {tab === 'leads' && (
        <div className="mt-6 grid gap-6">
          {leads}
          {overview === null ? (
            <div className="rounded-2xl border border-border bg-panel p-6 text-sm text-muted-foreground">Findability analytics not reachable.</div>
          ) : (
            <div>
              <h2 className="font-heading text-lg font-semibold">Findability tool · chrishornak.com</h2>
              <div className="mt-3">
                <AdminFindability overview={overview} domains={domains} />
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'health' && <DashHealth health={health} updated={updated.health} />}
      {tab === 'claude' && <DashClaude catalog={catalog} updated={updated.catalog} />}
    </section>
    </FilterProvider>
  )
}
