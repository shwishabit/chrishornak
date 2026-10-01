'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import {
  AUTHORITY_FULL,
  LETTERS,
  MAX_RIVALS,
  PROOF_CHECKS,
  TIE_GAP,
  authorityOf,
  authoritySource,
  badgeOf,
  band,
  checksIn,
  firstMoves,
  fmtAuthority,
  isGap,
  ordinal,
  parseSite,
  ranked,
  shareQuery,
  standing,
  summary,
  type AuthorityResult,
  type Letter,
  type ProofId,
  type Ranked,
  type SiteResult,
  type Standing,
} from '@/lib/authority-check'
import { ToolQuestions } from './ToolQuestions'
import '@/styles/authority-check.css'

/* ── Authority Check ────────────────────────────────────────────────────────
 * Hero form (Your site vs Rival, up to 3 rivals, or your site alone), then
 * the report: the answer in a sentence, one table (sites sorted 1st → 4th,
 * an overall score out of 100 and one row per E-E-A-T letter, the 11 checks
 * open below, the phrase behind each ✓), the first 3 moves, the 15-minute
 * offer, "How to grow each score", the three questions and how we score.
 * Opens on white, switch to dark; prints clean; the URL is the share link.
 * Mock: drafts/authority-check-results-v4-comp.html (round 4, 2026-10-01).
 * ─────────────────────────────────────────────────────────────────────── */

const RIVAL_INPUT_ID = 'ac-r1'
const THEME_KEY = 'ac-theme'
type Theme = 'light' | 'dark'

function focusRival() {
  const el = document.getElementById(RIVAL_INPUT_ID) as HTMLInputElement | null
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

/** What each part checks, in an owner's words (hero card). */
const HERO_PLAIN: Record<Letter, string> = {
  experience: 'Real work shown, years in business, customer stories',
  expertise: 'The people behind it, licenses and awards',
  authority: 'Other websites that link to you',
  trust: 'Secure site, contact details, proof of reviews',
}

const FIELD =
  'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[4px] border bg-background pl-3'
const FIELD_LABEL = 'font-code text-[11px] font-medium tracking-[.08em] whitespace-nowrap uppercase'
const INPUT =
  'h-11 w-full min-w-0 bg-transparent pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none'

function Hero({
  you,
  setYou,
  rivals,
  setRivals,
  onCompare,
  onAlone,
  loading,
  error,
}: {
  you: string
  setYou: (v: string) => void
  rivals: string[]
  setRivals: (v: string[]) => void
  onCompare: () => void
  onAlone: () => void
  loading: boolean
  error: string | null
}) {
  const extraRefs = useRef<(HTMLInputElement | null)[]>([])
  const addRef = useRef<HTMLButtonElement>(null)
  const [focusNew, setFocusNew] = useState(false)

  useEffect(() => {
    if (!focusNew) return
    extraRefs.current[rivals.length - 1]?.focus()
    setFocusNew(false)
  }, [focusNew, rivals.length])

  const setRival = (i: number, v: string) => setRivals(rivals.map((r, j) => (j === i ? v : r)))

  return (
    <section
      className="ac-noprint border-b border-border bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:24px_24px] bg-[position:-1px_-1px]"
      aria-labelledby="ac-h1"
    >
      <div className="mx-auto grid max-w-[1200px] gap-7 px-4 pt-32 pb-10 sm:px-6 md:pt-40 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end lg:gap-12 lg:pb-14">
        <div className="min-w-0">
          <p className="mb-[18px] font-code text-xs tracking-[.12em] text-primary uppercase">Free tool · No sign-up</p>
          <h1
            id="ac-h1"
            className="mb-5 max-w-[16ch] font-heading text-[clamp(34px,5vw,60px)] leading-[1.05] font-bold tracking-[-.025em] text-balance"
          >
            How do you stack up?{' '}
            <span className="font-semibold text-muted-foreground">Your site next to your rivals.</span>
          </h1>
          <p className="mb-7 max-w-[56ch] text-base text-body-soft sm:text-lg">
            Put your site next to a rival or three. Get one score out of 100 for each, sorted 1st to 4th, and
            the first 3 things to fix.
          </p>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              onCompare()
            }}
            className="grid max-w-[640px] gap-1.5 rounded-md border border-field-edge bg-field p-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(45,212,168,.18)]"
          >
            <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <div className={`${FIELD} border-primary-line`}>
                <label htmlFor="ac-site" className={`${FIELD_LABEL} text-primary`}>
                  Your site
                </label>
                <input
                  id="ac-site"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="yoursite.com"
                  value={you}
                  onChange={(e) => setYou(e.target.value)}
                  aria-describedby={error ? 'ac-error' : 'ac-hint'}
                  aria-invalid={error ? true : undefined}
                  className={INPUT}
                />
              </div>
              <span
                className="justify-self-center px-1.5 font-code text-xs font-semibold tracking-[.1em] text-primary uppercase"
                aria-hidden="true"
              >
                vs
              </span>
              <div className={`${FIELD} border-line-strong`}>
                <label htmlFor={RIVAL_INPUT_ID} className={`${FIELD_LABEL} text-muted-foreground`}>
                  Rival
                </label>
                <input
                  id={RIVAL_INPUT_ID}
                  type="text"
                  inputMode="url"
                  spellCheck={false}
                  autoCapitalize="none"
                  placeholder="optional"
                  value={rivals[0] ?? ''}
                  onChange={(e) => setRival(0, e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
            {rivals.slice(1).map((r, k) => {
              const i = k + 1
              return (
                <div key={i} className={`${FIELD} grid-cols-[auto_minmax(0,1fr)_auto] border-line-strong`}>
                  <label htmlFor={`ac-r${i + 1}`} className={`${FIELD_LABEL} text-muted-foreground`}>
                    Rival {i + 1}
                  </label>
                  <input
                    ref={(el) => {
                      extraRefs.current[i] = el
                    }}
                    id={`ac-r${i + 1}`}
                    type="text"
                    inputMode="url"
                    spellCheck={false}
                    autoCapitalize="none"
                    placeholder="another rival's site"
                    value={r}
                    onChange={(e) => setRival(i, e.target.value)}
                    className={INPUT}
                  />
                  <button
                    type="button"
                    aria-label={`Remove rival ${i + 1}`}
                    onClick={() => {
                      setRivals(rivals.filter((_, j) => j !== i))
                      addRef.current?.focus()
                    }}
                    className="mr-1 flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )
            })}
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              {rivals.length < MAX_RIVALS ? (
                <button
                  ref={addRef}
                  type="button"
                  onClick={() => {
                    setRivals([...rivals, ''])
                    setFocusNew(true)
                  }}
                  className="rounded-[4px] border border-dashed border-line-strong px-3 py-2 text-sm font-medium text-body-soft hover:border-primary-line hover:text-foreground"
                >
                  <span className="mr-1 text-primary" aria-hidden="true">
                    +
                  </span>
                  Add another rival <small className="ml-1.5 text-xs text-muted-foreground">up to {MAX_RIVALS}</small>
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={loading}
                className="h-[46px] w-full rounded-[4px] border border-primary bg-primary px-[22px] font-code text-[13px] font-semibold tracking-[.08em] whitespace-nowrap text-primary-foreground uppercase disabled:opacity-70 sm:w-auto"
              >
                {loading ? 'Checking…' : 'Compare'}
              </button>
            </div>
          </form>
          {error && (
            <p id="ac-error" role="alert" className="mt-3 max-w-[640px] text-sm text-caution">
              {error}
            </p>
          )}
          <p id="ac-hint" className="mt-3 max-w-[62ch] text-[13px] text-muted-foreground">
            <button
              type="button"
              onClick={onAlone}
              disabled={loading}
              className="mr-1.5 border-0 bg-transparent p-0 text-body-soft underline decoration-line-strong underline-offset-[3px] hover:text-foreground"
            >
              Or check your site alone
            </button>
            <span aria-hidden="true">· </span>
            It reads each homepage once and looks up each site&apos;s authority score.
          </p>
        </div>
        <section
          aria-labelledby="ac-adds-up"
          className="grid gap-3 rounded-xl border border-line-strong bg-panel p-4 sm:max-w-[420px] lg:max-w-none"
        >
          <h2 id="ac-adds-up" className="m-0 font-heading text-[15px] font-bold">
            One score out of 100
          </h2>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {LETTERS.map((l) => (
              <li key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5">
                <Badge letter={l.badge} />
                <span className="min-w-0 text-sm leading-snug">
                  <b className="font-semibold">{l.label}</b>
                  <small className="block text-[13px] text-muted-foreground">{HERO_PLAIN[l.id]}</small>
                </span>
                <span className="font-heading text-sm font-bold tabular-nums">{l.points}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 flex justify-between border-t border-border pt-2.5 text-[13px] text-muted-foreground">
            <span>Total</span>
            <b className="font-heading text-sm text-foreground tabular-nums">100</b>
          </p>
        </section>
      </div>
    </section>
  )
}

/* ── The table: sites across the top, sorted by overall score ───────────── */

const sClass = (s: Standing | null) => (s ? `ac-s-${s}` : '')

function Badge({ letter, small = false }: { letter: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`ac-tint inline-grid flex-none place-items-center rounded-md border border-line-strong font-heading font-bold ${
        small ? 'h-5 w-5 text-[11px]' : 'h-6 w-6 text-[13px]'
      }`}
    >
      {letter}
    </span>
  )
}

function YouTag() {
  return (
    <b className="mr-1.5 inline-block rounded bg-foreground px-1.5 py-1 align-[1px] font-heading text-[11px] leading-none font-bold tracking-[.06em] text-background">
      YOU
    </b>
  )
}

type Shown = { id: ProofId; index: number } | null

/** ✓ (a button that shows the phrase we found), ✕ amber when a rival has it and you don't, ✕ grey, or – when unread. */
function CheckMark({
  r,
  site,
  index,
  id,
  shown,
  setShown,
}: {
  r: AuthorityResult
  site: SiteResult
  index: number
  id: ProofId
  shown: Shown
  setShown: (s: Shown) => void
}) {
  if (!site.proof)
    return (
      <span className="text-muted-foreground" role="img" aria-label="not read">
        –
      </span>
    )
  if (!site.proof.includes(id)) {
    const gap = index === 0 && isGap(r, id)
    return (
      <span className={gap ? 'ac-gap font-semibold' : 'ac-no'} role="img" aria-label={gap ? 'no, and a rival has it' : 'no'}>
        ✕
      </span>
    )
  }
  const open = shown?.id === id && shown.index === index
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={`yes: show what we found on ${site.domain}`}
      onClick={() => setShown(open ? null : { id, index })}
      className={`ac-yes inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold hover:bg-primary-deep ${
        open ? 'bg-primary-deep ring-1 ring-primary-line' : ''
      }`}
    >
      ✓
    </button>
  )
}

function Legend() {
  const items: [Standing, string][] = [
    ['ahead', 'Leads'],
    ['same', 'Tie'],
    ['behind', 'Behind'],
    ['low', 'Far behind'],
  ]
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Colours">
      {items.map(([s, label]) => (
        <li key={s} className={`ac-s-${s} ac-pill rounded-full px-2.5 py-1 text-[13px] font-semibold`}>
          {label}
        </li>
      ))}
    </ul>
  )
}

function CompareTable({ r, onAddRival, loading }: { r: AuthorityResult; onAddRival: (v: string) => void; loading: boolean }) {
  const order = ranked(r)
  const solo = r.rivals.length === 0
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState<Shown>(null)
  const src = authoritySource(r)
  const cols = order.length + 1
  const failed = r.rivals.filter((s) => s.pageError)

  const td = (o: Ranked, extra = '') =>
    `border-t border-border px-1.5 py-3.5 text-center align-middle sm:px-3 ${o.index === 0 ? 'ac-you' : ''} ${extra}`
  const rowHead = 'border-t border-border px-3 py-3.5 text-left align-middle font-medium sm:px-4'

  const overall = order.map((o) => o.scores?.overall ?? null)
  const auths = order.map((o) => (o.scores ? authorityOf(o.site, r) : null))
  const part = (l: Letter) => order.map((o) => (o.scores ? o.scores[l] : null))

  /** The 11 check rows, each with its "what we found" row on tap. Shared by the desktop table and the phone grid. */
  const checkRows = (compact = false) =>
    PROOF_CHECKS.map((c) => (
      <Fragment key={c.id}>
        <tr className="ac-tint">
          <th
            scope="row"
            className={`border-t border-border text-left font-normal text-body-soft ${
              compact ? 'px-2.5 py-1.5 text-[13px] leading-snug' : 'px-3 py-2.5 text-sm sm:px-4'
            }`}
          >
            <span className="flex items-center gap-2">
              <Badge letter={badgeOf(c.group)} small />
              <span className="min-w-0">{c.label}</span>
            </span>
          </th>
          {order.map((o) => (
            <td
              key={o.site.domain}
              className={`border-t border-border text-center ${compact ? 'px-0 py-1' : 'px-1.5 py-1.5'} ${o.index === 0 ? 'ac-you' : ''}`}
            >
              <CheckMark r={r} site={o.site} index={o.index} id={c.id} shown={shown} setShown={setShown} />
            </td>
          ))}
        </tr>
        {shown?.id === c.id && (
          <tr>
            <td colSpan={cols} className="px-3 pb-3 sm:px-4">
              <p className="m-0 flex items-start justify-between gap-3 rounded-md border border-primary-line bg-primary-deep px-3 py-2 text-[13px]">
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <b className="font-semibold text-foreground">{allSitesByIndex(r, shown.index).domain}:</b>{' '}
                  <span className="text-body-soft">
                    {allSitesByIndex(r, shown.index).evidence?.[c.id] ?? 'Found on the homepage.'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShown(null)}
                  aria-label="Close"
                  className="flex-none text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </p>
            </td>
          </tr>
        )}
      </Fragment>
    ))

  const letterRow = (l: (typeof LETTERS)[number]) => {
    const values = l.id === 'authority' ? auths : part(l.id)
    return (
      <tr key={l.id}>
        <th scope="row" className={rowHead}>
          <span className="flex items-center gap-2.5">
            <Badge letter={l.badge} />
            <span className="min-w-0">
              {l.label}
              <small className="block text-[13px] font-normal text-muted-foreground">
                {l.id === 'authority' ? (
                  src === 'ahrefs' ? (
                    <>
                      Domain Rating by{' '}
                      <a href="https://ahrefs.com/" target="_blank" rel="noopener" className="underline underline-offset-2">
                        Ahrefs
                      </a>
                    </>
                  ) : src === 'opr' ? (
                    'Open PageRank'
                  ) : (
                    l.hint
                  )
                ) : (
                  l.hint
                )}
              </small>
            </span>
          </span>
        </th>
        {order.map((o, i) => {
          if (!o.scores)
            return (
              <td key={o.site.domain} className={td(o, 'text-muted-foreground')}>
                –
              </td>
            )
          const pts = o.scores[l.id]
          const a = auths[i]
          const s =
            l.id === 'authority'
              ? src
                ? standing(a, values, TIE_GAP)
                : null
              : standing(pts, values)
          return (
            <td key={o.site.domain} className={td(o, sClass(s))}>
              <span className="ac-num font-heading text-[21px] leading-tight font-semibold">
                {pts}
                <small className="ml-0.5 font-sans text-[13px] font-normal text-muted-foreground">/ {l.points}</small>
              </span>
              <small className="block text-xs text-muted-foreground">
                {l.id === 'authority'
                  ? a === null
                    ? 'No score'
                    : `${src === 'ahrefs' ? 'DR' : 'OPR'} ${fmtAuthority(a)}`
                  : `${o.scores.found[l.id]} of ${checksIn(l.id).length}`}
              </small>
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <section aria-labelledby="ac-ct" className="grid min-w-0 gap-3.5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="ac-ct" className="m-0 font-heading text-[22px] font-bold">
          {solo ? 'Your score' : 'How you compare'}
        </h2>
        {!solo && <Legend />}
      </div>
      {src !== 'ahrefs' && (
        <p className="m-0 rounded-md border border-dashed border-caution-line px-3 py-2.5 text-sm text-caution">
          {src === 'opr'
            ? 'Ahrefs scores are busy right now, so Authority uses Open PageRank for this check.'
            : 'Authority scores are not available right now, so Authority counts 0 for every site. Try again in a minute.'}
        </p>
      )}
      {/* Phones: one card per site (sorted, yours highlighted), then the checks as a narrow grid. */}
      <div className="grid gap-2.5 sm:hidden">
        <ol className="m-0 grid list-none gap-2.5 p-0">
          {order.map((o) => {
            const s = o.scores
            const ov = solo ? null : standing(s?.overall ?? null, overall)
            return (
              <li
                key={o.site.domain}
                className={`rounded-xl border p-3.5 ${o.index === 0 ? 'ac-you border-foreground' : 'border-line-strong bg-panel'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    {!solo && <b className="flex-none font-heading text-[15px]">{o.place ? ordinal(o.place) : '–'}</b>}
                    <span className={`truncate text-sm ${o.index === 0 ? 'font-semibold' : 'text-body-soft'}`}>
                      {o.index === 0 && <YouTag />}
                      {o.site.domain}
                    </span>
                  </span>
                  <span className={`ac-num flex-none font-heading text-[26px] leading-none font-bold ${sClass(ov)}`}>
                    {s ? s.overall : '–'}
                    <small className="ml-0.5 font-sans text-xs font-normal text-muted-foreground">/ 100</small>
                  </span>
                </div>
                {s ? (
                  <>
                    <span className={`ac-bar mt-2.5 max-w-none! ${sClass(ov)}`} aria-hidden="true">
                      <i style={{ width: `${s.overall}%` }} />
                    </span>
                    <dl className="m-0 mt-3 grid grid-cols-4 gap-1.5">
                      {LETTERS.map((l) => {
                        const values = l.id === 'authority' ? auths : part(l.id)
                        const a = authorityOf(o.site, r)
                        const st = l.id === 'authority' ? (src ? standing(a, values, TIE_GAP) : null) : standing(s[l.id], values)
                        return (
                          <div key={l.id} className={`ac-tint grid gap-0.5 rounded-md px-1 py-2 text-center ${sClass(st)}`}>
                            <dt className="truncate text-[11px] font-semibold text-muted-foreground">{l.label}</dt>
                            <dd className="ac-num m-0 font-heading text-[17px] leading-tight font-bold">
                              {s[l.id]}
                              <small className="font-sans text-[11px] font-normal text-muted-foreground">/{l.points}</small>
                            </dd>
                            {l.id === 'authority' && a !== null && (
                              <dd className="m-0 text-[10px] text-muted-foreground">
                                {src === 'ahrefs' ? 'DR' : 'OPR'} {fmtAuthority(a)}
                              </dd>
                            )}
                          </div>
                        )
                      })}
                    </dl>
                  </>
                ) : (
                  <p className="m-0 mt-1.5 text-xs text-muted-foreground">We couldn&apos;t read this homepage.</p>
                )}
              </li>
            )
          })}
        </ol>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="ac-checks-m"
          onClick={() => setOpen(!open)}
          className="ac-noprint rounded-lg border border-line-strong px-3 py-3 text-sm font-medium text-body-soft hover:bg-muted hover:text-foreground"
        >
          {open ? 'Hide the checks ▴' : `Show all ${PROOF_CHECKS.length} checks ▾`}
        </button>
        {open && (
          <div id="ac-checks-m" className="overflow-hidden rounded-xl border border-line-strong bg-panel">
            <table className="w-full table-fixed border-collapse text-sm">
              <caption className="sr-only">The {PROOF_CHECKS.length} checks for each site</caption>
              <colgroup>
                <col />
                {order.map((o) => (
                  <col key={o.site.domain} className="w-11" />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="px-2.5 py-2 text-left text-xs font-normal text-muted-foreground">
                    Check
                  </th>
                  {order.map((o) => (
                    <th
                      key={o.site.domain}
                      scope="col"
                      title={o.site.domain}
                      className={`py-2 text-center font-heading text-[11px] font-bold ${o.index === 0 ? 'ac-you' : ''}`}
                    >
                      {o.index === 0 ? 'You' : o.place ? ordinal(o.place) : '–'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{checkRows(true)}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-line-strong bg-panel sm:block">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-[15px] tabular-nums">
          <caption className="sr-only">Overall score and E-E-A-T scores for each site, sorted 1st to last</caption>
          <colgroup>
            <col className="w-[30%] sm:w-[27%]" />
            {order.map((o) => (
              <col key={o.site.domain} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="px-3 pt-4 pb-3 text-left align-bottom text-[13px] font-normal text-muted-foreground sm:px-4">
                E-E-A-T, our score
              </th>
              {order.map((o) => (
                <th
                  key={o.site.domain}
                  scope="col"
                  className={`px-1.5 pt-4 pb-3 text-center align-bottom sm:px-3 ${o.index === 0 ? 'ac-you' : ''}`}
                >
                  {!solo && (
                    <span className="block font-heading text-[15px] font-bold">{o.place ? ordinal(o.place) : '–'}</span>
                  )}
                  <span
                    className={`mx-auto mt-1 block max-w-[18ch] truncate text-sm ${
                      o.index === 0 ? 'font-semibold text-foreground' : 'text-body-soft'
                    }`}
                    title={o.site.domain}
                  >
                    {o.index === 0 && <YouTag />}
                    {o.site.domain}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={rowHead}>
                Overall score
                <small className="block text-[13px] font-normal text-muted-foreground">out of 100</small>
              </th>
              {order.map((o) => {
                const v = o.scores?.overall ?? null
                const s = solo ? null : standing(v, overall)
                return (
                  <td key={o.site.domain} className={td(o, `py-4 ${sClass(s)}`)}>
                    {v === null ? (
                      <span className="text-muted-foreground">–</span>
                    ) : (
                      <span className="grid justify-items-center gap-1.5">
                        <span className="ac-num font-heading text-[30px] leading-none font-bold">{v}</span>
                        <span className="ac-bar" aria-hidden="true">
                          <i style={{ width: `${v}%` }} />
                        </span>
                        {solo && <small className="text-xs text-muted-foreground">{band(v)}</small>}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
            {LETTERS.map(letterRow)}
            <tr className="ac-noprint">
              <td colSpan={cols} className="border-t border-border p-0">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls="ac-checks"
                  onClick={() => setOpen(!open)}
                  className="w-full px-3 py-3 text-sm font-medium text-body-soft hover:bg-muted hover:text-foreground"
                >
                  {open ? 'Hide the checks ▴' : `Show all ${PROOF_CHECKS.length} checks ▾`}
                </button>
              </td>
            </tr>
          </tbody>
          <tbody id="ac-checks" data-ac-checks hidden={!open}>
            {checkRows()}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <p className="m-0 max-w-[64ch] text-[13px] text-muted-foreground">
          {solo ? '' : 'An amber ✕ means a rival has it and you don’t. '}Tap a ✓ to see what we found.
          {src === 'ahrefs' && (
            <>
              {' '}
              Authority: Domain Rating by{' '}
              <a href="https://ahrefs.com/" target="_blank" rel="noopener" className="underline underline-offset-2">
                Ahrefs
              </a>
              .
            </>
          )}
        </p>
        {!solo && <RivalControl r={r} onAddRival={onAddRival} loading={loading} />}
      </div>
      {failed.length > 0 && (
        <ul className="m-0 list-none p-0 text-[13px] text-caution">
          {failed.map((s) => (
            <li key={s.domain}>{s.pageError} Its scores show as “–”.</li>
          ))}
        </ul>
      )}
    </section>
  )
}

function allSitesByIndex(r: AuthorityResult, i: number): SiteResult {
  return i === 0 ? r.you : r.rivals[i - 1]
}

/** Under the table: add a rival (fewer than 3), or change rivals in the form above. */
function RivalControl({ r, onAddRival, loading }: { r: AuthorityResult; onAddRival: (v: string) => void; loading: boolean }) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const btn =
    'rounded-lg border border-dashed border-muted-foreground px-3 py-2 text-sm font-medium text-body-soft hover:border-foreground hover:text-foreground'
  if (r.rivals.length >= MAX_RIVALS)
    return (
      <button type="button" onClick={focusRival} className={`ac-noprint ${btn}`}>
        Change rivals
      </button>
    )
  if (!adding)
    return (
      <button type="button" onClick={() => setAdding(true)} className={`ac-noprint ${btn}`}>
        + Add a rival
      </button>
    )
  return (
    <form
      noValidate
      className="ac-noprint flex flex-wrap items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) onAddRival(value)
      }}
    >
      <label htmlFor="ac-add-rival" className="text-[13px] text-muted-foreground">
        Rival&apos;s site
      </label>
      <input
        id="ac-add-rival"
        autoFocus
        type="text"
        inputMode="url"
        spellCheck={false}
        autoCapitalize="none"
        placeholder="rival.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 w-44 min-w-0 rounded-md border border-line-strong bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="h-10 rounded-md bg-primary px-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-70"
      >
        Compare
      </button>
    </form>
  )
}

/* ── First moves ────────────────────────────────────────────────────────── */

function Moves({ r }: { r: AuthorityResult }) {
  const moves = firstMoves(r)
  const title = moves.length === 3 ? 'Your first 3 moves' : moves.length === 1 ? 'Your first move' : 'Your first moves'
  return (
    <section aria-labelledby="ac-fm" className="grid gap-3.5">
      <h2 id="ac-fm" className="m-0 font-heading text-[22px] font-bold">
        {title}
      </h2>
      {moves.length === 0 ? (
        <div className="rounded-lg border border-line-strong bg-panel p-[18px]">
          <p className="m-0 font-heading text-[17px] font-bold">Your site shows every check we read.</p>
          <p className="m-0 mt-2 text-[15px] text-body-soft">
            For the full list,{' '}
            <a href="/audit" className="text-primary underline underline-offset-[3px]">
              run the Findability Check
            </a>
            .
          </p>
        </div>
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
          {moves.map((m, i) => (
            <li key={m.id} className="grid content-start gap-1.5 rounded-lg border border-line-strong bg-panel p-[18px]">
              <span className="font-heading text-[13px] font-semibold text-caution">{i + 1}</span>
              <b className="font-heading text-[17px]">{m.title}</b>
              <span className="text-[15px] text-body-soft">{m.body}</span>
              {m.who && <small className="text-[13px] text-muted-foreground">{m.who}</small>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/* ── Offer ──────────────────────────────────────────────────────────────── */

function Offer({ theme }: { theme: Theme }) {
  return (
    <aside
      aria-labelledby="ac-offer"
      className="grid items-center gap-x-10 gap-y-5 rounded-xl border border-primary-line bg-primary-deep p-6 md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <h2 id="ac-offer" className="m-0 mb-1.5 font-heading text-[22px] font-bold">
          Read your results with me.
        </h2>
        <p className="m-0 max-w-[60ch] text-body-soft">15 minutes, free. We pick the one move that matters most.</p>
      </div>
      <button
        type="button"
        data-cal-link="chris-hornak/authority"
        data-cal-namespace="authority-check"
        data-cal-config={JSON.stringify({ layout: 'month_view', useSlotsViewOnSmallScreen: 'true', theme })}
        className="ac-noprint justify-self-start rounded-full bg-primary px-[22px] py-[13px] font-heading font-semibold whitespace-nowrap text-primary-foreground"
      >
        Book 15 minutes
      </button>
    </aside>
  )
}

/* ── How to grow each score ─────────────────────────────────────────────── */

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const GROW: { id: Letter; text: string; icon: React.ReactNode }[] = [
  {
    id: 'experience',
    text: 'Show real jobs on a projects page, and say how long you have done this work.',
    icon: (
      <svg viewBox="0 0 24 24" {...ICON}>
        <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    ),
  },
  {
    id: 'expertise',
    text: 'Name the people behind the business, and list licenses and awards.',
    icon: (
      <svg viewBox="0 0 24 24" {...ICON}>
        <circle cx="12" cy="9" r="5" />
        <path d="M9 13.5 8 21l4-2 4 2-1-7.5" />
      </svg>
    ),
  },
  {
    id: 'authority',
    text: 'Get local news, partners and associations to link to you. It takes months.',
    icon: (
      <svg viewBox="0 0 24 24" {...ICON}>
        <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
      </svg>
    ),
  },
  {
    id: 'trust',
    text: 'Fix the homepage gaps, and show proof of your reviews. Most take an afternoon.',
    icon: (
      <svg viewBox="0 0 24 24" {...ICON}>
        <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
]

function Grow() {
  return (
    <section aria-labelledby="ac-grow" className="grid gap-[18px]">
      <h2 id="ac-grow" className="m-0 font-heading text-[22px] font-bold">
        How to grow each score
      </h2>
      <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {GROW.map((g) => {
          const l = LETTERS.find((x) => x.id === g.id)!
          return (
            <li key={g.id} className="grid content-start gap-2">
              <span
                className="ac-tint grid h-10 w-10 place-items-center rounded-[10px] border border-line-strong text-primary [&>svg]:h-[22px] [&>svg]:w-[22px]"
                aria-hidden="true"
              >
                {g.icon}
              </span>
              <h3 className="m-0 font-heading text-[17px] font-bold">
                {l.label} <span className="ml-1 font-sans text-[13px] font-medium text-muted-foreground">{l.points}</span>
              </h3>
              <p className="m-0 text-[15px] text-body-soft">{g.text}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ── How we score (end of the page). Wording kept legal-safe: our own
 * score, Google quoted, never "Google's score" (backlog.md, 2026-10-01). ─── */

const GOOGLE_HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'

function HowWeScore({ asOf, src }: { asOf: string | null; src: ReturnType<typeof authoritySource> }) {
  return (
    <section aria-labelledby="ac-hs" className="grid gap-3.5 border-t border-border pt-10">
      <h2 id="ac-hs" className="m-0 font-heading text-[22px] font-bold">
        Based on Google&apos;s public guidance
      </h2>
      <p className="m-0 max-w-[70ch] text-body-soft">
        Google calls it E-E-A-T: &ldquo;experience, expertise, authoritativeness, and trustworthiness.&rdquo; Google also
        says &ldquo;E-E-A-T itself isn&apos;t a specific ranking factor.&rdquo; So this is our own score, built from the
        parts a website can show. Trust counts double, because Google says:
      </p>
      <blockquote className="m-0 max-w-[70ch] border-l-[3px] border-line-strong pl-3.5 text-body-soft">
        &ldquo;Of these aspects, trust is most important. The others contribute to trust.&rdquo;
      </blockquote>
      <div className="grid gap-1.5 text-[13px] text-muted-foreground">
        <p className="m-0">
          Quotes: Google Search Central,{' '}
          <a href={GOOGLE_HELPFUL} target="_blank" rel="noopener" className="underline underline-offset-2">
            Creating helpful, reliable, people-first content
          </a>
          . Not made, checked or endorsed by Google. Google does not give sites an E-E-A-T score.
        </p>
        <p className="m-0">
          Experience 20, Expertise 20, Authority 20, Trust 40. Experience: your work shown is 10 points; a track
          record is 6, or 10 when it is strong (5+ testimonials, 50+ reviews, 20+ years, or two signs together). Authority points
          grow fastest at the start: Domain Rating 9 gets 7, 30 gets 13, {AUTHORITY_FULL} or more gets all 20. 70 and
          up overall is strong, 40 to 69 is fair, under 40 needs work. Authority scores less than {TIE_GAP} points
          apart count as a tie.
        </p>
        <p className="m-0">
          We read each homepage once. Expertise and most Trust checks use the same rules as{' '}
          <a href="/audit" className="text-primary underline underline-offset-[3px]">
            the Findability Check
          </a>
          . Track record means 5 or more years in practice, a count of 20 or more clients or jobs, 20 or more reviews, or 3 or more testimonials on your homepage.
        </p>
        <p className="m-0">
          Authority:{' '}
          {src === 'opr' ? (
            <>Open PageRank (Ahrefs was busy), built from Common Crawl&apos;s map of the web{asOf && `, as of ${asOf}`}.</>
          ) : (
            <>
              Domain Rating by{' '}
              <a href="https://ahrefs.com/" target="_blank" rel="noopener" className="underline underline-offset-2">
                Ahrefs
              </a>
              . When Ahrefs is busy, we use Open PageRank instead.
            </>
          )}
        </p>
      </div>
    </section>
  )
}

/* ── Report header: the answer, then Copy link / Print / theme ─────────── */

function ReportHead({
  r,
  example,
  theme,
  setTheme,
}: {
  r: AuthorityResult
  example: boolean
  theme: Theme
  setTheme: (t: Theme) => void
}) {
  const n = r.rivals.length
  const [note, setNote] = useState('')
  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-panel px-3 py-[7px] text-sm font-medium text-foreground hover:border-muted-foreground [&>svg]:h-4 [&>svg]:w-4'
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-muted-foreground">
          {example ? 'Example · ' : ''}
          <b className="font-medium text-body-soft">{r.you.domain}</b>{' '}
          {n === 0 ? 'alone' : `vs ${n} rival${n > 1 ? 's' : ''}`} · {fmtDate(r.checkedAt)}
        </p>
        <div className="ac-noprint inline-flex gap-0.5 rounded-full border border-line-strong p-[3px]" role="group" aria-label="Theme">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
              className={`rounded-full px-3 py-1 text-[13px] font-medium capitalize ${
                theme === t ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <h2 id="ac-result" className="m-0 max-w-[36ch] font-heading text-[clamp(24px,3.4vw,32px)] leading-tight font-bold text-balance">
        {summary(r)}
      </h2>
      <div className="ac-noprint flex flex-wrap items-center gap-2">
        {!example && (
          <button
            type="button"
            className={btn}
            onClick={() => {
              navigator.clipboard
                .writeText(window.location.href)
                .then(() => setNote('Link copied.'))
                .catch(() => setNote(window.location.href))
            }}
          >
            <svg viewBox="0 0 24 24" {...ICON} aria-hidden="true">
              <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
              <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
            </svg>
            Copy link
          </button>
        )}
        <button type="button" className={btn} onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" {...ICON} aria-hidden="true">
            <path d="M6 9V3h12v6" />
            <rect x="3" y="9" width="18" height="8" rx="2" />
            <path d="M6 14h12v7H6z" />
          </svg>
          Print or save PDF
        </button>
        <span className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]" aria-live="polite">
          {note}
        </span>
      </div>
    </div>
  )
}

/* ── Root ───────────────────────────────────────────────────────────────── */

export function AuthorityCheck({ example }: { example: AuthorityResult }) {
  const [you, setYou] = useState('')
  const [rivals, setRivals] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AuthorityResult | null>(null)
  const [pending, setPending] = useState(0)
  const [theme, setThemeState] = useState<Theme>('light')
  const resultRef = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'dark' || saved === 'light') setThemeState(saved)
    } catch {}
  }, [])
  // The theme wrapper is the page's (#ac-page in authority-check/page.tsx), so the menu and footer follow it.
  useEffect(() => {
    const page = document.getElementById('ac-page')
    if (page) page.dataset.acTheme = theme
  }, [theme])
  const setTheme = (t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch {}
  }

  async function run(youRaw: string, rivalRaws: string[]) {
    const me = parseSite(youRaw)
    if (!me) {
      setError(
        youRaw.trim() ? 'That doesn’t look like a web address. Try yoursite.com.' : 'Type your site first, like yoursite.com.',
      )
      return
    }
    const typed = rivalRaws.map((s) => s.trim()).filter(Boolean).slice(0, MAX_RIVALS)
    const others = []
    for (const raw of typed) {
      const p = parseSite(raw)
      if (!p) {
        setError(`“${raw}” doesn’t look like a web address. Try rivalsite.com.`)
        return
      }
      others.push(p)
    }
    const bares = [me.bare, ...others.map((o) => o.bare)]
    if (new Set(bares).size !== bares.length) {
      setError('Each site needs to be different.')
      return
    }

    setError(null)
    setLoading(true)
    setPending(bares.length)
    const query = shareQuery(
      me.host,
      others.map((o) => o.host),
    )
    try {
      const res = await fetch(`/api/authority-check?${query}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data.error) {
        setError(data?.error ?? 'Something went wrong. Try again in a minute.')
        return
      }
      setResult(data as AuthorityResult)
      window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
      requestAnimationFrame(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      })
    } catch {
      setError('We could not reach the checker. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-run from ?site=&r= (never useSearchParams: it bails the page out of SSR).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const site = q.get('site')
    if (!site) return
    const rs = (q.get('r') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_RIVALS)
    setYou(site)
    setRivals(rs.length ? rs : [''])
    run(site, rs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = result ?? example
  const addRival = (rival: string) => {
    const next = [...rivals.map((s) => s.trim()).filter(Boolean), rival].slice(0, MAX_RIVALS)
    setRivals(next)
    run(you || shown.you.domain, next)
  }

  return (
    <div>
      <Hero
        you={you}
        setYou={setYou}
        rivals={rivals}
        setRivals={setRivals}
        onCompare={() => run(you, rivals)}
        onAlone={() => run(you, [])}
        loading={loading}
        error={error}
      />
      <section aria-labelledby="ac-result" className="scroll-mt-28" ref={resultRef}>
        <div className="ac-print-tight mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-10 pb-[72px] sm:px-6">
          <p className="sr-only" aria-live="polite">
            {loading
              ? `Checking ${pending} site${pending > 1 ? 's' : ''}.`
              : result
                ? `Check done for ${result.you.domain}.`
                : ''}
          </p>
          <div className={`grid grid-cols-[minmax(0,1fr)] gap-10 ${loading ? 'opacity-50 transition-opacity' : ''}`}>
            <ReportHead r={shown} example={!result} theme={theme} setTheme={setTheme} />
            <CompareTable r={shown} onAddRival={addRival} loading={loading} />
            {result && result.rivals.length === 0 && <SoloAddRival onAddRival={addRival} loading={loading} />}
            <Moves r={shown} />
          </div>
          <Offer theme={theme} />
          <Grow />
          <div className="ac-noprint">
            <ToolQuestions current="/authority-check" />
          </div>
          <HowWeScore asOf={shown.asOf} src={authoritySource(shown)} />
        </div>
      </section>
    </div>
  )
}

/* ── Solo: now add a rival ──────────────────────────────────────────────── */

function SoloAddRival({ onAddRival, loading }: { onAddRival: (v: string) => void; loading: boolean }) {
  const [value, setValue] = useState('')
  return (
    <aside
      aria-labelledby="ac-solo"
      className="ac-noprint grid items-center gap-x-10 gap-y-4 rounded-xl border border-dashed border-line-strong px-6 py-5 md:grid-cols-2"
    >
      <div>
        <h2 id="ac-solo" className="m-0 mb-1 font-heading text-[20px] font-bold">
          Now add a rival.
        </h2>
        <p className="m-0 text-body-soft">Your score means more next to someone you compete with. One rival is enough.</p>
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onAddRival(value)
        }}
        className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label htmlFor="ac-solo-rival" className="sr-only">
          A rival&apos;s site
        </label>
        <input
          id="ac-solo-rival"
          type="text"
          inputMode="url"
          spellCheck={false}
          autoCapitalize="none"
          placeholder="a rival's site"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-[46px] min-w-0 rounded-[4px] border border-line-strong bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-[46px] rounded-[4px] border border-primary bg-primary px-[22px] font-code text-[13px] font-semibold tracking-[.08em] whitespace-nowrap text-primary-foreground uppercase disabled:opacity-70"
        >
          Compare
        </button>
      </form>
    </aside>
  )
}
