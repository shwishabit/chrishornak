'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AdminAuditLog } from './AdminAuditLog'
import type { AdminOverview, DomainLogRow } from '@/lib/admin-audit'

const LEAD_MAX = 59 // score < 60 = a weak result worth reaching out about

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
    </div>
  )
}

export function AdminFindability({ overview, domains }: { overview: AdminOverview; domains: DomainLogRow[] }) {
  const [leadsOnly, setLeadsOnly] = useState(false)
  const shown = useMemo(
    () => (leadsOnly ? domains.filter((d) => d.overall_score <= LEAD_MAX) : domains),
    [domains, leadsOnly],
  )

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/audit/admin/og" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
          OG checker usage →
        </Link>
        <Link href="/audit/admin/authority" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Authority Check usage →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Total scans" value={overview.total} />
        <Tile label="Today" value={overview.today} />
        <Tile label="7 days" value={overview.last_7d} />
        <Tile label="30 days" value={overview.last_30d} />
        <Tile label="Avg score" value={overview.avg_score ?? '—'} />
        <Tile label="Domains" value={overview.unique_domains} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLeadsOnly(false)}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            !leadsOnly ? 'bg-primary text-background' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          All domains
        </button>
        <button
          type="button"
          onClick={() => setLeadsOnly(true)}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            leadsOnly ? 'bg-primary text-background' : 'border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Warm leads (&lt; 60) · {domains.filter((d) => d.overall_score <= LEAD_MAX).length}
        </button>
        <span className="ml-auto text-xs text-muted-foreground">One row per domain — latest scan, ×N = scanned N times</span>
      </div>

      <div className="mt-4">
        <AdminAuditLog rows={shown} />
      </div>
    </>
  )
}
