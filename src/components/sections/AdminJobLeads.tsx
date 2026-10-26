'use client'

import { useEffect, useId, useMemo, useRef, useState, useTransition } from 'react'
import type { JobLead, JobStatus } from '@/lib/admin-jobs'
import { scoreLead, WORTH_A_LOOK, type JobScore } from '@/lib/job-score'
import { setJobLeadNote, setJobLeadStatus } from '@/app/audit/admin/jobs/actions'
import { useSort } from '@/hooks/useSort'
import { SortTh } from '@/components/ui/SortTh'

const STATUS_LABEL: Record<JobStatus, string> = {
  new: 'New',
  pitched: 'Pitched',
  replied: 'Replied',
  won: 'Won',
  passed: 'Passed',
  skipped: 'Skipped',
}
const CLOSED: JobStatus[] = ['won', 'passed', 'skipped']

const FIT_CLASS: Record<JobLead['fit'], string> = {
  strong: 'border-success/40 text-success',
  good: 'border-primary/40 text-primary',
  weak: 'border-border text-muted-foreground',
  skip: 'border-destructive/40 text-destructive',
}

const KIND_LABEL: Record<JobLead['kind'], string> = {
  direct: 'Direct post',
  board: 'Job-board repost',
  skipped: 'Skipped by Claude',
}

const SOURCE_LABEL: Record<string, string> = { bluesky: 'Bluesky', hackernews: 'Hacker News', contra: 'Contra', upwork: 'Upwork' }

const BAND_CLASS: Record<JobScore['band'], string> = {
  hot: 'border-success/50 bg-success/10 text-success',
  good: 'border-primary/50 bg-primary/10 text-primary',
  maybe: 'border-border text-foreground',
  low: 'border-border text-muted-foreground',
}
const BAND_LABEL: Record<JobScore['band'], string> = { hot: 'Go for it', good: 'Worth it', maybe: 'Maybe', low: 'Low' }

// The table scrolls sideways, which would clip an absolute popover, so the hover box is
// fixed to the viewport and placed from the badge's position. Hover, focus or tap opens it.
function ScoreBadge({ score }: { score: JobScore }) {
  const id = useId()
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function show() {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const width = 300
    const below = r.bottom + 6
    const top = below + 260 > window.innerHeight ? Math.max(8, r.top - 266) : below
    setPos({ top, left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)) })
  }
  const hide = () => setPos(null)

  useEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [pos])

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (pos ? hide() : show())}
        className={`inline-flex min-w-13 flex-col items-center rounded-lg border px-2 py-1 ${BAND_CLASS[score.band]}`}
      >
        <span className="font-heading text-lg font-bold leading-none tabular-nums">{score.total}</span>
        <span className="mt-0.5 whitespace-nowrap text-[10px] uppercase tracking-wide">{BAND_LABEL[score.band]}</span>
      </button>
      <div
        id={id}
        role="tooltip"
        hidden={!pos}
        style={pos ? { top: pos.top, left: pos.left } : undefined}
        className="fixed z-50 w-75 rounded-xl border border-border bg-background p-3 text-xs shadow-lg"
      >
        <p className="mb-2 font-semibold text-foreground">
          Score {score.total} of 100 · {BAND_LABEL[score.band]}
        </p>
        <ul className="space-y-1.5">
          {score.parts.map((p) => (
            <li key={p.label} className="flex items-start justify-between gap-3">
              <span>
                <span className="font-medium text-foreground">{p.label}</span>
                <span className="block text-muted-foreground">{p.detail}</span>
              </span>
              <span className={`shrink-0 tabular-nums ${p.points < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {p.max > 0 ? `${p.points}/${p.max}` : p.points}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-border pt-2 text-muted-foreground">
          75+ go for it · 55-74 worth it · 35-54 maybe · under 35 low
        </p>
      </div>
    </>
  )
}

function profileUrl(l: JobLead): string | null {
  if (!l.handle) return null
  if (l.source === 'hackernews') return `https://news.ycombinator.com/user?id=${encodeURIComponent(l.handle)}`
  if (l.source === 'bluesky') return `https://bsky.app/profile/${l.handle}`
  return null
}

type Filter = 'open' | 'fulltime' | 'closed' | 'all'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'fulltime', label: 'Full-time' },
  { id: 'closed', label: 'Closed / skipped' },
  { id: 'all', label: 'All' },
]

function isClosed(l: JobLead) {
  return CLOSED.includes(l.status) || l.kind === 'skipped'
}

function isFullTime(l: JobLead) {
  return l.work_type === 'full-time'
}

// A full-time first-marketer role at a small startup can be pitched as a fractional lead,
// so it also shows on the Open tab.
function showsOnOpen(l: JobLead) {
  return !isFullTime(l) || l.tags.includes('pitch as fractional')
}

function NoteBox({ lead }: { lead: JobLead }) {
  const [value, setValue] = useState(lead.note)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onChange(v: string) {
    setValue(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setState('saving')
      const ok = await setJobLeadNote(lead.id, v)
      setState(ok ? 'saved' : 'error')
    }, 800)
  }

  return (
    <div>
      <textarea
        id={`note-${lead.id}`}
        aria-label={`Notes for ${lead.who}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full min-w-[180px] resize-y rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary"
      />
      <p className="h-4 text-xs text-muted-foreground" aria-live="polite">
        {state === 'saving' && 'Saving…'}
        {state === 'saved' && <span className="text-success">Saved</span>}
        {state === 'error' && <span className="text-destructive">Not saved. Sign in again.</span>}
      </p>
    </div>
  )
}

function StatusSelect({ lead, onSaved }: { lead: JobLead; onSaved: (s: JobStatus) => void }) {
  const [value, setValue] = useState<JobStatus>(lead.status)
  const [pending, start] = useTransition()
  const [failed, setFailed] = useState(false)

  return (
    <div>
      <select
        id={`status-${lead.id}`}
        aria-label={`Status for ${lead.who}`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as JobStatus
          const prev = value
          setValue(next)
          start(async () => {
            const ok = await setJobLeadStatus(lead.id, next)
            setFailed(!ok)
            if (ok) onSaved(next)
            else setValue(prev)
          })
        }}
        className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-sm outline-none focus:border-primary"
      >
        {(Object.keys(STATUS_LABEL) as JobStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {failed && <p className="mt-1 text-xs text-destructive">Not saved.</p>}
    </div>
  )
}

const FIT_RANK: Record<JobLead['fit'], number> = { strong: 0, good: 1, weak: 2, skip: 3 }
const STATUS_RANK = Object.fromEntries((Object.keys(STATUS_LABEL) as JobStatus[]).map((s, i) => [s, i])) as Record<JobStatus, number>

const ANY = ''

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-background/60 px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary ${
          value !== ANY ? 'border-primary' : 'border-border'
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Freelance and contract are the same kind of work to Chris, so they share one filter option
// and one label (2026-10-13). The stored work_type is unchanged.
const FREELANCE_CONTRACT = 'freelance-contract'
const workGroup = (w: JobLead['work_type']) => (w === 'freelance' || w === 'contract' ? FREELANCE_CONTRACT : w)
const workLabel = (g: string) => (g === FREELANCE_CONTRACT ? 'Freelance / contract' : cap(g))

export function AdminJobLeads({ leads, today }: { leads: JobLead[]; today: string }) {
  const [rows, setRows] = useState(leads)
  const scores = useMemo(
    () => new Map<string, JobScore>(rows.map((l) => [l.id, scoreLead(l, today)] as const)),
    [rows, today],
  )
  const worth = (l: JobLead) => l.status === 'new' && l.kind !== 'skipped' && scores.get(l.id)!.total >= WORTH_A_LOOK
  const [filter, setFilter] = useState<Filter>('open')
  const [q, setQ] = useState('')
  const [source, setSource] = useState(ANY)
  const [workType, setWorkType] = useState(ANY)
  const [fit, setFit] = useState(ANY)
  const [status, setStatus] = useState(ANY)
  const [tag, setTag] = useState(ANY)
  const [onlyHighlight, setOnlyHighlight] = useState(false)

  // Options come from the data, so a new source, work type or tag shows up without a code change.
  const opts = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs)].sort()
    return {
      source: uniq(rows.map((l) => l.source)),
      workType: uniq(rows.map((l) => workGroup(l.work_type))),
      tag: uniq(rows.flatMap((l) => l.tags)),
    }
  }, [rows])

  // A status pick searches every tab: a lead marked Skipped/Passed/Won leaves Open, so filtering
  // Open by "Skipped" would always come back empty.
  const statusAcrossTabs = status !== ANY
  const tabRows = useMemo(
    () =>
      rows.filter((l) => {
        if (statusAcrossTabs) return true
        if (filter === 'open') return !isClosed(l) && showsOnOpen(l)
        if (filter === 'fulltime') return !isClosed(l) && isFullTime(l)
        if (filter === 'closed') return isClosed(l)
        return true
      }),
    [rows, filter, statusAcrossTabs],
  )

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return tabRows
      .filter((l) => {
        if (source && l.source !== source) return false
        if (workType && workGroup(l.work_type) !== workType) return false
        if (fit && l.fit !== fit) return false
        if (status && l.status !== status) return false
        if (tag && !l.tags.includes(tag)) return false
        if (onlyHighlight && !worth(l)) return false
        if (needle && !`${l.who} ${l.handle ?? ''} ${l.ask} ${l.note} ${l.fit_why ?? ''} ${l.tags.join(' ')}`.toLowerCase().includes(needle))
          return false
        return true
      })
      .sort(
        (a, b) =>
          scores.get(b.id)!.total - scores.get(a.id)!.total ||
          FIT_RANK[a.fit] - FIT_RANK[b.fit] ||
          -(a.posted ?? '').localeCompare(b.posted ?? ''),
      )
  }, [tabRows, q, source, workType, fit, status, tag, onlyHighlight, scores])

  // Column headers sort the table (2026-10-26). With no column picked it stays highest score
  // first, and a column sort keeps that order for ties.
  const { sorted, sort } = useSort(shown, {
    score: { get: (l) => scores.get(l.id)!.total, first: 'desc' },
    posted: { get: (l) => l.posted, first: 'desc' },
    who: { get: (l) => l.who },
    ask: { get: (l) => l.ask },
    fit: { get: (l) => FIT_RANK[l.fit] },
    status: { get: (l) => STATUS_RANK[l.status] },
    note: { get: (l) => l.note.trim() },
  })

  const filtersOn = Boolean(q || source || workType || fit || status || tag || onlyHighlight || sort.key)
  function clearFilters() {
    setQ('')
    setSource(ANY)
    setWorkType(ANY)
    setFit(ANY)
    setStatus(ANY)
    setTag(ANY)
    setOnlyHighlight(false)
    sort.reset()
  }

  const count = (s: JobStatus) => rows.filter((l) => l.status === s && l.kind !== 'skipped' && !isFullTime(l)).length
  const ftOpen = rows.filter((l) => isFullTime(l) && !isClosed(l))
  const ftHighlighted = ftOpen.filter(worth).length
  const mainHighlighted = rows.filter((l) => showsOnOpen(l) && !isClosed(l) && worth(l)).length

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ['Worth a look', mainHighlighted],
          ['New', count('new')],
          ['Pitched', count('pitched')],
          ['Replied', count('replied')],
          ['Full-time worth a look', `${ftHighlighted} of ${ftOpen.length}`],
        ].map(([label, value]) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              filter === f.id ? 'bg-primary text-background' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            {f.id === 'fulltime' && ftOpen.length > 0 && <span className="ml-1.5 tabular-nums opacity-70">{ftOpen.length}</span>}
          </button>
        ))}
      </div>

      <div className="glass-card mt-4 grid grid-cols-2 items-end gap-3 p-4 sm:grid-cols-4 lg:grid-cols-7">
        <label htmlFor="job-search" className="col-span-2 flex flex-col gap-1 text-xs text-muted-foreground">
          Search
          <input
            id="job-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Company, skill, note…"
            className="rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <FilterSelect
          id="f-source"
          label="Source"
          value={source}
          onChange={setSource}
          options={[{ value: ANY, label: 'All' }, ...opts.source.map((s) => ({ value: s, label: SOURCE_LABEL[s] ?? s }))]}
        />
        <FilterSelect
          id="f-worktype"
          label="Work type"
          value={workType}
          onChange={setWorkType}
          options={[{ value: ANY, label: 'All' }, ...opts.workType.map((w) => ({ value: w, label: workLabel(w) }))]}
        />
        <FilterSelect
          id="f-fit"
          label="Fit"
          value={fit}
          onChange={setFit}
          options={[{ value: ANY, label: 'All' }, ...(['strong', 'good', 'weak', 'skip'] as const).map((f) => ({ value: f, label: cap(f) }))]}
        />
        <FilterSelect
          id="f-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: ANY, label: 'All' }, ...(Object.keys(STATUS_LABEL) as JobStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))]}
        />
        <FilterSelect
          id="f-tag"
          label="Tag"
          value={tag}
          onChange={setTag}
          options={[{ value: ANY, label: 'All' }, ...opts.tag.map((t) => ({ value: t, label: t }))]}
        />
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:col-span-4 lg:col-span-7">
          <label htmlFor="f-highlight" className="flex items-center gap-2 text-sm">
            <input
              id="f-highlight"
              type="checkbox"
              checked={onlyHighlight}
              onChange={(e) => setOnlyHighlight(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Worth a look only
          </label>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span aria-live="polite" className="tabular-nums">
              Showing {shown.length} of {tabRows.length}
              {statusAcrossTabs && ' · status searches all tabs'}
            </span>
            {filtersOn && (
              <button type="button" onClick={clearFilters} className="underline underline-offset-4 hover:text-foreground">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-260 text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <SortTh label="Score" k="score" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Posted" k="posted" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Who" k="who" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="The ask" k="ask" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Fit" k="fit" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Status" k="status" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Notes" k="note" sort={sort} className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                  {rows.length === 0 ? 'No leads yet.' : 'No leads match this filter.'}
                </td>
              </tr>
            )}
            {sorted.map((l) => (
              <tr key={l.id} className={`border-t border-border align-top ${worth(l) ? 'bg-primary/5' : ''}`}>
                <td className="px-4 py-3">
                  <ScoreBadge score={scores.get(l.id)!} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">{l.posted ?? '—'}</td>
                <td className="px-4 py-3">
                  {worth(l) && (
                    <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-background">
                      Worth a look
                    </span>
                  )}
                  <p className="font-semibold">{l.who}</p>
                  {l.handle &&
                    (profileUrl(l) ? (
                      <a
                        href={profileUrl(l)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        @{l.handle}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">@{l.handle}</span>
                    ))}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {SOURCE_LABEL[l.source] ?? l.source} · {KIND_LABEL[l.kind]}
                    {l.work_type !== 'unknown' && <> · {workLabel(workGroup(l.work_type)).toLowerCase()}</>}
                  </p>
                  {l.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {l.tags.map((t) => (
                        <span key={t} className="rounded-full border border-warning/40 px-2 py-0.5 text-xs text-warning">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="max-w-md px-4 py-3">
                  <p>{l.ask}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {l.link && (
                      <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                        Open post
                      </a>
                    )}
                    {l.ext_link && (
                      <a href={l.ext_link} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                        Full listing
                      </a>
                    )}
                    {l.contact && <span className="select-all text-muted-foreground">Contact: {l.contact}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs capitalize ${FIT_CLASS[l.fit]}`}>
                    {l.fit}
                  </span>
                  {l.fit_why && <p className="mt-1 text-xs text-muted-foreground">{l.fit_why}</p>}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect
                    lead={l}
                    onSaved={(s) => setRows((rs) => rs.map((r) => (r.id === l.id ? { ...r, status: s } : r)))}
                  />
                </td>
                <td className="px-4 py-3">
                  <NoteBox lead={l} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
