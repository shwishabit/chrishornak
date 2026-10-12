'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import type { JobLead, JobStatus } from '@/lib/admin-jobs'
import { setJobLeadNote, setJobLeadStatus } from '@/app/audit/admin/jobs/actions'

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

const SOURCE_LABEL: Record<string, string> = { bluesky: 'Bluesky', hackernews: 'Hacker News' }

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

export function AdminJobLeads({ leads }: { leads: JobLead[] }) {
  const [rows, setRows] = useState(leads)
  const [filter, setFilter] = useState<Filter>('open')
  const [q, setQ] = useState('')

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows
      .filter((l) => {
        if (filter === 'open' && (isClosed(l) || isFullTime(l))) return false
        if (filter === 'fulltime' && (isClosed(l) || !isFullTime(l))) return false
        if (filter === 'closed' && !isClosed(l)) return false
        if (needle && !`${l.who} ${l.handle ?? ''} ${l.ask} ${l.note} ${l.tags.join(' ')}`.toLowerCase().includes(needle)) return false
        return true
      })
      .sort((a, b) => Number(b.highlight) - Number(a.highlight))
  }, [rows, filter, q])

  const count = (s: JobStatus) => rows.filter((l) => l.status === s && l.kind !== 'skipped' && !isFullTime(l)).length
  const ftOpen = rows.filter((l) => isFullTime(l) && !isClosed(l))
  const ftHighlighted = ftOpen.filter((l) => l.highlight).length
  const mainHighlighted = rows.filter((l) => !isFullTime(l) && !isClosed(l) && l.highlight).length

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
        <input
          id="job-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          aria-label="Search leads"
          className="ml-auto w-full rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm outline-none focus:border-primary sm:w-56"
        />
      </div>

      <div className="glass-card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Posted</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">The ask</th>
              <th className="px-4 py-3 font-medium">Fit</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                  {rows.length === 0 ? 'No leads yet.' : 'No leads match this filter.'}
                </td>
              </tr>
            )}
            {shown.map((l) => (
              <tr key={l.id} className={`border-t border-border align-top ${l.highlight ? 'bg-primary/5' : ''}`}>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">{l.posted ?? '—'}</td>
                <td className="px-4 py-3">
                  {l.highlight && (
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
                    {l.work_type !== 'unknown' && <> · {l.work_type}</>}
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
                    <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                      Open post
                    </a>
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
