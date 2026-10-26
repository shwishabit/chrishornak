import type { Metadata } from 'next'
import Link from 'next/link'
import { isAdmin } from '@/lib/admin-auth'
import { getOgChecksAdmin } from '@/lib/admin-og'
import { AdminLogin } from '@/components/sections/AdminLogin'
import { AdminOgChecks } from '@/components/sections/AdminOgChecks'
import { logout } from '../actions'

export const metadata: Metadata = {
  title: 'Admin — OG Checker Usage',
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
    </div>
  )
}

export default async function OgAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  if (!(await isAdmin())) {
    return (
      <main id="main-content" className="relative min-h-screen">
        <AdminLogin />
      </main>
    )
  }

  const sp = await searchParams
  const page = Math.max(0, Number(sp.page ?? 0) || 0)
  const data = await getOgChecksAdmin({ limit: PAGE_SIZE, offset: page * PAGE_SIZE })
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <main id="main-content" className="relative min-h-screen px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">Admin</p>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">OG checker usage</h1>
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
            <p className="font-semibold text-foreground">Log not reachable.</p>
            <p className="mt-2">
              You&apos;re signed in, but the log RPC returned nothing. Run migration{' '}
              <code className="text-foreground">0005_og_checks.sql</code> in the Supabase SQL
              Editor (it needs <code className="text-foreground">0004</code> applied first).
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Tile label="Total checks" value={data.total} />
              <Tile label="Today" value={data.today} />
              <Tile label="7 days" value={data.last_7d} />
              <Tile label="30 days" value={data.last_30d} />
              <Tile label="Domains" value={data.unique_domains} />
              <Tile label="Page errors" value={data.errors} />
            </div>

            <AdminOgChecks rows={data.rows} topFailed={data.top_failed} />

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {page + 1} of {totalPages} · {data.total} checks
                </span>
                <div className="flex gap-2">
                  {page > 0 && (
                    <Link href={`/audit/admin/og?page=${page - 1}`} className="rounded-lg border border-border px-3 py-1.5 hover:text-foreground">
                      ← Newer
                    </Link>
                  )}
                  {page + 1 < totalPages && (
                    <Link href={`/audit/admin/og?page=${page + 1}`} className="rounded-lg border border-border px-3 py-1.5 hover:text-foreground">
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
