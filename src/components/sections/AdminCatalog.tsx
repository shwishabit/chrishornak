'use client'

import { useMemo, useState } from 'react'
import type { Catalog } from '@/lib/admin-dashboard'
import { Chip, CopyButton, Updated } from './DashParts'

/* Toolbox map (v2, 2026-10-15): agents on the left, the skills and guides they
 * use on the right, a line for each use. Click either side to light up its links.
 * Built from the agent files on each hourly refresh — a line means the agent's
 * instructions name that skill or guide. */

const ROW = 26
const GROUP_GAP = 30
const W = 920
const AX = 300 // agent dot x
const SX = 620 // skill dot x
const MODEL_DOT: Record<string, string> = { opus: 'fill-primary', sonnet: 'fill-info', haiku: 'fill-success' }

type Sel = { kind: 'agent' | 'skill'; id: string } | null

export function AdminCatalog({ catalog, updated }: { catalog: Catalog | null; updated?: string }) {
  const [sel, setSel] = useState<Sel>(null)

  const layout = useMemo(() => {
    if (!catalog) return null
    const groups = [...new Set(catalog.agents.map((a) => a.group))]
    const agentY = new Map<string, number>()
    const headers: { label: string; y: number }[] = []
    let y = 20
    for (const g of groups) {
      headers.push({ label: g, y })
      y += GROUP_GAP - 6
      for (const a of catalog.agents.filter((x) => x.group === g)) {
        agentY.set(a.id, y)
        y += ROW
      }
      y += 8
    }
    const height = y + 10
    // Order used skills by the average height of their agents so lines cross less.
    const used = catalog.skills.filter((s) => s.usedBy.length > 0)
    const bary = (s: (typeof used)[number]) => s.usedBy.reduce((t, a) => t + (agentY.get(a) ?? 0), 0) / s.usedBy.length
    used.sort((a, b) => bary(a) - bary(b))
    const step = Math.max(ROW, (height - 40) / Math.max(1, used.length))
    const skillY = new Map(used.map((s, i) => [s.id, 30 + i * step]))
    const unused = catalog.skills.filter((s) => s.usedBy.length === 0)
    return { headers, agentY, skillY, used, unused, height: Math.max(height, 40 + used.length * step) }
  }, [catalog])

  if (!catalog || !layout) return <p className="mt-6 text-sm text-muted-foreground">No toolbox data yet. It fills in on the next hourly refresh.</p>

  const lit = (agent: string, skill: string) =>
    !sel || (sel.kind === 'agent' && sel.id === agent) || (sel.kind === 'skill' && sel.id === skill)
  const agentLit = (id: string) => !sel || (sel.kind === 'agent' ? sel.id === id : catalog.skills.find((s) => s.id === sel.id)?.usedBy.includes(id))
  const skillLit = (id: string) => !sel || (sel.kind === 'skill' ? sel.id === id : catalog.agents.find((a) => a.id === sel.id)?.uses.includes(id))
  const toggle = (s: NonNullable<Sel>) => setSel((cur) => (cur && cur.kind === s.kind && cur.id === s.id ? null : s))

  const selAgent = sel?.kind === 'agent' ? catalog.agents.find((a) => a.id === sel.id) : null
  const selSkill = sel?.kind === 'skill' ? catalog.skills.find((s) => s.id === sel.id) : null

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {catalog.agents.length} agents · {catalog.skills.filter((s) => s.type === 'skill').length} skills · {catalog.skills.filter((s) => s.type === 'guide').length} guides. Click a name to see its links.
        </p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><svg width="8" height="8"><circle cx="4" cy="4" r="4" className="fill-primary" /></svg>Opus</span>
          <span className="flex items-center gap-1"><svg width="8" height="8"><circle cx="4" cy="4" r="4" className="fill-info" /></svg>Sonnet</span>
          <span className="flex items-center gap-1"><svg width="8" height="8"><circle cx="4" cy="4" r="4" className="fill-success" /></svg>Haiku</span>
          <Updated iso={updated} staleHours={48} />
        </div>
      </div>

      {/* Map: wide screens */}
      <div className="glass-card hidden overflow-x-auto p-3 md:block">
        <svg viewBox={`0 0 ${W} ${layout.height}`} className="min-w-190" role="img" aria-label="Which agents use which skills">
          {catalog.agents.flatMap((a) =>
            a.uses
              .filter((s) => layout.skillY.has(s))
              .map((s) => {
                const y1 = layout.agentY.get(a.id)!
                const y2 = layout.skillY.get(s)!
                const on = lit(a.id, s)
                return (
                  <path
                    key={`${a.id}-${s}`}
                    d={`M${AX + 6},${y1} C${(AX + SX) / 2},${y1} ${(AX + SX) / 2},${y2} ${SX - 6},${y2}`}
                    fill="none"
                    className={on ? 'stroke-primary' : 'stroke-border'}
                    strokeWidth={on && sel ? 2 : 1.2}
                    opacity={on ? (sel ? 0.95 : 0.45) : 0.25}
                  />
                )
              }),
          )}
          {layout.headers.map((h) => (
            <text key={h.label} x={AX} y={h.y} textAnchor="end" className="fill-muted-foreground text-[10px] uppercase tracking-wider">
              {h.label}
            </text>
          ))}
          {catalog.agents.map((a) => {
            const y = layout.agentY.get(a.id)!
            const on = agentLit(a.id)
            return (
              <g key={a.id} className="cursor-pointer" opacity={on ? 1 : 0.3} onClick={() => toggle({ kind: 'agent', id: a.id })}>
                <rect x={0} y={y - ROW / 2} width={AX + 10} height={ROW} fill="transparent" />
                <text x={AX - 10} y={y + 4} textAnchor="end" className={`fill-foreground text-[12px] ${sel?.id === a.id ? 'font-semibold' : ''}`}>
                  {a.id}
                </text>
                <circle cx={AX} cy={y} r={4.5} className={MODEL_DOT[a.model] ?? 'fill-muted-foreground'} />
              </g>
            )
          })}
          {layout.used.map((s) => {
            const y = layout.skillY.get(s.id)!
            const on = skillLit(s.id)
            return (
              <g key={s.id} className="cursor-pointer" opacity={on ? 1 : 0.3} onClick={() => toggle({ kind: 'skill', id: s.id })}>
                <rect x={SX - 10} y={y - ROW / 2} width={W - SX + 10} height={ROW} fill="transparent" />
                {s.type === 'skill' ? (
                  <circle cx={SX} cy={y} r={4.5} className="fill-background stroke-primary" strokeWidth={1.5} />
                ) : (
                  <rect x={SX - 4} y={y - 4} width={8} height={8} className="fill-background stroke-muted-foreground" strokeWidth={1.5} />
                )}
                <text x={SX + 12} y={y + 4} className={`fill-foreground text-[12px] ${sel?.id === s.id ? 'font-semibold' : ''}`}>
                  {s.id}
                  <tspan className="fill-muted-foreground text-[10px]"> · {s.usedBy.length}</tspan>
                </text>
              </g>
            )
          })}
        </svg>
        <p className="px-2 pb-1 text-[11px] text-muted-foreground">Circle = skill · square = guide (a reference file) · the number = how many agents use it.</p>
      </div>

      {/* Selected detail */}
      {(selAgent || selSkill) && (
        <div className="glass-card min-w-0 p-4">
          {selAgent && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold">{selAgent.id}</p>
                <Chip>{selAgent.model}</Chip>
                <Chip>{selAgent.group}</Chip>
                <span className="ml-auto"><CopyButton text={selAgent.say} /></span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{selAgent.description}</p>
              <p className="mt-2 text-sm">Uses: {selAgent.uses.length ? selAgent.uses.join(', ') : 'no skills or guides by name'}</p>
            </>
          )}
          {selSkill && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading font-semibold">{selSkill.id}</p>
                <Chip>{selSkill.type}</Chip>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{selSkill.description}</p>
              <p className="mt-2 text-sm">Used by: {selSkill.usedBy.length ? selSkill.usedBy.join(', ') : 'no agent yet. You use it directly in chat.'}</p>
            </>
          )}
        </div>
      )}

      {/* List: phones */}
      <ul className="grid gap-2 md:hidden">
        {catalog.agents.map((a) => (
          <li key={a.id} className="glass-card min-w-0 p-3">
            <div className="flex items-center gap-2">
              <svg width="8" height="8" className="shrink-0"><circle cx="4" cy="4" r="4" className={MODEL_DOT[a.model] ?? 'fill-muted-foreground'} /></svg>
              <p className="min-w-0 flex-1 text-sm font-semibold">{a.id}</p>
              <CopyButton text={a.say} label="Copy" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
            {a.uses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {a.uses.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Not used by any agent yet ({layout.unused.length}) · you use these directly in chat</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {layout.unused.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle({ kind: 'skill', id: s.id })}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${sel?.id === s.id ? 'border-primary text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {s.id}
              {s.type === 'guide' && <span className="opacity-60"> · guide</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
