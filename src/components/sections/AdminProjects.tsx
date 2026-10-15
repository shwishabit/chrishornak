'use client'

import { useMemo, useState } from 'react'
import type { DashProject, Scorecard } from '@/lib/admin-dashboard'
import { CopyButton, Strip, Updated } from './DashParts'

/* Projects tab (v3, 2026-10-15): one slim row per project, grouped into
 * Your move / Waiting on someone / Parked, with a 14-day activity strip.
 * "What shipped this week" sits on top, folded. */

const TAGS = ['All', 'Client', 'Owned', 'Game', 'Internal', 'Other'] as const
const TAG_DOT: Record<DashProject['tag'], string> = {
  Client: 'bg-warning',
  Owned: 'bg-primary',
  Game: 'bg-[#a99cf5]',
  Internal: 'bg-[#7cc4f2]',
  Other: 'bg-muted-foreground',
}
const SHOW_FIRST = 8

function when(p: DashProject) {
  const client = p.tag === 'Client'
  if (client && p.lane === 'waiting') return { text: `waiting ${p.days ?? '?'}d`, cls: 'text-warning' }
  if (client && p.lane === 'you') return { text: `your move · ${p.days ?? '?'}d`, cls: 'text-muted-foreground' }
  if (p.days === null) return { text: 'no date', cls: 'text-muted-foreground' }
  return { text: p.days === 0 ? 'today' : `${p.days}d ago`, cls: p.days < 2 ? 'text-primary' : 'text-muted-foreground' }
}

function ProjectRow({ p }: { p: DashProject }) {
  const w = when(p)
  const short = p.name.replace(/\s+[—(].*$/, '')
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-b border-border py-3 md:grid-cols-[minmax(170px,1.1fr)_150px_96px_minmax(0,2fr)_auto]">
      <div className="flex min-w-0 items-center gap-2.5">
        <i className={`h-2 w-2 shrink-0 rounded-xs ${TAG_DOT[p.tag]}`} title={p.tag} />
        <b className="truncate font-semibold" title={p.name}>{short}</b>
        {p.flag && (
          <span className="shrink-0 rounded-full border border-danger/45 px-1.5 text-[10px] text-danger" title={p.flag}>problem</span>
        )}
        {p.url && (
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[11px] text-muted-foreground hover:text-primary" aria-label={`Open ${short} site`}>
            ↗
          </a>
        )}
      </div>
      <Strip values={p.activity} className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto" />
      <span className={`hidden text-xs tabular-nums md:block ${w.cls}`}>{w.text}</span>
      <p
        className="col-span-2 line-clamp-2 text-[13px] text-muted-foreground md:col-span-1 md:line-clamp-1"
        title={p.next}
      >
        <span className={`md:hidden ${w.cls}`}>{w.text} · </span>
        {p.next || <span className="text-warning">No next step written</span>}
      </p>
      <div className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto">
        <CopyButton text={p.say} label="Copy" />
      </div>
    </li>
  )
}

function Lane({ title, rows, fold }: { title: string; rows: DashProject[]; fold?: string }) {
  const [more, setMore] = useState(false)
  if (rows.length === 0) return null
  const first = fold ? [] : rows.slice(0, SHOW_FIRST)
  const rest = fold ? rows : rows.slice(SHOW_FIRST)
  return (
    <div className="mt-5">
      {!fold && (
        <p className="flex items-baseline gap-2.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title} <span className="font-normal text-muted-foreground/60">{rows.length}</span>
        </p>
      )}
      <ul>{first.map((p) => <ProjectRow key={p.id} p={p} />)}</ul>
      {rest.length > 0 && (
        <>
          <button type="button" onClick={() => setMore((v) => !v)} className="mt-3 text-[13px] text-muted-foreground hover:text-foreground">
            {more ? '▾' : '▸'} {fold ?? `${rest.length} more, quieter lately`}
          </button>
          {more && <ul>{rest.map((p) => <ProjectRow key={p.id} p={p} />)}</ul>}
        </>
      )}
    </div>
  )
}

export function AdminProjects({ projects, scorecard, updated }: { projects: DashProject[]; scorecard: Scorecard | null; updated?: string }) {
  const [tag, setTag] = useState<(typeof TAGS)[number]>('All')
  const [week, setWeek] = useState(false)

  const shown = useMemo(() => (tag === 'All' ? projects : projects.filter((p) => p.tag === tag)), [projects, tag])

  if (projects.length === 0) {
    return <p className="mt-6 text-sm text-muted-foreground">No project status yet. Say &quot;refresh my dashboard&quot; in Claude Code.</p>
  }

  const yours = shown.filter((p) => p.lane === 'you')
  const waiting = shown.filter((p) => p.lane === 'waiting')
  const parked = shown.filter((p) => p.lane === 'parked')

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {scorecard ? (
          <button type="button" onClick={() => setWeek((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground" aria-expanded={week}>
            <b className="font-heading text-lg font-semibold text-foreground tabular-nums">{scorecard.total}</b> changes shipped in 7 days ·{' '}
            <span className="text-primary">{week ? 'hide' : 'see what'}</span>
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-1.5">
          {TAGS.filter((t) => t === 'All' || projects.some((p) => p.tag === t)).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${tag === t ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {week && scorecard && (
        <div className="mt-3 rounded-2xl border border-border bg-panel p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Updated iso={updated} />
            <CopyButton text="draft a LinkedIn post from this week's dashboard scorecard" label="Copy: turn into a post" />
          </div>
          <ul className="grid gap-x-8 md:grid-cols-2">
            {scorecard.repos.map((r) => (
              <li key={r.name} className="border-t border-border py-2.5 text-[13px]">
                <p className="flex justify-between gap-3">
                  <b className="font-semibold">{r.name}</b>
                  <span className="tabular-nums text-muted-foreground">{r.count}</span>
                </p>
                <ul className="mt-1 grid gap-0.5 text-xs text-muted-foreground">
                  {r.latest.slice(0, 3).map((c, i) => (
                    <li key={i} className="truncate">
                      <span className="tabular-nums">{c.date.slice(5)}</span> {c.subject}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Lane title="Your move" rows={yours} />
      <Lane title="Waiting on someone" rows={waiting} />
      <Lane title="Parked" rows={parked} fold={`Parked: ${parked.length} projects with no work in 30+ days`} />

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-muted-foreground/70">
        {(Object.keys(TAG_DOT) as DashProject['tag'][]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5"><i className={`h-2 w-2 rounded-xs ${TAG_DOT[t]}`} />{t}</span>
        ))}
        <span>Squares = changes per day, last 14 days</span>
      </div>
    </div>
  )
}
