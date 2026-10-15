'use client'

import { useEffect, useState } from 'react'
import type { JobLead } from '@/lib/admin-jobs'
import type { Catalog, DashProject, Health, Scorecard } from '@/lib/admin-dashboard'
import type { AdminOverview, DomainLogRow } from '@/lib/admin-audit'
import { AdminFindability } from './AdminFindability'
import { AdminProjects } from './AdminProjects'
import { AdminJobLeads } from './AdminJobLeads'
import { AdminQuestions } from './AdminQuestions'
import { AdminCatalog } from './AdminCatalog'
import { DashHealth } from './DashWeek'

// Chris's order (2026-10-15): Projects, Job hunt, Questions, Findability, Site health, Skills & agents.
type Tab = 'projects' | 'jobs' | 'questions' | 'findability' | 'health' | 'toolbox'
const TABS: { id: Tab; label: string }[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'jobs', label: 'Job hunt' },
  { id: 'questions', label: 'Questions' },
  { id: 'findability', label: 'Findability' },
  { id: 'health', label: 'Site health' },
  { id: 'toolbox', label: 'Skills & agents' },
]

export function DashboardTabs({
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
  const [tab, setTab] = useState<Tab>('projects')

  // #jobs, #toolbox … deep-link straight to a tab.
  useEffect(() => {
    const h = window.location.hash.slice(1) as Tab
    if (TABS.some((t) => t.id === h)) setTab(h)
  }, [])

  const counts: Partial<Record<Tab, number>> = {
    projects: projects.filter((p) => p.lane === 'you').length,
    jobs: jobLeads.filter((l) => l.status === 'new').length,
    questions: questionLeads.filter((l) => l.status === 'new').length,
    findability: overview?.unique_domains ?? 0,
  }

  return (
    <section>
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13.5px] transition-colors ${
              tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {(counts[t.id] ?? 0) > 0 && <span className="ml-1.5 tabular-nums text-muted-foreground/60">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {tab === 'projects' && <AdminProjects projects={projects} scorecard={scorecard} updated={updated.scorecard} />}
      {tab === 'jobs' && <AdminJobLeads leads={jobLeads} today={today} />}
      {tab === 'questions' && <AdminQuestions leads={questionLeads} />}
      {tab === 'findability' &&
        (overview === null ? (
          <div className="mt-6 rounded-2xl border border-border bg-panel p-6 text-sm text-muted-foreground">Findability analytics not reachable.</div>
        ) : (
          <AdminFindability overview={overview} domains={domains} />
        ))}
      {tab === 'health' && <DashHealth health={health} updated={updated.health} />}
      {tab === 'toolbox' && <AdminCatalog catalog={catalog} updated={updated.catalog} />}
    </section>
  )
}
