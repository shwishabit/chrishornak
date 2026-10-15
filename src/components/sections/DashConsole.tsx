'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FEED_GROUPS, fmtMins, type FeedGroup } from '@/lib/dash-feed'
import { useFilters, type View } from '@/lib/dash-console'

/* The console (2026-10-15, Nostromo B4): one line that searches, filters and runs commands,
 * with the section tabs under it. A filter tag shows in the line only while that filter is ON
 * ("spam hidden" is the default and gets none). Typing shows suggestions: Filters, Items,
 * People & companies, Commands. Block cursor follows the text; the real input is invisible. */

export interface ConsoleTab<T extends string> { id: T; label: string; count?: number }

type Opt = {
  key: string
  section: 'Filters' | 'Items' | 'People & companies' | 'Commands'
  glyph: string
  label: string
  hint?: string
  right?: string
  complete: string
  run: () => void
}


/** Wraps the matched letters in <mark> so they glow. */
function Hit({ text, needle }: { text: string; needle: string }) {
  if (!needle) return <>{text}</>
  const i = text.toLowerCase().indexOf(needle.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + needle.length)}</mark>
      {text.slice(i + needle.length)}
    </>
  )
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done today' },
  { id: 'snoozed', label: 'Snoozed' },
]

export function DashConsole<T extends string>({
  tabs,
  tab,
  onTab,
  people,
}: {
  tabs: ConsoleTab<T>[]
  tab: T
  onTab: (t: T) => void
  people: string[]
}) {
  const f = useFilters()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(0)
  // Where the real text cursor is, so the block cursor sits there (Home, arrows and clicks move it, like a terminal).
  const [pos, setPos] = useState(0)
  // The block stays solid while typing, then blinks again.
  const [typing, setTyping] = useState(false)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncPos = () => setPos(inputRef.current?.selectionStart ?? 0)
  useLayoutEffect(syncPos, [text])
  useEffect(() => () => { if (typingTimer.current) clearTimeout(typingTimer.current) }, [])

  const groupLabel = (g: FeedGroup) => FEED_GROUPS.find((x) => x.id === g)?.label ?? g
  const meta = f.meta

  // "/" jumps to the console from anywhere on the page.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [])

  const toFeed = () => onTab('feed' as T)
  const clear = () => {
    setText('')
    f.setQ('')
    setOpen(false)
    setSel(0)
  }

  /** Text that is a command or a filter token is not a plain search. */
  const isCommand = (t: string) => /^(focus\b|done\b|\w+\s*<\s*\d+\s*m?$|(group|brand|time|spam):)/i.test(t.trim())

  function onType(v: string) {
    setText(v)
    setTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 700)
    setOpen(true)
    setSel(0)
    f.setQ(isCommand(v) ? '' : v)
    if (v.trim() && !isCommand(v)) toFeed()
  }

  const options = useMemo<Opt[]>(() => {
    const raw = text.trim()
    const empty = !raw
    // Strip a "group:" style prefix so "group:sal" still matches "Sales".
    const m = /^(group|brand|time|spam):\s*(.*)$/i.exec(raw)
    const needle = (m ? m[2] : raw).toLowerCase()
    const out: Opt[] = []
    const pick = (fn: () => void) => () => {
      fn()
      toFeed()
      clear()
    }

    // Filters
    for (const g of FEED_GROUPS) {
      if (m && m[1].toLowerCase() !== 'group') break
      if (needle && !(g.label.toLowerCase().includes(needle) || g.id.includes(needle))) continue
      out.push({ key: `g:${g.id}`, section: 'Filters', glyph: '▦', label: g.label, hint: `group: `, right: '', complete: `group:${g.id}`, run: pick(() => f.setGroup(g.id)) })
      const n = meta?.groupCounts[g.id]
      if (n !== undefined) out[out.length - 1].right = `${n} open`
    }
    for (const [b, n] of (empty ? (meta?.brands ?? []).slice(0, 3) : meta?.brands ?? [])) {
      if (m && m[1].toLowerCase() !== 'brand') break
      if (!b.toLowerCase().includes(needle)) continue
      out.push({ key: `b:${b}`, section: 'Filters', glyph: '◆', label: b, hint: 'brand: ', right: `${n}`, complete: `brand:${b}`, run: pick(() => f.setBrand(b)) })
    }
    if ((!m || m[1].toLowerCase() === 'time') && ('time under 15m quick short'.includes(needle) || /^<?\s*\d/.test(needle))) {
      out.push({ key: 't:15', section: 'Filters', glyph: '◷', label: 'under 15m', hint: 'time: ', right: '', complete: 'time:<15m', run: pick(() => f.setQuick(true)) })
    }
    if ((!m || m[1].toLowerCase() === 'spam') && 'spam likely spam'.includes(needle) && (meta?.spamCount ?? 0) > 0) {
      out.push({ key: 's:spam', section: 'Filters', glyph: '!', label: 'show likely spam', hint: 'spam: ', right: `${meta!.spamCount}`, complete: 'spam:show', run: pick(() => f.setShowSpam(true)) })
    }

    if (empty) {
      out.push({ key: 'c:focus-hint', section: 'Commands', glyph: '▸', label: 'focus <group>', hint: ' · one item at a time', complete: 'focus ', run: () => { setText('focus '); setOpen(true) } })
    }
    if (!m) {
      // Items: Feed titles
      let n = 0
      for (const it of empty ? [] : meta?.items ?? []) {
        if (n >= 5) break
        if (!`${it.title} ${it.brand}`.toLowerCase().includes(needle)) continue
        n++
        out.push({
          key: `i:${it.id}`,
          section: 'Items',
          glyph: '→',
          label: it.title,
          hint: ` · ${it.brand} · ${groupLabel(it.group)}`,
          right: fmtMins(it.mins),
          complete: it.title,
          run: () => {
            f.setJump(it.id)
            toFeed()
            clear()
          },
        })
      }
      // People & companies
      n = 0
      for (const p of empty ? [] : people) {
        if (n >= 4) break
        if (!p.toLowerCase().includes(needle)) continue
        n++
        out.push({ key: `p:${p}`, section: 'People & companies', glyph: '◇', label: p, complete: p, run: () => { setText(p); f.setQ(p); toFeed(); setOpen(false) } })
      }
      // Commands
      const mins = (g: FeedGroup) => {
        const items = (meta?.items ?? []).filter((i) => i.group === g)
        return items.reduce((t, i) => t + i.mins, 0)
      }
      for (const g of FEED_GROUPS) {
        if (!('focus'.startsWith(needle) || needle.startsWith('focus') || g.label.toLowerCase().includes(needle.replace(/^focus\s*/, '')))) continue
        if (!/^f/.test(needle) && !needle.startsWith('focus')) continue
        out.push({
          key: `c:focus:${g.id}`,
          section: 'Commands',
          glyph: '▸',
          label: `focus ${g.id}`,
          hint: ` · one at a time, ~${fmtMins(mins(g.id))}`,
          complete: `focus ${g.id}`,
          run: () => { f.setGroup(g.id); f.requestFocus(); toFeed(); clear() },
        })
      }
      for (const g of FEED_GROUPS) {
        if (!g.id.startsWith(needle.replace(/\s*<.*$/, '')) || needle.length < 2) continue
        out.push({
          key: `c:quick:${g.id}`,
          section: 'Commands',
          glyph: '▸',
          label: `${g.id} <15m`,
          hint: ` · quick ${g.label.toLowerCase()} items`,
          complete: `${g.id} <15m`,
          run: () => { f.setGroup(g.id); f.setQuick(true); toFeed(); clear() },
        })
      }
      const dn = /^done\s*(\d*)$/i.exec(raw)
      if (dn || 'done'.startsWith(needle)) {
        const n2 = Number(dn?.[1] || 0)
        out.push({
          key: 'c:done',
          section: 'Commands',
          glyph: '▸',
          label: n2 ? `done ${n2}` : 'done N',
          hint: n2 ? ` · mark item ${n2} in the Feed done` : ' · mark the Nth Feed item done',
          complete: n2 ? `done ${n2}` : 'done ',
          run: () => {
            if (!n2) { setText('done '); return }
            toFeed()
            f.api.current?.doneNth(n2)
            clear()
          },
        })
      }
    }
    return out.slice(0, 14)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, meta, people])

  const shownOpen = open && options.length > 0
  const needleForMark = (() => {
    const m = /^(group|brand|time|spam):\s*(.*)$/i.exec(text.trim())
    return (m ? m[2] : text.trim().replace(/^focus\s+/i, '')).trim()
  })()

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      if (open) { setOpen(false); e.stopPropagation() }
      else if (text) clear()
      return
    }
    if (e.key === 'Backspace' && !text) {
      // Remove the last filter tag.
      if (f.showSpam) f.setShowSpam(false)
      else if (f.quick) f.setQuick(false)
      else if (f.brand !== 'all') f.setBrand('all')
      else if (f.group !== 'all') f.setGroup('all')
      return
    }
    if (!shownOpen) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => (s + 1) % options.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => (s - 1 + options.length) % options.length) }
    else if (e.key === 'Enter') { e.preventDefault(); options[sel]?.run() }
    else if (e.key === 'Tab') {
      const o = options[sel]
      if (!o) return
      e.preventDefault()
      if (o.section === 'Filters') o.run()
      else { setText(o.complete); setSel(0) }
    }
  }

  const tags: { key: string; label: string; value: string; off: () => void }[] = []
  if (f.group !== 'all') tags.push({ key: 'group', label: 'group:', value: groupLabel(f.group), off: () => f.setGroup('all') })
  if (f.brand !== 'all') tags.push({ key: 'brand', label: 'brand:', value: f.brand, off: () => f.setBrand('all') })
  if (f.quick) tags.push({ key: 'time', label: 'time:', value: '<15m', off: () => f.setQuick(false) })
  if (f.showSpam) tags.push({ key: 'spam', label: 'spam:', value: 'shown', off: () => f.setShowSpam(false) })

  const feedTab = tab === ('feed' as T)
  const activeId = shownOpen ? `${listId}-o${sel}` : undefined
  let lastSection = ''

  return (
    <section aria-label="Console" className="nx-box nx-well relative z-10">
      <div className="relative">
        <label className="nx-scan flex min-h-14 cursor-text flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-border px-4 py-3.5 sm:px-6.5 md:py-5.5">
          <span className="text-[20px] font-medium leading-none text-[#7fe2ac] [text-shadow:0_0_16px_rgba(95,211,148,.85)]" aria-hidden="true">▸</span>
          {tags.map((t) => (
            <button key={t.key} type="button" className="nx-tok" onClick={t.off} aria-label={`Remove filter ${t.label} ${t.value}`}>
              <span>{t.label}</span>
              {t.value}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <span className="relative flex min-h-11 min-w-[10rem] flex-1 items-center gap-0 overflow-hidden text-base leading-[1.4] tracking-[0.02em]">
            <span aria-hidden="true" className="whitespace-pre text-[#ece9e2]">{text.slice(0, Math.min(pos, text.length))}</span>
            <span className={`nx-caret ${typing ? 'nx-caret-still' : ''}`} aria-hidden="true" />
            {text && <span aria-hidden="true" className="whitespace-pre text-[#ece9e2]">{text.slice(Math.min(pos, text.length))}</span>}
            {!text && <span aria-hidden="true" className="nx-hint ml-2 truncate text-[#8d929a]"><span className="sm:hidden">search or filter</span><span className="hidden sm:inline">search, filter or run a command</span></span>}
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => setOpen(true)}
              onClick={() => { setOpen(true); syncPos() }}
              onSelect={syncPos}
              onKeyUp={syncPos}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              role="combobox"
              aria-label="Search, filter or run a command"
              aria-expanded={shownOpen}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              autoComplete="off"
              spellCheck={false}
              className="absolute inset-0 w-full bg-transparent text-base text-transparent outline-none [caret-color:transparent]"
            />
          </span>
        </label>

        {shownOpen && (
          <div id={listId} role="listbox" aria-label="Suggestions" className="nx-ac">
            {options.map((o, i) => {
              const head = o.section !== lastSection
              lastSection = o.section
              return (
                <div key={o.key}>
                  {head && <div className="nx-ach" role="presentation">{o.section}</div>}
                  <div
                    id={`${listId}-o${i}`}
                    role="option"
                    aria-selected={i === sel}
                    className="nx-aci"
                    onMouseDown={(e) => { e.preventDefault(); o.run() }}
                    onMouseMove={() => setSel(i)}
                  >
                    <span className="k" aria-hidden="true">{o.glyph}</span>
                    <span className="min-w-0 truncate">
                      {o.hint && o.section === 'Filters' && <span className="k">{o.hint}</span>}
                      <Hit text={o.label} needle={needleForMark} />
                      {o.hint && o.section !== 'Filters' && <span className="k">{o.hint}</span>}
                    </span>
                    <span className="k">{i === sel && o.section !== 'Items' ? 'Tab' : o.right}</span>
                  </div>
                </div>
              )
            })}
            <div className="flex gap-4 border-t border-border px-3.5 py-2.5 text-[11px] uppercase tracking-[0.12em] text-[#8d929a]">
              <span>↑↓ move</span>
              <span>Enter pick</span>
              <span className="hidden sm:inline">Tab complete</span>
              <span>Esc close</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-2 px-2.5 sm:px-2.5">
        <nav aria-label="Sections" role="tablist" id="dash-tabs" className="flex flex-wrap scroll-mt-6">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => onTab(t.id)} className="nx-seg">
              {t.label}
              {(t.count ?? 0) > 0 && <b>{t.count}</b>}
            </button>
          ))}
        </nav>
        {feedTab && (
          <div role="group" aria-label="View" className="flex flex-wrap border-l border-border pl-1.5">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" aria-pressed={f.view === v.id} onClick={() => f.setView(v.id)} className="nx-seg">
                {v.label}
                {meta && <b>{v.id === 'open' ? meta.openCount : v.id === 'done' ? meta.doneCount : meta.snoozedCount}</b>}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
