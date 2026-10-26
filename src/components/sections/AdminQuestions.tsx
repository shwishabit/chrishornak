'use client'

import { useMemo, useState } from 'react'
import type { JobLead, JobStatus } from '@/lib/admin-jobs'
import { setJobLeadNote, setJobLeadStatus } from '@/app/audit/admin/jobs/actions'
import { CopyButton } from './DashParts'
import { useSort } from '@/hooks/useSort'
import { SortTh } from '@/components/ui/SortTh'

// Questions reuse the job_leads status column, relabeled for this context —
// pitched/won don't apply here, so only the statuses that make sense show.
const Q_STATUS_LABEL: Partial<Record<JobStatus, string>> = {
  new: 'New',
  replied: 'Answered',
  passed: 'Not a fit',
  skipped: 'Spam/irrelevant',
}
const Q_STATUSES = Object.keys(Q_STATUS_LABEL) as JobStatus[]

function QuestionStatusSelect({ lead, onSaved }: { lead: JobLead; onSaved: (s: JobStatus) => void }) {
  const [value, setValue] = useState<JobStatus>(lead.status)
  const [pending, setPending] = useState(false)

  return (
    <select
      aria-label={`Status for ${lead.who}`}
      value={value}
      disabled={pending}
      onChange={async (e) => {
        const next = e.target.value as JobStatus
        const prev = value
        setValue(next)
        setPending(true)
        const ok = await setJobLeadStatus(lead.id, next)
        setPending(false)
        if (ok) onSaved(next)
        else setValue(prev)
      }}
      className="rounded-lg border border-border bg-background/60 px-2 py-1.5 text-sm outline-none focus:border-primary"
    >
      {Q_STATUSES.map((s) => (
        <option key={s} value={s}>
          {Q_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  )
}

function QuestionNoteBox({ lead }: { lead: JobLead }) {
  const [value, setValue] = useState(lead.note)
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <textarea
        aria-label={`Notes for ${lead.who}`}
        value={value}
        rows={2}
        onChange={async (e) => {
          const v = e.target.value
          setValue(v)
          setSaved(false)
          const ok = await setJobLeadNote(lead.id, v)
          setSaved(ok)
        }}
        className="w-full min-w-[180px] resize-y rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-sm outline-none transition-colors focus:border-primary"
      />
      {saved && <p className="h-4 text-xs text-success">Saved</p>}
    </div>
  )
}

export function AdminQuestions({ leads }: { leads: JobLead[] }) {
  const [rows, setRows] = useState(leads)
  const [onlyNew, setOnlyNew] = useState(true)

  const shown = useMemo(() => (onlyNew ? rows.filter((l) => l.status === 'new') : rows), [rows, onlyNew])
  const { sorted, sort } = useSort(shown, {
    posted: { get: (l) => l.posted, first: 'desc' },
    who: { get: (l) => l.who },
    ask: { get: (l) => l.ask },
    status: { get: (l) => Q_STATUSES.indexOf(l.status) },
    note: { get: (l) => l.note.trim() },
  })

  return (
    <>
      <div className="mt-6 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} className="h-4 w-4 accent-primary" />
          Unanswered only
        </label>
        <span className="text-sm text-muted-foreground">
          Showing {shown.length} of {rows.length}
        </span>
      </div>

      <div className="glass-card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-200 text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <SortTh label="Posted" k="posted" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Who" k="who" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="The question" k="ask" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Status" k="status" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Notes" k="note" sort={sort} className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  {rows.length === 0 ? 'No questions found yet.' : 'Nothing unanswered right now.'}
                </td>
              </tr>
            )}
            {sorted.map((l) => (
              <tr key={l.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">{l.posted ?? '—'}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{l.who}</p>
                  {l.handle && (
                    <a
                      href={`https://bsky.app/profile/${l.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      @{l.handle}
                    </a>
                  )}
                </td>
                <td className="max-w-md px-4 py-3">
                  <p>{l.ask}</p>
                  {l.fit_why && <p className="mt-2 text-xs text-muted-foreground">{l.fit_why}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {l.link && (
                      <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-4">
                        Open post
                      </a>
                    )}
                    {l.link && <CopyButton text={`draft a value-only Bluesky reply to ${l.link}`} label="Copy: draft a reply" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <QuestionStatusSelect lead={l} onSaved={(s) => setRows((rs) => rs.map((r) => (r.id === l.id ? { ...r, status: s } : r)))} />
                </td>
                <td className="px-4 py-3">
                  <QuestionNoteBox lead={l} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
