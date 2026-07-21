import type { Metadata } from 'next'
import Link from 'next/link'
import { isAdmin } from '@/lib/admin-auth'
import { getAdminOverview, getAuditLog } from '@/lib/admin-audit'
import { AdminLogin } from '@/components/sections/AdminLogin'
import { AdminAuditLog } from '@/components/sections/AdminAuditLog'
import { logout } from './actions'

export const metadata: Metadata = {
  title: 'Admin — Findability Usage',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50
const LEAD_MAX = 59 // score < 60 = a weak result worth reaching out about

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
    </div>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>
}) {
  if (!(await isAdmin())) {
    return (
      <main id="main-content" className="relative min-h-screen">
        <AdminLogin />
      </main>
    )
  }

  const sp = await searchParams
  const leadsView = sp.view === 'leads'
  const page = Math.max(0, Number(sp.page ?? 0) || 0)

  const [overview, log] = await Promise.all([
    getAdminOverview(),
    getAuditLog({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      maxScore: leadsView ? LEAD_MAX : 100,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(log.total / PAGE_SIZE))
  const linkFor = (p: number) =>
    `/audit/admin?${new URLSearchParams({ ...(leadsView ? { view: 'leads' } : {}), page: String(p) }).toString()}`

  return (
    <main id="main-content" className="relative min-h-screen px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Admin</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Findability usage</h1>
          </div>
          <form action={logout}>
            <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>

        {overview === null ? (
          <div className="glass-card mt-8 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Analytics not reachable.</p>
            <p className="mt-2">
              You&apos;re signed in, but the usage RPCs returned nothing. Confirm{' '}
              <code className="text-foreground">ADMIN_KEY</code> matches the{' '}
              <code className="text-foreground">admin_key</code> row in Supabase, and that migration{' '}
              <code className="text-foreground">0004_admin_audit_log.sql</code> has been run.
            </p>
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Tile label="Total scans" value={overview.total} />
              <Tile label="Today" value={overview.today} />
              <Tile label="7 days" value={overview.last_7d} />
              <Tile label="30 days" value={overview.last_30d} />
              <Tile label="Avg score" value={overview.avg_score ?? '—'} />
              <Tile label="Domains" value={overview.unique_domains} />
            </div>

            {/* Filter toggle */}
            <div className="mt-8 flex items-center gap-2">
              <Link
                href="/audit/admin"
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  !leadsView ? 'bg-primary text-background' : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                All scans
              </Link>
              <Link
                href="/audit/admin?view=leads"
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  leadsView ? 'bg-primary text-background' : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Warm leads (&lt; 60) · {overview.leads}
              </Link>
            </div>

            {/* Log */}
            <div className="mt-4">
              <AdminAuditLog rows={log.rows} />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {page + 1} of {totalPages} · {log.total} {leadsView ? 'leads' : 'scans'}
                </span>
                <div className="flex gap-2">
                  {page > 0 && (
                    <Link href={linkFor(page - 1)} className="rounded-lg border border-border px-3 py-1.5 hover:text-foreground">
                      ← Newer
                    </Link>
                  )}
                  {page + 1 < totalPages && (
                    <Link href={linkFor(page + 1)} className="rounded-lg border border-border px-3 py-1.5 hover:text-foreground">
                      Older →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
