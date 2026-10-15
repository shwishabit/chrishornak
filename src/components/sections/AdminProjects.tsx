import type { DashProject } from '@/lib/admin-dashboard'

export function AdminProjects({ projects }: { projects: DashProject[] }) {
  if (projects.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">No project status yet — run the refresh.</p>
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {projects.map((p) => (
        <div key={p.id} className="glass-card p-4">
          <p className="font-heading font-semibold">{p.name}</p>
          {p.status && <p className="mt-1 text-sm text-muted-foreground">{p.status}</p>}
          {p.next_action && (
            <p className="mt-2 text-xs text-foreground">
              <span className="text-muted-foreground">Next: </span>
              {p.next_action}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
