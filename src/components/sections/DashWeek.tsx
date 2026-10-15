import type { Health } from '@/lib/admin-dashboard'
import { Chip, CopyButton, Updated } from './DashParts'

export function DashHealth({ health, updated }: { health: Health | null; updated?: string }) {
  if (!health) return <p className="mt-6 text-sm text-muted-foreground">No health report yet.</p>
  const { sentinel, f0rmless } = health
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="glass-card min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading font-semibold">All live sites</p>
          <span className="text-xs text-muted-foreground">checked {sentinel.swept_at ?? 'never'}</span>
        </div>
        {sentinel.failed && <p className="mt-2 text-sm text-danger">The last health sweep failed to run.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {sentinel.sections.map((s) => (
            <Chip key={s.label} level={s.level}>
              {s.label} · {s.count}
            </Chip>
          ))}
        </div>
        <ul className="mt-3 grid gap-2">
          {sentinel.sections.flatMap((s) => s.items.map((it, i) => ({ it, level: s.level, k: `${s.label}-${i}` }))).map(({ it, level, k }) => (
            <li key={k} className="flex gap-2 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${level === 'red' ? 'bg-danger' : level === 'amber' ? 'bg-warning' : 'bg-muted-foreground'}`} />
              <span className="min-w-0">{it}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <CopyButton text="sweep" />
        </div>
      </section>

      <section className="glass-card min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading font-semibold">f0rmless watcher</p>
          <span className="text-xs text-muted-foreground">checked {f0rmless.checked_at ?? 'never'}</span>
        </div>
        <p className="mt-2 text-sm">{f0rmless.status || 'No status.'}</p>
        {f0rmless.wire && <p className="mt-1 text-sm text-warning">{f0rmless.wire}</p>}
        {f0rmless.vitals && <p className="mt-1 text-xs text-muted-foreground">{f0rmless.vitals}</p>}
        <ul className="mt-3 grid gap-1.5">
          {f0rmless.findings.map((f, i) => (
            <li key={i} className="text-xs">
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-3">
          <CopyButton text="refresh f0rmless" />
          <Updated iso={updated} />
        </div>
      </section>
    </div>
  )
}
