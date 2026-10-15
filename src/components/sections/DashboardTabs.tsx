'use client'

import { useState } from 'react'
import type { JobLead } from '@/lib/admin-jobs'
import type { DashProject } from '@/lib/admin-dashboard'
import { AdminProjects } from './AdminProjects'
import { AdminJobLeads } from './AdminJobLeads'
import { AdminQuestions } from './AdminQuestions'
import { AdminCatalog } from './AdminCatalog'

type Tab = 'projects' | 'jobs' | 'questions' | 'catalog'
const TABS: { id: Tab; label: string }[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'jobs', label: 'Job hunt' },
  { id: 'questions', label: 'Questions to answer' },
  { id: 'catalog', label: 'Skills & agents' },
]

export function DashboardTabs({
  projects,
  jobLeads,
  questionLeads,
  today,
}: {
  projects: DashProject[]
  jobLeads: JobLead[]
  questionLeads: JobLead[]
  today: string
}) {
  const [tab, setTab] = useState<Tab>('projects')

  const counts: Record<Tab, number> = {
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

      {tab === 'projects' && <AdminProjects projects={projects} />}
      {tab === 'jobs' && <AdminJobLeads leads={jobLeads} today={today} />}
      {tab === 'questions' && <AdminQuestions leads={questionLeads} />}
      {tab === 'catalog' && <AdminCatalog />}
    </>
  )
}
