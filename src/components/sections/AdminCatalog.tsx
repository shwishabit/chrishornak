import catalog from '@/data/dashboard-catalog.json'

export function AdminCatalog() {
  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Agents ({catalog.agents.length})</p>
        <ul className="mt-2 space-y-2">
          {catalog.agents.map((a) => (
            <li key={a.name} className="glass-card p-3 text-sm">
              <span className="font-semibold">{a.name}</span>
              <span className="block text-xs text-muted-foreground">{a.description}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Skills ({catalog.skills.length})</p>
        <ul className="mt-2 space-y-2">
          {catalog.skills.map((s) => (
            <li key={s.name} className="glass-card p-3 text-sm">
              <span className="font-semibold">{s.name}</span>
              <span className="block text-xs text-muted-foreground">{s.description}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="sm:col-span-2 text-xs text-muted-foreground">Snapshot as of {catalog.generated} — {catalog.note}</p>
    </div>
  )
}
