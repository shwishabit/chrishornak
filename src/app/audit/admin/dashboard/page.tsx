import type { Metadata } from 'next'
import Link from 'next/link'
import { isAdmin } from '@/lib/admin-auth'
import { getJobLeads } from '@/lib/admin-jobs'
import { getDashProjects } from '@/lib/admin-dashboard'
import { AdminLogin } from '@/components/sections/AdminLogin'
import { DashboardTabs } from '@/components/sections/DashboardTabs'
import { logout } from '../actions'

export const metadata: Metadata = {
  title: 'Admin — Dashboard',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    return (
      <main id="main-content" className="relative min-h-screen">
        <AdminLogin />
      </main>
    )
  }

  const [leadData, projects] = await Promise.all([getJobLeads(), getDashProjects()])
  const rows = leadData?.rows ?? []
  const jobLeads = rows.filter((l) => l.lead_type !== 'question')
  const questionLeads = rows.filter((l) => l.lead_type === 'question')

  return (
    <main id="main-content" className="relative min-h-screen px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Admin</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              What&apos;s going on across your projects, the work you&apos;re chasing, the questions you can answer, and what
              Claude Code can do for you. Type &quot;refresh my dashboard&quot; to pull in the latest.
            </p>
            <Link href="/audit/admin" className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              ← Findability usage
            </Link>
          </div>
          <form action={logout}>
            <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">Sign out</button>
          </form>
        </div>

        <DashboardTabs
          projects={projects ?? []}
          jobLeads={jobLeads}
          questionLeads={questionLeads}
          today={new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })}
        />
      </div>
    </main>
  )
}
