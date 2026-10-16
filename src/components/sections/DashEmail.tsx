'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { FeedStatus, FeedStatusRow, MailboxAccount, MailboxMessage } from '@/lib/admin-dashboard'
import { nyTomorrow } from '@/lib/dash-feed'
import { addTodoItem, getMailText, setFeedItemStatus } from '@/app/audit/admin/dashboard/actions'
import { brandChip } from '@/lib/dash-format'
import { useFilters } from '@/lib/dash-console'
import { emitTodoChange, emitUnwin, emitWin, onWins } from '@/lib/dash-wins'
import { CopyButton } from './DashParts'
import { DashModal, DayPick, Menu, MenuItem, nextMonday, openCalendar } from './DashModal'

/* Email tab (2026-10-16, Chris: "I don't have to go to Gmail unless I really need to").
 * Unread Primary mail from both inboxes, last 7 days, read here; reply in Gmail.
 * The PC pushes it every 10 minutes (dash-inbox.mjs → dash_state 'mailbox'); the text of one
 * message loads when it is opened. Done / Move write the same `mail:<id>` status the Feed uses,
 * so the two stay in step, and Done marks the message read in Gmail on the next PC run. */

type Row = MailboxMessage & { label: string }
const SITES = ['Chris Hornak', 'Blog Hands', 'Swift Growth']
const MAIL_MINS = 2
// Archive / Delete: the PC (dash-inbox.mjs) acts on a skipped row with exactly this note. Keep in step.
const ARCHIVE_NOTE = 'Archived in Gmail'
const TRASH_NOTE = 'Deleted in Gmail'

function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000))
  if (m < 60) return `${m}m ago`
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
}

/** Plain text with its web links made clickable (http and https only). */
function Linked({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>()"']+)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
            {p.length > 70 ? p.slice(0, 67) + '…' : p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

export function DashEmail({ accounts, statuses, today, updated }: { accounts: MailboxAccount[]; statuses: FeedStatusRow[]; today: string; updated?: string }) {
  const { api } = useFilters()
  const [, startTransition] = useTransition()
  // Local Done / Snooze / Skip, by `mail:<id>`, on top of what the server sent.
  const [local, setLocal] = useState<Record<string, FeedStatus | null>>({})
  const [texts, setTexts] = useState<Record<string, string | null>>({})
  const [open, setOpen] = useState<{ id: string; idx: number } | null>(null)
  const [showOther, setShowOther] = useState(false)
  const [error, setError] = useState('')
  const [last, setLast] = useState<{ row: Row; status: FeedStatus; note?: string } | null>(null)
  const [sure, setSure] = useState(false)

  // Done in the Feed hides it here too.
  useEffect(
    () =>
      onWins(
        (w) => w.id.startsWith('mail:') && setLocal((l) => ({ ...l, [w.id]: 'done' })),
        (id) => id.startsWith('mail:') && setLocal((l) => ({ ...l, [id]: null })),
      ),
    [],
  )

  const server = useMemo(() => new Map(statuses.map((s) => [s.id, s])), [statuses])
  const gone = (id: string) => {
    const key = `mail:${id}`
    if (key in local) return local[key] !== null
    const s = server.get(key)
    return !!s && (s.status !== 'snoozed' || (s.until ?? '') > today)
  }
  const all: Row[] = accounts
    .flatMap((a) => (a.ok ? a.messages.map((m) => ({ ...m, label: a.label })) : []))
    .filter((m) => !gone(m.id))
    .sort((x, y) => y.at.localeCompare(x.at))
  const work = all.filter((m) => m.work)
  const other = all.filter((m) => !m.work)
  // Prev / Next walk what you can see: work, then other when it is open.
  const list = showOther ? [...work, ...other] : work
  const found = open ? list.findIndex((m) => m.id === open.id) : -1
  const idx = !open || !list.length ? -1 : found >= 0 ? found : Math.min(open.idx, list.length - 1)
  const cur = idx >= 0 ? list[idx] : undefined
  const down = accounts.filter((a) => !a.ok)

  // Load the open message's text once.
  useEffect(() => {
    if (!cur || cur.id in texts) return
    getMailText(cur.id)
      .catch(() => null)
      .then((t) => setTexts((x) => ({ ...x, [cur.id]: t })))
  }, [cur, texts])

  function act(m: Row, status: FeedStatus | null, until?: string, note?: string) {
    const id = `mail:${m.id}`
    const prev = id in local ? local[id] : (server.get(id)?.status ?? null)
    setError('')
    setLocal((l) => ({ ...l, [id]: status }))
    if (status) setLast({ row: m, status, note })
    else setLast(null)
    // The Feed has its own copy of work mail: let it do the write (one win, one row).
    if (api.current?.act(id, status, until, note)) return
    if (status === 'done') emitWin({ id, title: m.subject, mins: MAIL_MINS, brand: m.label, at: new Date().toISOString() })
    if (status === null && prev === 'done') emitUnwin(id)
    startTransition(async () => {
      const res = await setFeedItemStatus({ id, status, title: m.subject.slice(0, 300), group: 'email', mins: MAIL_MINS, brand: m.label, ...(until && { until }), ...(note && { note }) }).catch(() => ({ ok: false }))
      if (!res.ok) {
        setLocal((l) => {
          const n = { ...l }
          delete n[id]
          return n
        })
        if (status === 'done') emitUnwin(id)
        setError('That did not save. Try again in a moment.')
      }
    })
  }

  /** Into today's to-do list, and out of this list (it stays unread in Gmail). */
  function toTodo(m: Row) {
    const site = SITES.includes(m.label) ? m.label : ''
    startTransition(async () => {
      const made = await addTodoItem(`Email from ${m.from}: ${m.subject}`.slice(0, 300), '', site).catch(() => null)
      if (!made) return setError('That did not save. Try again in a moment.')
      emitTodoChange({ id: made.id, patch: {}, row: made })
      act(m, 'skipped')
    })
  }

  /** After an action in the modal, the next message slides into the same place. */
  const step = (fn: () => void) => {
    setSure(false)
    const at = idx
    fn()
    if (list.length <= 1) setOpen(null)
    else setOpen({ id: (list[at + 1] ?? list[at - 1]).id, idx: Math.min(at, list.length - 2) })
  }

  const row = (m: Row, n: number) => (
    <EmailRow
      key={m.id}
      m={m}
      today={today}
      onOpen={() => setOpen({ id: m.id, idx: n })}
      onAct={(s, until, note) => act(m, s, until, note)}
      onToTodo={() => toTodo(m)}
    />
  )

  return (
    <section aria-labelledby="email-h" className="nx-box mt-[18px] min-w-0 p-4 md:px-7 md:py-6.5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
        <h2 id="email-h" className="text-[22px] font-normal tracking-[0.02em]">
          Email <span className="nx-lab tabular-nums">{work.length} unread</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Both inboxes, unread, last 7 days. Done marks it read in Gmail within 10 minutes.
          {updated && <> Updated {ago(updated)}.</>}
        </p>
      </div>
      <p aria-live="polite" className="mt-2 text-xs empty:hidden">
        {error ? (
          <span className="text-danger">{error}</span>
        ) : last ? (
          <span className="text-muted-foreground">
            {last.status === 'done' ? 'Done' : last.status === 'snoozed' ? 'Moved' : last.note === ARCHIVE_NOTE ? 'Archives in Gmail within 10 minutes' : last.note === TRASH_NOTE ? 'Goes to Gmail Trash within 10 minutes' : 'Hidden'}: {last.row.subject.slice(0, 60)}{' '}
            <button type="button" onClick={() => act(last.row, null)} className="ml-1 text-primary hover:underline">
              Undo
            </button>
          </span>
        ) : null}
      </p>
      {down.map((a) => (
        <p key={a.email} className="mt-3 border border-warning/50 px-3 py-2 text-[13px] text-warning">
          {a.label} inbox did not answer on the last check. <a href={a.inbox} target="_blank" rel="noopener noreferrer" className="underline">Open it in Gmail ↗</a>
        </p>
      ))}

      {accounts.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No mail yet. It arrives with the next PC check (every 10 minutes), or press Refresh now.</p>
      ) : (
        <>
          {work.length === 0 && <p className="mt-6 text-sm text-muted-foreground">Inbox zero for work mail. Nice.</p>}
          <ul className="mt-2">{work.map((m, n) => row(m, n))}</ul>
          {other.length > 0 && (
            <div className="mt-5">
              <button type="button" aria-expanded={showOther} onClick={() => setShowOther(!showOther)} className="text-[13px] text-muted-foreground hover:text-foreground">
                {showOther ? '▾' : '▸'} Other mail <span className="tabular-nums">{other.length}</span>: bills, orders, promos and automated mail
              </button>
              {showOther && <ul className="mt-1">{other.map((m, n) => row(m, work.length + n))}</ul>}
            </div>
          )}
          <p className="mt-5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
            {accounts.map((a) => (
              <a key={a.email} href={a.inbox} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                Open {a.label} in Gmail ↗
              </a>
            ))}
          </p>
        </>
      )}

      {cur && (
        <DashModal
          labelledBy="mail-h"
          top={
            <>
              Email · <span className="tabular-nums">{idx + 1} of {list.length}</span>
            </>
          }
          onClose={() => setOpen(null)}
          onPrev={idx > 0 ? () => setOpen({ id: list[idx - 1].id, idx: idx - 1 }) : null}
          onNext={idx < list.length - 1 ? () => setOpen({ id: list[idx + 1].id, idx: idx + 1 }) : null}
        >
          <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={brandChip(cur.label)}>{cur.label}</span>
            {!cur.work && <span className="border border-[#4a4f57] px-1.5 py-px text-[11px]">{cur.why}</span>}
            <span>{ago(cur.at)}</span>
          </p>
          <h2 id="mail-h" className="mt-2 text-xl font-normal leading-snug tracking-[0.02em] text-[#ece9e2] wrap-anywhere md:text-[24px]">
            {cur.subject}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground wrap-anywhere">
            From <b className="font-medium text-foreground">{cur.from}</b> {cur.addr && <>&lt;{cur.addr}&gt;</>}
          </p>
          <div className="mt-4 max-w-[72ch] whitespace-pre-wrap border-y border-border py-4 text-[15px] leading-relaxed text-[#d9d6cf] wrap-anywhere">
            {!(cur.id in texts) ? (
              <span className="text-muted-foreground">Loading the message…</span>
            ) : texts[cur.id] ? (
              <Linked text={texts[cur.id]!} />
            ) : (
              <span className="text-muted-foreground">No text could be read for this one. Open it in Gmail.</span>
            )}
          </div>
          {texts[cur.id] && texts[cur.id]!.length >= 4990 && <p className="mt-1 text-xs text-muted-foreground">Long message: the rest is in Gmail.</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href={cur.link} target="_blank" rel="noopener noreferrer" className="nx-ghost">
              Reply in Gmail <span aria-hidden="true">↗</span>
            </a>
            <CopyButton text={`draft a reply to the email from ${cur.from} about "${cur.subject.slice(0, 80)}" (${cur.label} inbox)`} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => step(() => act(cur, 'done'))} className="nx-prim !px-6 !py-3 !text-sm" title="Marks it read in Gmail within 10 minutes">
              Done
            </button>
            <div className="flex flex-wrap items-center gap-1">
              <button type="button" onClick={() => step(() => act(cur, 'skipped', undefined, ARCHIVE_NOTE))} className="nx-ghost !border-transparent" title="Out of the inbox, kept in All Mail">
                Archive
              </button>
              {sure ? (
                <span role="group" aria-label="Delete this email?" className="flex items-center gap-1 text-xs text-danger">
                  To Gmail Trash?
                  <button type="button" autoFocus onClick={() => (setSure(false), step(() => act(cur, 'skipped', undefined, TRASH_NOTE)))} className="nx-ghost !border-danger !text-danger">
                    Delete
                  </button>
                  <button type="button" onClick={() => setSure(false)} className="nx-ghost !border-transparent">
                    Keep
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setSure(true)} className="nx-ghost !border-transparent text-danger" title="Gmail keeps Trash for 30 days">
                  Delete…
                </button>
              )}
              <button type="button" onClick={() => step(() => act(cur, 'skipped'))} className="nx-ghost !border-transparent" title="Hides it here; it stays unread in Gmail">
                Skip
              </button>
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <p className="nx-lab">Move</p>
            <div className="mt-1 grid max-w-sm gap-0.5 [&_label]:px-0 [&>button]:px-0">
              <MenuItem onClick={() => step(() => toTodo(cur))}>To my to-do list</MenuItem>
              <MenuItem onClick={() => step(() => act(cur, 'snoozed'))}>To tomorrow</MenuItem>
              <MenuItem onClick={() => step(() => act(cur, 'snoozed', nextMonday(today)))}>Next week (Mon)</MenuItem>
              <DayPick min={nyTomorrow(today)} onPick={(d) => step(() => act(cur, 'snoozed', d))} />
              <DayPick
                label="To my calendar"
                min={nyTomorrow(today)}
                onPick={(d) =>
                  step(() => {
                    openCalendar(`Email: ${cur.subject}`, d)
                    act(cur, 'snoozed', d)
                  })
                }
              />
            </div>
          </div>
        </DashModal>
      )}
    </section>
  )
}

/** One email: inbox chip, sender, subject, a line of the text, Done and Move. Tap to read it. */
function EmailRow({ m, today, onOpen, onAct, onToTodo }: { m: Row; today: string; onOpen: () => void; onAct: (s: FeedStatus, until?: string, note?: string) => void; onToTodo: () => void }) {
  const [move, setMove] = useState(false)
  const [sure, setSure] = useState(false)
  return (
    <li
      onClick={(e) => !(e.target as HTMLElement).closest('a, button, select, input, label, [role=menu]') && onOpen()}
      className="-mx-3 cursor-pointer border-b border-[#323840] px-3 py-3.5 transition-colors hover:bg-[rgba(95,211,148,0.06)] hover:shadow-[inset_2px_0_0_#5fd394] focus-within:bg-[rgba(95,211,148,0.06)] focus-within:shadow-[inset_2px_0_0_#5fd394] motion-reduce:transition-none"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
        <span className={brandChip(m.label)}>{m.label}</span>
        <b className="min-w-0 truncate font-medium text-foreground">{m.from}</b>
        {!m.work && m.why && <span className="shrink-0 border border-[#4a4f57] px-1.5 py-px text-[11px] text-[#a6aab2]">{m.why}</span>}
        <span className="ml-auto shrink-0 text-xs tabular-nums text-[#8d929a]">{ago(m.at)}</span>
      </div>
      <div className="mt-1.5 flex flex-col gap-2.5 md:flex-row md:items-start md:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-normal leading-[1.45] text-[#ece9e2] wrap-anywhere">
            <button type="button" onClick={onOpen} aria-haspopup="dialog" className="text-left hover:underline focus-visible:underline">
              {m.subject}
            </button>
          </h3>
          {m.snippet && <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">{m.snippet}</p>}
        </div>
        <div className="relative flex shrink-0 items-stretch gap-2 [&>button]:flex-1 md:[&>button]:flex-none">
          <button type="button" onClick={() => onAct('done')} title="Marks it read in Gmail within 10 minutes" className="nx-ghost max-md:!flex-[2] !border-primary !text-[#a8f2c8]">
            Done
          </button>
          <button type="button" aria-haspopup="menu" aria-expanded={move} onClick={() => setMove(!move)} className="nx-ghost">
            Move
          </button>
          {move && (
            <Menu onClose={() => (setMove(false), setSure(false))}>
              <MenuItem onClick={() => (setMove(false), onAct('skipped', undefined, ARCHIVE_NOTE))}>Archive</MenuItem>
              <MenuItem danger onClick={() => (sure ? (setMove(false), setSure(false), onAct('skipped', undefined, TRASH_NOTE)) : setSure(true))}>
                {sure ? 'Click again: to Gmail Trash' : 'Delete'}
              </MenuItem>
              <MenuItem onClick={() => (setMove(false), onToTodo())}>To my to-do list</MenuItem>
              <MenuItem onClick={() => (setMove(false), onAct('snoozed'))}>To tomorrow</MenuItem>
              <MenuItem onClick={() => (setMove(false), onAct('snoozed', nextMonday(today)))}>Next week (Mon)</MenuItem>
              <DayPick min={nyTomorrow(today)} onPick={(d) => (setMove(false), onAct('snoozed', d))} />
              <DayPick
                label="To my calendar"
                min={nyTomorrow(today)}
                onPick={(d) => {
                  setMove(false)
                  openCalendar(`Email: ${m.subject}`, d)
                  onAct('snoozed', d)
                }}
              />
            </Menu>
          )}
        </div>
      </div>
    </li>
  )
}
