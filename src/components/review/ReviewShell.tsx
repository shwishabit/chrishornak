'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { allSections, type ReviewContent, type ReviewNotes, type ReviewOption, type ReviewPage } from '@/content/reviews/types'
import type { ReviewState, Reaction } from '@/lib/review-store'

type Comments = ReviewState['comments']
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type Update = (key: string, patch: Partial<{ reaction: Reaction; note: string }>) => void

const REACTIONS: { value: Exclude<Reaction, ''>; label: string }[] = [
  { value: 'like', label: 'Like' },
  { value: 'dislike', label: "Don't like" },
  { value: 'change', label: 'Change it' },
]
const REACTION_LABEL: Record<Reaction, string> = { '': '', like: 'Like', dislike: "Don't like", change: 'Change it' }

const SAVE_DELAY = 700
const FINISH = 'finish'

export function ReviewShell({ token, content, initial }: { token: string; content: ReviewContent; initial: ReviewState }) {
  const [comments, setComments] = useState<Comments>(initial.comments)
  const [status, setStatus] = useState(initial.status)
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({})
  const [tab, setTab] = useState<string>(`${content.options[0].key}-${content.options[0].pages[0].key}`)
  const [notesHidden, setNotesHidden] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [ready, setReady] = useState(false)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pending = useRef<Record<string, { reaction: Reaction; note: string }>>({})
  const locked = status !== 'open'
  // Every page in order (A-home, A-order, B-home…), then Finish. Next/Previous walk this list.
  const tabs = useMemo(() => [...content.options.flatMap((o) => o.pages.map((p) => `${o.key}-${p.key}`)), FINISH], [content.options])

  // Tab lives in the URL hash so a reload keeps the place.
  useEffect(() => {
    const h = window.location.hash.replace('#', '')
    if (tabs.includes(h)) setTab(h)
    setReady(true)
  }, [tabs])

  const go = useCallback((t: string) => {
    setTab(t)
    window.history.replaceState(null, '', `#${t}`)
    window.scrollTo({ top: 0 })
  }, [])

  const flush = useCallback(
    async (key: string) => {
      const body = pending.current[key]
      if (!body) return
      delete pending.current[key]
      setSaveState((s) => ({ ...s, [key]: 'saving' }))
      try {
        const res = await fetch(`/api/review/${token}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: key, ...body }),
        })
        if (res.status === 409) setStatus('final')
        setSaveState((s) => ({ ...s, [key]: res.ok ? 'saved' : 'error' }))
      } catch {
        setSaveState((s) => ({ ...s, [key]: 'error' }))
      }
    },
    [token],
  )

  const update: Update = useCallback(
    (key, patch) => {
      if (locked) return
      setComments((prev) => {
        const cur = prev[key] ?? { reaction: '' as Reaction, note: '', updated_at: '' }
        const next = { ...cur, ...patch }
        pending.current[key] = { reaction: next.reaction, note: next.note }
        return { ...prev, [key]: next }
      })
      clearTimeout(timers.current[key])
      timers.current[key] = setTimeout(() => flush(key), patch.reaction !== undefined ? 0 : SAVE_DELAY)
    },
    [flush, locked],
  )

  const flushAll = useCallback(async () => {
    Object.values(timers.current).forEach(clearTimeout)
    await Promise.all(Object.keys(pending.current).map((k) => flush(k)))
  }, [flush])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flushAll()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flushAll])

  const finalize = async () => {
    setSending(true)
    setSendError('')
    await flushAll()
    try {
      const res = await fetch(`/api/review/${token}/finalize`, { method: 'POST' })
      if (res.ok || res.status === 409) {
        setStatus('final')
        setConfirming(false)
      } else {
        setSendError('Something went wrong. Please try again in a minute.')
      }
    } catch {
      setSendError('Could not reach the server. Check your connection and try again.')
    }
    setSending(false)
  }

  const total = content.options.reduce((n, o) => n + allSections(o).length + 1, 0) + 1
  const done = Object.values(comments).filter((c) => c.reaction || c.note.trim()).length
  const anySaving = Object.values(saveState).includes('saving')
  const anyError = Object.values(saveState).includes('error')
  const idx = tabs.indexOf(tab)
  const option = content.options.find((o) => tab.startsWith(`${o.key}-`))
  const page = option?.pages.find((p) => tab === `${option.key}-${p.key}`)
  const tabLabel = (t: string) => {
    if (t === FINISH) return 'Finish'
    const o = content.options.find((x) => t.startsWith(`${x.key}-`))
    const p = o?.pages.find((x) => t === `${o.key}-${x.key}`)
    return o && p ? `Option ${o.key} ${p.label.toLowerCase()}` : t
  }

  return (
    <div className={`rv-shell ${notesHidden ? 'notes-hidden' : ''}`} data-ready={ready ? '1' : undefined}>
      <header className="rv-header">
        <div className="rv-header-in">
          <div className="rv-header-l">
            <span className="rv-brand">
              <img src="/images/wordmark-light.svg" alt="Chris Hornak" width={137} height={30} /> <span>Design review</span>
            </span>
            <h1 className="rv-title">{content.title}</h1>
            <p className="rv-for">For {content.client}</p>
          </div>
          <div className="rv-header-r">
            <span className="rv-status" aria-live="polite">
              {locked ? 'Sent to Chris' : anyError ? 'Not saved, retrying when you type' : anySaving ? 'Saving…' : `${done} of ${total} answered · saved`}
            </span>
          </div>
        </div>
        <p className="rv-intro">{content.intro}</p>
      </header>

      <nav className="rv-tabbar" aria-label="Options">
        <div className="rv-tabbar-in">
          {content.options.map((o) => (
            <button key={o.key} type="button" className="rv-tab" aria-current={option?.key === o.key ? 'page' : undefined} onClick={() => go(`${o.key}-${o.pages[0].key}`)}>
              <span className="rv-tab-letter">{o.key}</span>
              <span className="rv-tab-text">
                <b>Option {o.key}: {o.name}</b>
                <span>{o.story.split('. ')[0].replace(/\.$/, '')}</span>
              </span>
            </button>
          ))}
          <button type="button" className="rv-tab rv-tab-finish" aria-current={tab === FINISH ? 'page' : undefined} onClick={() => go(FINISH)}>
            <span className="rv-tab-letter">✓</span>
            <span className="rv-tab-text">
              <b>Finish</b>
              <span>Comments and send</span>
            </span>
          </button>
          {option && (
            <button type="button" className="rv-btn rv-btn-quiet rv-hide-notes" aria-pressed={notesHidden} onClick={() => setNotesHidden((v) => !v)}>
              {notesHidden ? 'Show notes' : 'Hide notes'}
            </button>
          )}
        </div>
      </nav>

      <main id="main-content" className="rv-main">
        {option && page ? (
          <OptionView
            key={tab}
            option={option}
            page={page}
            onPage={(p) => go(`${option.key}-${p}`)}
            assets={content.assets}
            comments={comments}
            saveState={saveState}
            locked={locked}
            update={update}
            notesHidden={notesHidden}
          />
        ) : (
          <FinishView
            content={content}
            comments={comments}
            save={saveState.general}
            locked={locked}
            update={update}
            done={done}
            total={total}
            onJump={go}
            onFinalize={() => setConfirming(true)}
            onPrevious={() => go(tabs[idx - 1])}
            previousLabel={tabLabel(tabs[idx - 1])}
          />
        )}

        <div className="rv-pager" hidden={!option}>
          {idx > 0 ? (
            <button type="button" className="rv-btn" onClick={() => go(tabs[idx - 1])}>
              ← Previous: {tabLabel(tabs[idx - 1])}
            </button>
          ) : (
            <span />
          )}
          {idx < tabs.length - 1 && (
            <button type="button" className="rv-btn rv-btn-main" onClick={() => go(tabs[idx + 1])}>
              Next: {tabLabel(tabs[idx + 1])} →
            </button>
          )}
        </div>
        <p className="rv-fine">{content.fineprint}</p>
      </main>

      {confirming && (
        <div className="rv-modal" role="dialog" aria-modal="true" aria-labelledby="rv-modal-h">
          <div className="rv-modal-card">
            <h2 id="rv-modal-h">Send your review to Chris?</h2>
            <p>
              You answered {done} of {total}. After you send it, your notes are locked. Chris can open it again if you want to add more.
            </p>
            {sendError && <p className="rv-err">{sendError}</p>}
            <div className="rv-modal-btns">
              <button type="button" className="rv-btn" onClick={() => setConfirming(false)} disabled={sending}>
                Keep reviewing
              </button>
              <button type="button" className="rv-btn rv-btn-main" onClick={finalize} disabled={sending}>
                {sending ? 'Sending…' : 'Send to Chris'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── One option: the full page, notes lined up beside it ─────────────── */

function OptionView({
  option,
  page,
  onPage,
  assets,
  comments,
  saveState,
  locked,
  update,
  notesHidden,
}: {
  option: ReviewOption
  page: ReviewPage
  onPage: (pageKey: string) => void
  assets: string
  comments: Comments
  saveState: Record<string, SaveState>
  locked: boolean
  update: Update
  notesHidden: boolean
}) {
  const pageRef = useRef<HTMLDivElement>(null)
  const secRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const panelRefs = useRef<Record<string, HTMLElement | null>>({})
  const [tops, setTops] = useState<Record<string, number>>({})
  const [marks, setMarks] = useState<Record<string, number>>({})
  const [sideH, setSideH] = useState(0)
  const [focusKey, setFocusKey] = useState('')
  const [current, setCurrent] = useState(page.sections[0].key)
  const keys = useMemo(() => page.sections.map((s) => s.key), [page.sections])

  // Each note box sits level with its section; boxes never overlap, so a tall
  // box pushes the next one down.
  const layout = useCallback(() => {
    const el = pageRef.current
    if (!el) return
    const base = el.getBoundingClientRect().top
    const nextTops: Record<string, number> = {}
    const nextMarks: Record<string, number> = {}
    let floor = 0
    for (const k of keys) {
      const s = secRefs.current[k]
      const p = panelRefs.current[k]
      if (!s) continue
      const want = Math.round(s.getBoundingClientRect().top - base)
      nextMarks[k] = want
      const top = Math.max(want, floor)
      nextTops[k] = top
      floor = top + (p?.offsetHeight ?? 0) + 14
    }
    const h = Math.max(floor, el.offsetHeight)
    setTops((t) => (JSON.stringify(t) === JSON.stringify(nextTops) ? t : nextTops))
    setMarks((m) => (JSON.stringify(m) === JSON.stringify(nextMarks) ? m : nextMarks))
    setSideH((x) => (x === h ? x : h))
  }, [keys])

  // At most one layout pass per frame, however many resize events arrive.
  useLayoutEffect(() => {
    layout()
    let frame = 0
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), layout()))
    }
    const ro = new ResizeObserver(schedule)
    if (pageRef.current) ro.observe(pageRef.current)
    Object.values(panelRefs.current).forEach((el) => el && ro.observe(el))
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [layout])

  // On phones and tablets only: the note bar follows the section in the middle
  // of the screen. On desktop the side notes need no scroll tracking.
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)')
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => {
    if (!narrow) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const k = hit?.target.getAttribute('data-key')
        if (k) setCurrent(k)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    Object.values(secRefs.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [keys, narrow])

  // Clicks inside the mockup: photo carousel arrows scroll their track, and
  // placeholder links (href="#") do nothing instead of clearing the tab hash.
  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      const btn = t.closest<HTMLElement>('[data-car]')
      if (btn) {
        const track = btn.closest('.x-carousel')?.querySelector<HTMLElement>('.car-track')
        track?.scrollBy({ left: Number(btn.dataset.car) * track.clientWidth, behavior: 'smooth' })
        return
      }
      if (t.closest('a[href="#"]')) e.preventDefault()
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [])

  const currentSection = page.sections.find((s) => s.key === current) ?? page.sections[0]

  return (
    <div className="rv-option">
      <div className="rv-opt-head">
        <div>
          <h2>
            Option {option.key}: {option.name}
          </h2>
          <p>{option.story}</p>
        </div>
        <div className="rv-subtabs" role="group" aria-label={`Option ${option.key} pages`}>
          {option.pages.map((p) => (
            <button key={p.key} type="button" className="rv-subtab" aria-current={p.key === page.key ? 'page' : undefined} onClick={() => onPage(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="rv-chips" aria-label="Colors">
          {option.palette.map((c) => (
            <span key={c} style={{ background: c }} title={c} />
          ))}
        </div>
      </div>
      {option.notes && <DesignNotes optionKey={option.key} notes={option.notes} />}

      <div className="rv-stage">
        <div className="rv-pagewrap">
          <div ref={pageRef} className={`rvx ${option.theme} rv-page`} style={{ ['--wm' as string]: `url(${assets}wordmark.svg)` }}>
            {page.sections.map((s) => (
              <div
                key={s.key}
                data-key={s.key}
                ref={(el) => {
                  secRefs.current[s.key] = el
                }}
                className={`rv-sec ${focusKey === s.key ? 'is-focus' : ''}`}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            ))}
          </div>
        </div>

        <div className="rv-gutter" aria-hidden="true" style={{ height: sideH || undefined }}>
          {page.sections.map((s) => (
            <span key={s.key} className={`rv-mark ${focusKey === s.key ? 'is-focus' : ''}`} style={{ top: marks[s.key] ?? 0 }}>
              {s.key}
            </span>
          ))}
        </div>

        <div className="rv-side" style={{ height: sideH || undefined }}>
          {page.sections.map((s) => (
            <Panel
              key={s.key}
              k={s.key}
              title={`${s.key} · ${s.label}`}
              comments={comments}
              save={saveState[s.key]}
              locked={locked}
              update={update}
              style={{ top: tops[s.key] ?? 0 }}
              panelRef={(el) => {
                panelRefs.current[s.key] = el
              }}
              onFocusChange={(on) => setFocusKey(on ? s.key : '')}
            />
          ))}
        </div>
      </div>

      <div className="rv-overall">
        <Panel
          k={`${option.key}0`}
          title={`Option ${option.key} overall: ${option.name}`}
          comments={comments}
          save={saveState[`${option.key}0`]}
          locked={locked}
          update={update}
          wide
        />
      </div>

      {!notesHidden && (
        <div className="rv-dock" role="region" aria-label="Note on the section on screen">
          <Panel k={currentSection.key} title={`${currentSection.key} · ${currentSection.label}`} comments={comments} save={saveState[currentSection.key]} locked={locked} update={update} compact />
        </div>
      )}
    </div>
  )
}

/* ── Finish: summary, general comments, finalize ─────────────────────── */

function FinishView({
  content,
  comments,
  save,
  locked,
  update,
  done,
  total,
  onJump,
  onFinalize,
  onPrevious,
  previousLabel,
}: {
  content: ReviewContent
  comments: Comments
  save: SaveState | undefined
  locked: boolean
  update: Update
  done: number
  total: number
  onJump: (tab: string) => void
  onFinalize: () => void
  onPrevious: () => void
  previousLabel: string
}) {
  return (
    <div className="rv-finish">
      <h2>Finish your review</h2>
      {locked ? (
        <p className="rv-locked">Thank you. Your review was sent to Chris. Your notes are below, read-only.</p>
      ) : (
        <p>Here is everything you marked. Add any last thoughts, then send it to Chris.</p>
      )}

      <div className="rv-summary">
        {content.options.map((o) => {
          const items = [
            { key: `${o.key}0`, label: 'Overall' },
            ...o.pages.flatMap((p) => p.sections.map((s) => ({ key: s.key, label: `${s.key} · ${p.label} · ${s.label}` }))),
          ]
          return (
            <div key={o.key} className="rv-sum-opt">
              <div className="rv-sum-h">
                <b>
                  Option {o.key} · {o.name}
                </b>
                <button type="button" className="rv-link" onClick={() => onJump(`${o.key}-${o.pages[0].key}`)}>
                  Open option {o.key}
                </button>
              </div>
              <ul>
                {items.map((it) => {
                  const c = comments[it.key]
                  return (
                    <li key={it.key}>
                      <span className="rv-sum-label">{it.label}</span>
                      <span className={`rv-chip rv-chip-${c?.reaction || 'none'}`}>{c?.reaction ? REACTION_LABEL[c.reaction] : '—'}</span>
                      {c?.note?.trim() && <span className="rv-sum-note">{c.note.trim()}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      <label className="rv-general">
        <b>General comments</b>
        <span>Anything else: what you liked most, what to mix, questions for Chris.</span>
        <textarea value={comments.general?.note ?? ''} disabled={locked} rows={6} onChange={(e) => update('general', { note: e.target.value })} />
        <SaveNote state={save} />
      </label>

      <div className="rv-send">
        <button type="button" className="rv-btn" onClick={onPrevious}>
          ← Previous: {previousLabel}
        </button>
        {!locked && (
          <div className="rv-send-r">
            <span>
              {done} of {total} answered
            </span>
            <button type="button" className="rv-btn rv-btn-main rv-btn-big" onClick={onFinalize}>
              Finalize review
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── One note box ─────────────────────────────────────────────────────── */

function Panel({
  k,
  title,
  comments,
  save,
  locked,
  update,
  style,
  panelRef,
  onFocusChange,
  wide,
  compact,
}: {
  k: string
  title: string
  comments: Comments
  save: SaveState | undefined
  locked: boolean
  update: Update
  style?: React.CSSProperties
  panelRef?: (el: HTMLElement | null) => void
  onFocusChange?: (on: boolean) => void
  wide?: boolean
  compact?: boolean
}) {
  const c = comments[k]
  const reaction = c?.reaction ?? ''
  return (
    <aside
      ref={panelRef}
      className={`rv-panel ${wide ? 'is-wide' : ''} ${compact ? 'is-compact' : ''}`}
      style={style}
      aria-label={`Comments on ${title}`}
      onMouseEnter={() => onFocusChange?.(true)}
      onMouseLeave={() => onFocusChange?.(false)}
      onFocus={() => onFocusChange?.(true)}
      onBlur={() => onFocusChange?.(false)}
    >
      <b className="rv-panel-h">{title}</b>
      <div className="rv-reacts" role="group" aria-label="Your reaction">
        {REACTIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`rv-react rv-react-${r.value}`}
            aria-pressed={reaction === r.value}
            disabled={locked}
            onClick={() => update(k, { reaction: reaction === r.value ? '' : r.value })}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        aria-label={`Note on ${title}`}
        placeholder="Add a note (optional)"
        value={c?.note ?? ''}
        disabled={locked}
        rows={compact ? 2 : 3}
        onChange={(e) => update(k, { note: e.target.value })}
      />
      <SaveNote state={save} />
    </aside>
  )
}

// "Why this design": the feel, type, colors, audience and AIDA page order of one option.
function DesignNotes({ optionKey, notes }: { optionKey: string; notes: ReviewNotes }) {
  const { type } = notes
  return (
    <details className="rv-why" open>
      <summary>Why this design</summary>
      <div className="rv-why-grid">
        <div className="rv-why-cell">
          <span className="rv-why-k">The feel</span>
          <p>{notes.feel}</p>
        </div>
        <div className="rv-why-cell">
          <span className="rv-why-k">Fonts</span>
          <div className="rv-why-type">
            <span className="rv-why-aa" style={{ fontFamily: type.sample.family, fontWeight: type.sample.weight, fontVariationSettings: type.sample.vs }}>
              Aa
            </span>
            <span>
              <b>{type.display}</b> for headlines
              <br />
              <b>{type.body}</b> for body text
            </span>
          </div>
          <p>{type.why}</p>
        </div>
        <div className="rv-why-cell">
          <span className="rv-why-k">Colors</span>
          <div className="rv-why-colors">
            {notes.colors.map((c) => (
              <span key={c.hex}>
                <i style={{ background: c.hex }} />
                {c.name}
              </span>
            ))}
          </div>
          <p>{notes.colorWhy}</p>
        </div>
        <div className="rv-why-cell">
          <span className="rv-why-k">Who it speaks to</span>
          <p>{notes.audience}</p>
        </div>
      </div>
      <div className="rv-aida" aria-label={`Option ${optionKey} home page order`}>
        <span className="rv-why-k">Home page order (AIDA: Attention, Interest, Desire, Action)</span>
        <ol>
          {notes.flow.map((f) => (
            <li key={f.step}>
              <b>
                {f.step} <span>{f.keys}</span>
              </b>
              {f.text}
            </li>
          ))}
        </ol>
      </div>
    </details>
  )
}

function SaveNote({ state }: { state: SaveState | undefined }) {
  const text = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved. Keep typing to retry.' : ''
  return (
    <span className={`rv-save ${state === 'error' ? 'is-err' : ''}`} aria-live="polite">
      {text}
    </span>
  )
}
