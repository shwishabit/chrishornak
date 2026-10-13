import type { Metadata } from 'next'
import Link from 'next/link'
import { isAdmin } from '@/lib/admin-auth'
import { getJobLeads } from '@/lib/admin-jobs'
import { AdminLogin } from '@/components/sections/AdminLogin'
import { AdminJobLeads } from '@/components/sections/AdminJobLeads'
import { logout } from '../actions'

export const metadata: Metadata = {
  title: 'Admin — Job Leads',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

export default async function JobLeadsAdminPage() {
  if (!(await isAdmin())) {
    return (
      <main id="main-content" className="relative min-h-screen">
        <AdminLogin />
      </main>
    )
  }

  const data = await getJobLeads()
  const lastRuns = data ? data.runs.filter((r) => r.run_date === data.runs[0]?.run_date) : []

  return (
    <main id="main-content" className="relative min-h-screen px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Admin</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Job leads</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hiring posts Claude finds on Bluesky, plus your Contra and Upwork pitches. Remote freelance, contract and part-time
              work up front; full-time has its own tab. Each lead gets a score out of 100: hover or tap it to see why. Set a status
              and keep notes; changes save on their own.
            </p>
            <Link href="/audit/admin" className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              ← Findability usage
            </Link>
          </div>
          <form action={logout}>
            <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>

        {data === null ? (
          <div className="glass-card mt-8 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Leads not reachable.</p>
            <p className="mt-2">
              You&apos;re signed in, but the leads RPC returned nothing. Check that migration{' '}
              <code className="text-foreground">0010_job_leads.sql</code> is applied.
            </p>
          </div>
        ) : (
          <>
            <AdminJobLeads leads={data.rows} today={new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })} />
            {lastRuns.length > 0 && (
              <div className="mt-6 space-y-1 text-xs text-muted-foreground">
                {lastRuns.map((r) => (
                  <p key={r.source}>
                    Last {r.source === 'hackernews' ? 'Hacker News' : 'Bluesky'} search {r.run_date}: {r.kept} posts passed the
                    filter, {r.real_leads} real leads.
                  </p>
                ))}
                <p>Runs so far: {data.runs.length}.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
