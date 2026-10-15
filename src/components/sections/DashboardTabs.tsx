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

// Chris's order (2026-10-15): Feed first, Sales next (a lead is money), then Job hunt,
// Projects, Questions, Tools & leads (was Findability), Site health, Claude (was Skills & agents).
type Tab = 'feed' | 'sales' | 'projects' | 'jobs' | 'questions' | 'leads' | 'health' | 'claude'
// Old links keep working.
const ALIAS: Record<string, Tab> = { findability: 'leads', toolbox: 'claude' }
const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'sales', label: 'Sales' },
  { id: 'jobs', label: 'Job hunt' },
  { id: 'projects', label: 'Projects' },
  { id: 'questions', label: 'Questions' },
  { id: 'leads', label: 'Tools & leads' },
  { id: 'health', label: 'Site health' },
  { id: 'claude', label: 'Claude' },
]

export function DashboardTabs({
  feed,
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
}: {
  /** Feed + Calendar, rendered on the server. */
  feed: React.ReactNode
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
    sales: live.sales,
    projects: projects.filter((p) => p.lane === 'you').length,
    jobs: jobLeads.filter((l) => l.status === 'new').length,
    questions: questionLeads.filter((l) => l.status === 'new').length,
    leads: leadsCount,
  }

  return (
    <section>
      <div id="dash-tabs" role="tablist" className="flex scroll-mt-6 flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id)
              // Clear an old #hash so the same Pulse link works again next time.
              if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search)
            }}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13.5px] transition-colors ${
              tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {(counts[t.id] ?? 0) > 0 && <span className="ml-1.5 tabular-nums text-muted-foreground/60">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* The Feed stays mounted so its filters and Done marks survive a tab switch. */}
      <div hidden={tab !== 'feed'}>{feed}</div>
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
  )
}
