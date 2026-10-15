'use client'

import { useState } from 'react'
import type { JobLead } from '@/lib/admin-jobs'
import type { DashProject } from '@/lib/admin-dashboard'
import type { AdminOverview, DomainLogRow } from '@/lib/admin-audit'
import { AdminFindability } from './AdminFindability'
import { AdminProjects } from './AdminProjects'
import { AdminJobLeads } from './AdminJobLeads'
import { AdminQuestions } from './AdminQuestions'
import { AdminCatalog } from './AdminCatalog'

type Tab = 'findability' | 'projects' | 'jobs' | 'questions' | 'catalog'
const TABS: { id: Tab; label: string }[] = [
  { id: 'findability', label: 'Findability' },
  { id: 'projects', label: 'Projects' },
  { id: 'jobs', label: 'Job hunt' },
  { id: 'questions', label: 'Questions to answer' },
  { id: 'catalog', label: 'Skills & agents' },
]

export function DashboardTabs({
  overview,
  domains,
  projects,
  jobLeads,
  questionLeads,
  today,
}: {
  overview: AdminOverview | null
  domains: DomainLogRow[]
  projects: DashProject[]
  jobLeads: JobLead[]
  questionLeads: JobLead[]
  today: string
}) {
  const [tab, setTab] = useState<Tab>('findability')

  const counts: Record<Tab, number> = {
    findability: overview?.unique_domains ?? 0,
    projects: projects.length,
    jobs: jobLeads.length,
    questions: questionLeads.filter((l) => l.status === 'new').length,
    catalog: 0,
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              tab === t.id ? 'bg-primary text-background' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && <span className="ml-1.5 tabular-nums opacity-70">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {tab === 'findability' &&
        (overview === null ? (
          <div className="glass-card mt-6 p-6 text-sm text-muted-foreground">Findability analytics not reachable.</div>
        ) : (
          <AdminFindability overview={overview} domains={domains} />
        ))}
      {tab === 'projects' && <AdminProjects projects={projects} />}
      {tab === 'jobs' && <AdminJobLeads leads={jobLeads} today={today} />}
      {tab === 'questions' && <AdminQuestions leads={questionLeads} />}
      {tab === 'catalog' && <AdminCatalog />}
    </>
  )
}
