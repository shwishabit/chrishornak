'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { OWN_CHOICES, TRUST_WEIGHT, WHY } from '@/lib/authority-check-evidence'
import {
  FRESH_DAYS,
  LETTERS,
  LINK_BANDS,
  LINK_POINTS,
  MAX_RIVALS,
  OVERALL_TIE,
  PROOF_CHECKS,
  SHOWN_CHECKS,
  TIE_GAP,
  authorityFrom,
  authorityPoints,
  authorityOf,
  authoritySource,
  oprStandIns,
  GRADED,
  band,
  beatsYou,
  checksIn,
  firstMoves,
  nextMoves,
  fmtAuthority,
  isGap,
  level,
  ordinal,
  parseSite,
  pointsFor,
  ranked,
  scoresOf,
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
import { AUTHORITY_FAQ, FAQ_LEAD } from '@/lib/authority-check-faq'
import { ToolQuestions } from './ToolQuestions'
import { toolEnding } from '@/lib/data'
import { useTheme } from '@/components/ui/ThemeToggle'
import '@/styles/authority-check.css'

/* ── Authority Check ────────────────────────────────────────────────────────
 * Hero: two equal tabs, "Check my site" (open first) and "Compare with
 * rivals" (up to 3). Before a check: a small preview of each. A check of one
 * site: the answer in a sentence, then its report card (score, 4 parts, what
 * it does well, what's missing, first 3 fixes with points, link strength),
 * then "Now add a rival" (checks only the new site). A comparison: one table
 * (sites sorted 1st → 4th, the 12 checks open below, the phrase behind each
 * ✓), then a report card for any site you click (a rival's shows where it
 * beats you). Then the 15-minute offer, "How to grow each score", the three
 * questions and how we score.
 * Follows the sitewide light / dark theme; prints clean; the URL is the share link.
 * Mocks: drafts/authority-check-results-v4-comp.html (table, 2026-10-01),
 * drafts/authority-check-report-card-comp.html (tabs + report cards, 2026-10-05).
 * ─────────────────────────────────────────────────────────────────────── */

type Mode = 'solo' | 'compare'

const MODES: { id: Mode; label: string; sub: string }[] = [
  { id: 'solo', label: 'Check my site', sub: 'One score, what’s missing, your first 3 fixes' },
  { id: 'compare', label: 'Compare with rivals', sub: `You next to up to ${MAX_RIVALS} rivals, ranked` },
]

const RIVAL_INPUT_ID = 'ac-r1'
/** The scored checks + the Domain Rating row. */
const CHECK_COUNT = PROOF_CHECKS.length + 1

/**
 * How much one check reads, shown under the hero form (Chris, 2026-10-05: show how thorough
 * it is). Counts come from the rules. Pages: the homepage, About, contact and reviews pages,
 * robots.txt, up to 4 sitemap files, the blog feed, the newest page and a team page
 * (authority-read.ts, freshness.ts). Sources: Ahrefs, Open PageRank, RDAP, Wikidata.
 */
const MAX_PAGES = 14
const SOURCES = ['Ahrefs', 'Open PageRank', 'RDAP', 'Wikidata']
const THOROUGH: { n: number; label: string }[] = [
  { n: CHECK_COUNT + SHOWN_CHECKS.length, label: `things checked: ${PROOF_CHECKS.length} scored checks, link strength and ${SHOWN_CHECKS.length} notes` },
  { n: MAX_PAGES, label: 'pages read per site, at most' },
  { n: SOURCES.length, label: `outside data sources (${SOURCES.join(', ')})` },
]

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
  experience: 'Real work shown, years in business, client counts',
  expertise: 'The people behind it, credentials, a page per offer',
  authority: 'Link strength, review sites, where you’re featured',
  trust: 'Reviews on your site, how to reach you, About page, recent updates',
}

const FIELD =
  'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[4px] border bg-background pl-3'
const FIELD_LABEL = 'font-code text-[11px] font-medium tracking-[.08em] whitespace-nowrap uppercase'
const INPUT =
  'h-11 w-full min-w-0 bg-transparent pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none'

function Hero({
  mode,
  setMode,
  you,
  setYou,
  rivals,
  setRivals,
  onCheck,
  onCompare,
  loading,
  error,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  you: string
  setYou: (v: string) => void
  rivals: string[]
  setRivals: (v: string[]) => void
  onCheck: () => void
  onCompare: () => void
  loading: boolean
  error: string | null
}) {
  const extraRefs = useRef<(HTMLInputElement | null)[]>([])
  const addRef = useRef<HTMLButtonElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [focusNew, setFocusNew] = useState(false)

  useEffect(() => {
    if (!focusNew) return
    extraRefs.current[rivals.length - 1]?.focus()
    setFocusNew(false)
  }, [focusNew, rivals.length])

  const setRival = (i: number, v: string) => setRivals(rivals.map((r, j) => (j === i ? v : r)))

  const yourSite = (
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
  )
  const FORM =
    'grid max-w-[640px] gap-1.5 rounded-md border border-field-edge bg-field p-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(45,212,168,.18)]'
  const SUBMIT =
    'h-[46px] w-full rounded-[4px] border border-primary bg-primary px-[22px] font-code text-[13px] font-semibold tracking-[.08em] whitespace-nowrap text-primary-foreground uppercase disabled:opacity-70 sm:w-auto'

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
            className="mb-5 max-w-[18ch] font-heading text-[clamp(34px,5vw,60px)] leading-[1.05] font-bold tracking-[-.025em] text-balance"
          >
            How strong is your website?{' '}
            <span className="font-semibold text-muted-foreground">Check it alone, or next to your rivals.</span>
          </h1>
          <p className="mb-7 max-w-[56ch] text-base text-body-soft sm:text-lg">
            One score out of 100 from {PROOF_CHECKS.length} checks plus your link strength, what&apos;s missing, and your first 3 fixes. Add up to {MAX_RIVALS}{' '}
            rivals to see who leads.
          </p>
          {/* Two equal tabs: the same "Your site" box, with or without rivals. */}
          <div role="tablist" aria-label="What to check" className="mb-3 grid max-w-[640px] gap-2 sm:grid-cols-2">
            {MODES.map((m, i) => {
              const on = mode === m.id
              return (
                <button
                  key={m.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`ac-tab-${m.id}`}
                  aria-selected={on}
                  aria-controls="ac-form"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setMode(m.id)}
                  onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                    e.preventDefault()
                    const next = MODES[(i + 1) % MODES.length]
                    setMode(next.id)
                    tabRefs.current[MODES.indexOf(next)]?.focus()
                  }}
                  className={`grid gap-0.5 rounded-lg border-[1.5px] px-4 py-3 text-left transition-colors duration-150 ${
                    on ? 'border-primary bg-primary-deep' : 'border-line-strong bg-panel hover:border-muted-foreground'
                  }`}
                >
                  <b className="flex items-center gap-2 font-heading text-[16px] font-semibold">
                    <span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${on ? 'bg-primary' : 'bg-line-strong'}`} />
                    {m.label}
                  </b>
                  <small className="text-sm text-muted-foreground">{m.sub}</small>
                </button>
              )
            })}
          </div>
          {mode === 'solo' ? (
            <form
              id="ac-form"
              role="tabpanel"
              aria-labelledby="ac-tab-solo"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                onCheck()
              }}
              className={FORM}
            >
              <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                {yourSite}
                <button type="submit" disabled={loading} className={SUBMIT}>
                  {loading ? 'Checking…' : 'Check my site'}
                </button>
              </div>
            </form>
          ) : (
          <form
            id="ac-form"
            role="tabpanel"
            aria-labelledby="ac-tab-compare"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              onCompare()
            }}
            className={FORM}
          >
            <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              {yourSite}
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
              <button type="submit" disabled={loading} className={SUBMIT}>
                {loading ? 'Checking…' : 'Compare'}
              </button>
            </div>
          </form>
          )}
          {error && (
            <p id="ac-error" role="alert" className="mt-3 max-w-[640px] text-sm text-caution">
              {error}
            </p>
          )}
          <ul id="ac-hint" aria-label="What one check reads" className="m-0 mt-4 grid max-w-[640px] list-none gap-x-6 gap-y-3 p-0 sm:grid-cols-3">
            {THOROUGH.map((t) => (
              <li key={t.label} className="grid content-start gap-0.5 border-l-2 border-primary-line pl-3">
                <b className="font-heading text-[22px] leading-none font-bold tabular-nums">{t.n}</b>
                <span className="text-[13px] leading-snug text-muted-foreground">{t.label}</span>
              </li>
            ))}
          </ul>
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
                <Badge id={l.id} size="hero" />
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

/** Each part's icon (the same ones as "How to grow each score"), in place of E-E-A-T letters. */
const BADGE_SIZE = {
  sm: 'h-5 w-5 text-muted-foreground [&>svg]:h-3.5 [&>svg]:w-3.5',
  /** The report card's four part tiles: about 15% bigger than sm (Chris, 2026-10-06, after trying 50% and 25%). */
  card: 'h-[23px] w-[23px] text-foreground [&>svg]:h-[16px] [&>svg]:w-[16px]',
  md: 'h-6 w-6 text-foreground [&>svg]:h-4 [&>svg]:w-4',
  /** The hero's "One score out of 100" list: about 15% bigger than md (2026-10-06). */
  hero: 'h-[28px] w-[28px] text-foreground [&>svg]:h-[18px] [&>svg]:w-[18px]',
  /** The score rows: 50% bigger than md. */
  lg: 'h-9 w-9 text-foreground [&>svg]:h-6 [&>svg]:w-6',
}

function Badge({ id, size = 'md' }: { id: Letter; size?: keyof typeof BADGE_SIZE }) {
  return (
    <span
      aria-hidden="true"
      className={`ac-tint inline-grid flex-none place-items-center rounded-md border border-line-strong ${BADGE_SIZE[size]}`}
    >
      {LETTER_ICON[id]}
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

/**
 * The overall score, counting up with its bar (900 ms). Shows the number at once when the
 * viewer prefers reduced motion, and on the server, so nothing is missing before it runs.
 */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(value)
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(value)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900)
      setN(Math.round(value * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    setN(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{n}</>
}

/** The colour a standing stands for, for the "you" column's tint. */
const STANDING_VAR: Record<Standing, string> = {
  ahead: 'var(--ac-ahead)',
  same: 'var(--ac-same)',
  behind: 'var(--ac-behind)',
  low: 'var(--ac-low)',
}

/** ✓ (a button that shows the phrase we found), ✕ amber when a rival has it and you don't, ✕ grey, or – when unread. */
function CheckMark({
  r,
  site,
  index,
  id,
  shown,
  setShown,
  neutral = false,
}: {
  r: AuthorityResult
  site: SiteResult
  index: number
  id: ProofId
  shown: Shown
  setShown: (s: Shown) => void
  /** A "good to know" row: never scored, so a missing one isn't a gap. */
  neutral?: boolean
}) {
  if (!site.proof)
    return (
      <span className="text-muted-foreground" role="img" aria-label="not read">
        –
      </span>
    )
  if (!site.proof.includes(id)) {
    const gap = !neutral && index === 0 && isGap(r, id)
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
      className={`ac-yes ac-tap inline-flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        open ? 'bg-primary-deep ring-1 ring-primary-line' : ''
      }`}
    >
      ✓
    </button>
  )
}

function Legend({ solo }: { solo: boolean }) {
  const items: [Standing, string][] = solo
    ? [
        ['ahead', 'Strong'],
        ['behind', 'Fair'],
        ['low', 'Needs work'],
      ]
    : [
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

function CompareTable({
  r,
  onAddRival,
  loading,
  openDomain,
  onOpen,
}: {
  r: AuthorityResult
  onAddRival: (v: string) => void
  loading: boolean
  /** The site whose report card is open under the table. */
  openDomain?: string
  /** Click a site's name: open its report card. */
  onOpen?: (domain: string) => void
}) {
  const order = ranked(r)
  const solo = r.rivals.length === 0
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState<Shown>(null)
  const src = authoritySource(r)
  const standIns = oprStandIns(r)
  const cols = order.length + 1
  const failed = [r.you, ...r.rivals].filter((s) => s.pageError)

  const td = (o: Ranked, extra = '') =>
    `border-t border-border px-1.5 py-3.5 text-center align-middle sm:px-3 ${o.index === 0 ? 'ac-you' : ''} ${extra}`
  const rowHead = 'border-t border-border px-3 py-3.5 text-left align-middle font-medium sm:px-4'

  const overall = order.map((o) => o.scores?.overall ?? null)
  // Link strength shows even when a homepage couldn't be read (a 403 site still has a Domain Rating).
  const auths = order.map((o) => authorityOf(o.site, r))
  const part = (l: Letter) => order.map((o) => (o.scores ? o.scores[l] : null))
  /** Alone (or every rival's homepage unread): colour by the score's own level. With rivals: against the row. */
  const alone = order.filter((o) => o.scores).length < 2
  const tone = (pts: number | null, max: number, value: number | null, values: (number | null)[], tie = 0) =>
    alone ? level(pts, max) : standing(value, values, tie)
  const letterTone = (l: (typeof LETTERS)[number], o: Ranked, values: (number | null)[]) => {
    if (!o.scores) return null
    return tone(o.scores[l.id], l.points, o.scores[l.id], values)
  }

  /** The Domain Rating row's colour: DR against the others' DR (ties within TIE_GAP), or its band alone. */
  const drTone = (o: Ranked, a: number | null) =>
    a === null || !src ? null : alone ? level(authorityPoints(a), LINK_POINTS) : standing(a, auths, TIE_GAP)
  /** Authority's row in the checks: the Domain Rating itself, a number rather than a ✓. */
  const drRow = (compact: boolean) => (
    <tr className="ac-tint">
      <th
        scope="row"
        className={`border-t border-border text-left font-normal text-body-soft ${
          compact ? 'px-2.5 py-1.5 text-[13px] leading-snug' : 'px-3 py-2.5 text-sm sm:px-4'
        }`}
      >
        <span className="flex items-center gap-2">
          <Badge id="authority" size="sm" />
          <span className="min-w-0">{src === 'opr' ? 'Link strength (Open PageRank)' : 'Link strength (Domain Rating)'}</span>
        </span>
      </th>
      {order.map((o, i) => (
        <td
          key={o.site.domain}
          className={`border-t border-border text-center ${compact ? 'px-0 py-1' : 'px-1.5 py-1.5'} ${o.index === 0 ? 'ac-you' : ''}`}
        >
          {auths[i] === null ? (
            <span className="text-muted-foreground" role="img" aria-label="no score">
              –
            </span>
          ) : (
            <span className={`ac-num font-heading font-semibold ${compact ? 'text-[13px]' : 'text-[15px]'} ${sClass(drTone(o, auths[i]))}`}>
              {fmtAuthority(auths[i]!)}
              {src === 'ahrefs' && authorityFrom(o.site, r) === 'opr' && (
                <small className="ml-0.5 font-sans text-[10px] font-normal text-muted-foreground">OPR</small>
              )}
            </span>
          )}
        </td>
      ))}
    </tr>
  )
  const firstAuthority = PROOF_CHECKS.findIndex((c) => c.group === 'authority')
  const ROWS = [...PROOF_CHECKS, ...SHOWN_CHECKS]

  /** The check rows (11 from the homepage + Domain Rating), each ✓ opening a "what we found" row. Shared by the desktop table and the phone grid. */
  const checkRows = (compact = false) =>
    ROWS.map((c, i) => (
      <Fragment key={c.id}>
        {i === firstAuthority && drRow(compact)}
        {i === PROOF_CHECKS.length && (
          <tr>
            <th
              scope="rowgroup"
              colSpan={cols}
              className={`border-t border-line-strong text-left font-heading font-bold tracking-[.06em] text-muted-foreground uppercase ${
                compact ? 'px-2.5 pt-3 pb-1 text-[11px]' : 'px-3 pt-4 pb-1.5 text-xs sm:px-4'
              }`}
            >
              Good to know · not scored
            </th>
          </tr>
        )}
        <tr className="ac-tint ac-row">
          <th
            scope="row"
            className={`border-t border-border text-left font-normal text-body-soft ${
              compact ? 'px-2.5 py-1.5 text-[13px] leading-snug' : 'px-3 py-2.5 text-sm sm:px-4'
            }`}
          >
            <span className="flex items-center gap-2">
              {'group' in c ? <Badge id={c.group} size="sm" /> : <span aria-hidden="true" className="w-5 flex-none" />}
              <span className="min-w-0">
                {c.label}
                {'note' in c && !compact && <small className="block text-xs text-muted-foreground">{c.note}</small>}
              </span>
            </span>
          </th>
          {order.map((o) => (
            <td
              key={o.site.domain}
              className={`border-t border-border text-center ${compact ? 'px-0 py-1' : 'px-1.5 py-1.5'} ${o.index === 0 ? 'ac-you' : ''}`}
            >
              <CheckMark
                r={r}
                site={o.site}
                index={o.index}
                id={c.id}
                shown={shown}
                setShown={setShown}
                neutral={!('group' in c)}
              />
            </td>
          ))}
        </tr>
        {shown?.id === c.id && (
          <tr>
            <td colSpan={cols} className="px-3 pb-3 sm:px-4">
              <p className="ac-reveal m-0 flex items-start justify-between gap-3 rounded-md border border-primary-line bg-primary-deep px-3 py-2 text-[13px]">
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
    const values = part(l.id)
    return (
      <tr key={l.id}>
        <th scope="row" className={rowHead}>
          <span className="flex items-center gap-2.5">
            <Badge id={l.id} size="lg" />
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
          const a = auths[i]
          if (!o.scores)
            return (
              <td key={o.site.domain} className={td(o, 'text-muted-foreground')}>
                –
                {l.id === 'authority' && a !== null && (
                  <small className="block text-xs">
                    {authorityFrom(o.site, r) === 'ahrefs' ? 'DR' : 'OPR'} {fmtAuthority(a)}
                  </small>
                )}
              </td>
            )
          const pts = o.scores[l.id]
          const s = letterTone(l, o, values)
          return (
            <td key={o.site.domain} className={td(o, sClass(s))}>
              <span className="ac-num font-heading text-[21px] leading-tight font-semibold">
                {pts}
                <small className="ml-0.5 font-sans text-[13px] font-normal text-muted-foreground">/ {l.points}</small>
              </span>
              <small className="block text-xs text-muted-foreground">
                {l.id === 'authority' && a !== null
                  ? `${authorityFrom(o.site, r) === 'ahrefs' ? 'DR' : 'OPR'} ${fmtAuthority(a)} · ${o.scores.found[l.id]} of ${checksIn(l.id).length}`
                  : `${o.scores.found[l.id]} of ${checksIn(l.id).length}`}
              </small>
            </td>
          )
        })}
      </tr>
    )
  }

  // The "you" column is tinted with your own standing: green when you lead, amber behind, red far behind.
  const mine = order.find((o) => o.index === 0)?.scores?.overall ?? null
  const myTone = tone(mine, 100, mine, overall, OVERALL_TIE - 1)
  const youStyle = { '--you': myTone ? STANDING_VAR[myTone] : 'var(--ac-same)' } as CSSProperties

  return (
    <section aria-labelledby="ac-ct" className="grid min-w-0 gap-3.5" style={youStyle}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="ac-ct" className="m-0 font-heading text-[22px] font-bold">
          {solo ? 'Your score' : 'How you compare'}
        </h2>
        <Legend solo={alone} />
      </div>
      {src !== 'ahrefs' && (
        <p className="m-0 rounded-md border border-dashed border-caution-line px-3 py-2.5 text-sm text-caution">
          {src === 'opr'
            ? 'Ahrefs didn’t answer this time, so link strength uses Open PageRank for this check.'
            : `Link strength isn’t available right now, so it counts for no one and each total is scaled up from the other ${100 - LINK_POINTS} points. Try again in a minute for the full score.`}
        </p>
      )}
      {/* A site's own Ahrefs call failing isn't "Ahrefs has no rating" (audit 2026-10-05). */}
      {[standIns.filter((s) => !s.drFailed), standIns.filter((s) => s.drFailed)].map(
        (list, k) =>
          list.length > 0 && (
            <p key={k} className="m-0 rounded-md border border-dashed border-caution-line px-3 py-2.5 text-sm text-caution">
              {k === 0 ? 'Ahrefs has no Domain Rating for' : 'Ahrefs didn’t answer for'} {list.map((s) => s.domain).join(' or ')},
              so {list.length > 1 ? 'their' : 'its'} link strength uses Open PageRank (marked OPR) instead.
            </p>
          ),
      )}
      {/* Phones: one card per site (sorted, yours highlighted), then the checks as a narrow grid. */}
      <div className="grid gap-2.5 sm:hidden">
        <ol className="m-0 grid list-none gap-2.5 p-0">
          {order.map((o, col) => {
            const s = o.scores
            const ov = tone(s?.overall ?? null, 100, s?.overall ?? null, overall, OVERALL_TIE - 1)
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
                    {s ? <CountUp value={s.overall} /> : '–'}
                    <small className="ml-0.5 font-sans text-xs font-normal text-muted-foreground">/ 100</small>
                  </span>
                </div>
                {s ? (
                  <>
                    <span className={`ac-bar mt-2.5 max-w-none! ${sClass(ov)}`} aria-hidden="true">
                      <i className="ac-grow" style={{ width: `${s.overall}%`, '--d': `${col * 90}ms` } as CSSProperties} />
                    </span>
                    <dl className="m-0 mt-3 grid grid-cols-4 gap-1.5">
                      {LETTERS.map((l) => {
                        const values = part(l.id)
                        const a = authorityOf(o.site, r)
                        const st = letterTone(l, o, values)
                        return (
                          <div key={l.id} className={`ac-tint grid gap-0.5 rounded-md px-1 py-2 text-center ${sClass(st)}`}>
                            <dt className="truncate text-[11px] font-semibold text-muted-foreground">{l.label}</dt>
                            <dd className="ac-num m-0 font-heading text-[17px] leading-tight font-bold">
                              {s[l.id]}
                              <small className="font-sans text-[11px] font-normal text-muted-foreground">/{l.points}</small>
                            </dd>
                            {l.id === 'authority' && a !== null && (
                              <dd className="m-0 text-[10px] text-muted-foreground">
                                {authorityFrom(o.site, r) === 'ahrefs' ? 'Ahrefs DR' : 'OPR'} {fmtAuthority(a)}
                              </dd>
                            )}
                          </div>
                        )
                      })}
                    </dl>
                  </>
                ) : (
                  <p className="m-0 mt-1.5 text-xs text-muted-foreground">
                    We couldn&apos;t read this homepage.
                    {auths[col] !== null &&
                      ` ${authorityFrom(o.site, r) === 'ahrefs' ? 'Ahrefs DR' : 'OPR'} ${fmtAuthority(auths[col]!)}.`}
                  </p>
                )}
                {onOpen && (
                  <button
                    type="button"
                    onClick={() => onOpen(o.site.domain)}
                    aria-pressed={openDomain === o.site.domain}
                    aria-controls="ac-cards"
                    className="ac-noprint mt-3 w-full rounded-md border border-line-strong px-3 py-2 text-left text-[13px] font-medium text-primary hover:border-primary-line aria-pressed:border-primary"
                  >
                    {openDomain === o.site.domain ? 'Report card open below ▾' : 'See report card ▾'}
                  </button>
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
          {open ? 'Hide the checks ▴' : 'Show all checks ▾'}
        </button>
        {open && (
          <div id="ac-checks-m" className="overflow-hidden rounded-xl border border-line-strong bg-panel">
            <table className="w-full table-fixed border-collapse text-sm">
              <caption className="sr-only">All the checks for each site</caption>
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
                Our score
              </th>
              {order.map((o) => (
                <th
                  key={o.site.domain}
                  scope="col"
                  className={`px-1.5 pt-4 pb-3 text-center align-bottom sm:px-3 ${o.index === 0 ? 'ac-you' : ''}`}
                >
                  {onOpen ? (
                    <button
                      type="button"
                      onClick={() => onOpen(o.site.domain)}
                      aria-pressed={openDomain === o.site.domain}
                      aria-controls="ac-cards"
                      aria-label={`${o.place ? `${ordinal(o.place)}, ` : ''}${o.site.domain}: open its report card`}
                      className="grid w-full justify-items-center gap-1 rounded-lg border border-transparent px-1 py-1.5 hover:border-line-strong hover:bg-muted aria-pressed:border-primary"
                    >
                      {!solo && (
                        <span className="block font-heading text-[15px] font-bold">{o.place ? ordinal(o.place) : '–'}</span>
                      )}
                      <span
                        className={`block max-w-[18ch] truncate text-sm ${
                          o.index === 0 ? 'font-semibold text-foreground' : 'text-body-soft'
                        }`}
                        title={o.site.domain}
                      >
                        {o.index === 0 && <YouTag />}
                        {o.site.domain}
                      </span>
                      <span className="ac-noprint text-xs font-medium text-primary">Report card ▾</span>
                    </button>
                  ) : (
                    <>
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
                    </>
                  )}
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
              {order.map((o, col) => {
                const v = o.scores?.overall ?? null
                const s = tone(v, 100, v, overall, OVERALL_TIE - 1)
                return (
                  <td key={o.site.domain} className={td(o, `py-4 ${sClass(s)}`)}>
                    {v === null ? (
                      <span className="text-muted-foreground">–</span>
                    ) : (
                      <span className="grid justify-items-center gap-1.5">
                        <span className="ac-num font-heading text-[30px] leading-none font-bold">
                          <CountUp value={v} />
                        </span>
                        <span className="ac-bar" aria-hidden="true">
                          <i className="ac-grow" style={{ width: `${v}%`, '--d': `${col * 90}ms` } as CSSProperties} />
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
                  {open ? 'Hide the checks ▴' : 'Show all checks ▾'}
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
        </p>
        {!solo && <RivalControl r={r} onAddRival={onAddRival} loading={loading} />}
      </div>
      {failed.length > 0 && (
        <ul className="m-0 list-none p-0 text-[13px] text-caution">
          {failed.map((s) => (
            <li key={s.domain}>
              {s.pageError} Its scores show as “–”{authorityOf(s, r) !== null ? '; its link strength still shows' : ''}.
            </li>
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

/* ── Report card: one site's score, its 4 parts, what it does well, what's
 * missing, then your first 3 fixes (your card) or where it beats you (a
 * rival's), and its link strength in plain words. Coloured by its own level,
 * like a site checked alone. Mock: drafts/authority-check-report-card-comp.html.
 * ─────────────────────────────────────────────────────────────────────── */

const upTo = (points: number, graded: boolean) => `${graded ? 'up to ' : ''}+${points}`

function ReportCard({ r, site, solo }: { r: AuthorityResult; site: SiteResult; solo: boolean }) {
  const order = ranked(r)
  const me = order.find((o) => o.site.domain === site.domain)!
  const s = me.scores
  const isYou = site.domain === r.you.domain
  const read = order.filter((o) => o.scores).length
  const a = authorityOf(site, r)
  const from = authorityFrom(site, r)
  const passed = s
    ? PROOF_CHECKS.filter((c) => site.proof!.includes(c.id)).sort((x, y) => pointsFor(y, site) - pointsFor(x, site))
    : []
  const missing = s ? PROOF_CHECKS.filter((c) => !site.proof!.includes(c.id)).sort((x, y) => y.points - x.points) : []
  const tone = s ? level(s.overall, 100) : null
  const h3 = 'm-0 font-heading text-[17px] font-bold'
  const li = 'grid grid-cols-[22px_minmax(0,1fr)_auto] items-baseline gap-2 border-t border-border py-2.5 first:border-t-0'

  return (
    <article aria-label={`Report card for ${site.domain}`} className="ac-card ac-reveal grid gap-7 rounded-2xl border border-line-strong bg-panel p-5 sm:p-7">
      <div className="grid gap-2">
        {/* On a printed solo report this repeats the line above the headline. */}
        <p className={`m-0 text-sm text-muted-foreground ${solo ? 'print:hidden' : ''}`}>
          {isYou && <YouTag />}
          <b className="font-semibold text-foreground">{site.domain}</b>
          {' · '}
          {solo ? 'checked alone' : me.place ? `${ordinal(me.place)} of ${read}` : 'not read'}
        </p>
        {s ? (
          <p className={`m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ${sClass(tone)}`}>
            <span className="ac-num font-heading text-[clamp(56px,8vw,76px)] leading-[.9] font-bold tracking-[-.03em] tabular-nums print:text-[48px]">
              <CountUp value={s.overall} />
            </span>
            <span className="text-base text-muted-foreground">/ 100</span>
            <span className="ac-pill rounded-full px-2.5 py-1 text-[13px] font-semibold">{band(s.overall)}</span>
          </p>
        ) : (
          <div className="grid gap-1">
            <p className="m-0 font-heading text-[22px] font-bold">
              We couldn&apos;t read {isYou ? 'your' : 'this'} homepage, so there&apos;s no score.
            </p>
            <p className="m-0 max-w-[64ch] text-[15px] text-body-soft">
              {site.pageError} {a !== null ? `${isYou ? 'Your' : 'Its'} link strength still shows below.` : ''}
            </p>
          </div>
        )}
      </div>

      {s && (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {LETTERS.map((l, i) => {
            const v = s[l.id]
            const t = level(v, l.points)
            return (
              <li key={l.id} className={`ac-tint grid content-start gap-2 rounded-xl border border-border p-3.5 ${sClass(t)}`}>
                <span className="flex items-center gap-2 font-heading text-[15px] font-semibold">
                  <Badge id={l.id} size="card" />
                  {l.label}
                </span>
                <span className="ac-num font-heading text-[22px] leading-tight font-semibold">
                  {v}
                  <small className="ml-0.5 font-sans text-[13px] font-normal text-muted-foreground">/ {l.points}</small>
                  {l.id === 'authority' && a !== null && (
                    <small className="ml-2 font-sans text-xs font-normal text-muted-foreground">
                      {from === 'ahrefs' ? 'DR' : 'OPR'} {fmtAuthority(a)}
                    </small>
                  )}
                </span>
                <span className="ac-bar max-w-none!" aria-hidden="true">
                  <i className="ac-grow" style={{ width: `${(v / l.points) * 100}%`, '--d': `${120 + i * 80}ms` } as CSSProperties} />
                </span>
                <small className="text-[13px] text-muted-foreground">{l.hint}</small>
              </li>
            )
          })}
        </ul>
      )}

      {/* Print only: the fixes right under the four parts, so page one holds the answer (Chris, 2026-10-06). */}
      {s && <div className="hidden print:block">{isYou ? <Fixes r={r} /> : <BeatsYou r={r} site={site} />}</div>}

      {s && (
        <div className="grid gap-x-7 gap-y-5 md:grid-cols-2">
          <section aria-label={isYou ? 'What you do well' : 'What they do well'}>
            <h3 className={`${h3} mb-2`}>
              {isYou ? 'What you do well' : 'What they do well'}{' '}
              <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">
                {passed.length} of {PROOF_CHECKS.length}
              </span>
            </h3>
            <ul className="m-0 grid list-none p-0">
              {passed.length === 0 && <li className="py-2.5 text-[15px] text-muted-foreground">None of the {PROOF_CHECKS.length} checks yet.</li>}
              {passed.map((c) => (
                <li key={c.id} className={li}>
                  <span className="ac-yes font-semibold" aria-label="yes">
                    ✓
                  </span>
                  <span className="min-w-0 text-[15px]">
                    {c.label}
                    {site.evidence?.[c.id] && (
                      <small className="block text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{site.evidence[c.id]}</small>
                    )}
                  </span>
                  <span className="font-heading text-sm font-semibold whitespace-nowrap text-body-soft tabular-nums">
                    {pointsFor(c, site)} pts
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="What's missing">
            <h3 className={`${h3} mb-2`}>
              What&apos;s missing{' '}
              <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">
                {missing.length} of {PROOF_CHECKS.length}
              </span>
            </h3>
            <ul className="m-0 grid list-none p-0">
              {missing.length === 0 && <li className="py-2.5 text-[15px] text-muted-foreground">Nothing. Every check passed.</li>}
              {missing.map((c) => {
                const gap = isYou && !solo && isGap(r, c.id)
                return (
                  <li key={c.id} className={li}>
                    <span className={gap ? 'ac-gap font-semibold' : 'ac-no'} aria-label={gap ? 'no, and a rival has it' : 'no'}>
                      ✕
                    </span>
                    <span className="min-w-0 text-[15px]">
                      {c.label}
                      {c.id === 'updated' && (
                        <small className="block text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
                          {updatedWords(site.updated, r.checkedAt, isYou)}
                        </small>
                      )}
                    </span>
                    <span className="font-heading text-sm font-semibold whitespace-nowrap text-primary tabular-nums">
                      {upTo(c.points, GRADED.has(c.id))}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      {/* Right under the scored checks, before the fixes and link strength (Chris, 2026-10-06). */}
      {s && (
        <section aria-label="Good to know, not scored" className="grid gap-2 border-t border-border pt-5">
          <h3 className={h3}>
            Good to know{' '}
            <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">not scored</span>
          </h3>
          <ul className="m-0 grid list-none p-0 md:grid-cols-2 md:gap-x-7">
            {SHOWN_CHECKS.map((c) => {
              const yes = site.proof!.includes(c.id)
              return (
                <li key={c.id} className="grid grid-cols-[22px_minmax(0,1fr)] items-baseline gap-2 border-t border-border py-2.5 md:[&:nth-child(2)]:border-t-0 first:border-t-0">
                  <span className={yes ? 'ac-yes font-semibold' : 'text-muted-foreground'} aria-label={yes ? 'yes' : 'no'}>
                    {yes ? '✓' : '–'}
                  </span>
                  <span className="min-w-0 text-[15px]">
                    {c.label}
                    <small className="block text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
                      {yes ? (site.evidence?.[c.id] ?? 'Found') : c.note}
                    </small>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {s && <div className="print:hidden">{isYou ? <Fixes r={r} /> : <BeatsYou r={r} site={site} />}</div>}

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-t border-border pt-5">
        <span className="row-span-2 font-heading text-[30px] leading-none font-bold tabular-nums">
          {a === null ? '–' : fmtAuthority(a)}
        </span>
        <b className="font-heading text-[15px]">
          {a === null ? 'Link strength' : from === 'ahrefs' ? 'Domain Rating (Ahrefs)' : 'Open PageRank ×10'}
        </b>
        <p className="m-0 max-w-[70ch] text-[15px] text-body-soft">
          {a === null ? (
            'Link strength isn’t available for this site right now.'
          ) : (
            <LinkWords a={a} you={isYou} src={from === 'ahrefs' ? 'DR' : 'OPR'} />
          )}
        </p>
      </div>
    </article>
  )
}

const fmtDay = (day: string) =>
  new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** Why Recently updated has no ✓ (or not full points), in plain words. `you` = your own card. */
function updatedWords(u: SiteResult['updated'], checkedAt: string, you = true): string {
  const its = you ? 'your' : 'its'
  const where = (p?: string) => (p && p !== '/' ? ` (${p.slice(0, 50)})` : '')
  if (u?.newest)
    return `${u.source === 'feed' ? `Newest post in ${its} blog feed` : `Newest page ${its} sitemap and the page agree on`}: ${fmtDay(u.newest)}${where(u.path)}, ${Math.floor((Date.parse(checkedAt) - Date.parse(u.newest)) / (30.44 * 86_400_000))} months ago.`
  switch (u?.why) {
    case 'unconfirmed':
      return `${you ? 'Your' : 'Its'} sitemap says ${u.claimedPath && u.claimedPath !== '/' ? u.claimedPath.slice(0, 50) : 'your newest page'} changed on ${u.claimed ? fmtDay(u.claimed) : 'a recent date'}, but the page shows no date to confirm it, and we found no blog feed.`
    case 'stamped':
      return `Most pages in ${its} sitemap share one date, likely set by ${you ? 'your' : 'the'} website software, and we found no blog feed, so we can’t tell.`
    case 'no-dates':
      return `${you ? 'Your' : 'Its'} sitemap has no page dates and we found no blog feed, so we can’t tell.`
    case 'not-read':
      return `We couldn’t read ${its} newest pages in time, so we can’t tell. Try again in a minute.`
    default:
      return 'We found no sitemap or blog feed, so we can’t tell.'
  }
}


/**
 * Link strength in Authority's own points (out of 20), so it reads against the score above:
 * "DR 36 gives 9 of the 20 Authority points. At DR 50 it gives 11, the most links can give.
 * The other 9 come from review sites (5) and where you're featured (4)." Same bands as the score.
 */
function LinkWords({ a, you, src }: { a: number; you: boolean; src: 'DR' | 'OPR' }) {
  const pts = authorityPoints(a)
  const next = [...LINK_BANDS].reverse().find((b) => b.from > a)
  const max = LETTERS.find((l) => l.id === 'authority')!.points
  const top = LINK_BANDS[0]
  const points = (id: ProofId) => PROOF_CHECKS.find((c) => c.id === id)!.points
  // Chris, 2026-10-05: "of 11" next to a /20 score read as a mistake. Say the split first.
  return (
    <>
      Authority is out of {max}: link strength up to {LINK_POINTS}, links to {you ? 'your' : 'its'} review profiles up to{' '}
      {points('reviewSites')}, and places that feature {you ? 'you' : 'it'} up to {points('seen')}. {src} {fmtAuthority(a)}{' '}
      earns {pts} of the {LINK_POINTS} link points.{' '}
      {!next
        ? `That’s all ${LINK_POINTS}.`
        : next.points === top.points
          ? `At ${src} ${next.from} it earns all ${top.points}.`
          : `At ${src} ${next.from} it earns ${next.points}; ${src} ${top.from} earns all ${top.points}.`}{' '}
      {/* "Links grow over months" cut 2026-10-06: no source gives a time (research/authority-check-evidence/authority.md). */}
      {src === 'DR' ? 'Domain Rating is Ahrefs’ estimate, not a Google score.' : 'Open PageRank is an estimate from public crawl data, not a Google score.'}
    </>
  )
}

/**
 * Your card: the first 3 moves, each with the points it adds: checks you miss, then points you
 * have part of (link strength, a stronger track record, more review profiles, one more place
 * that features you). With nothing missing, the heading says how to reach 100.
 */
function Fixes({ r }: { r: AuthorityResult }) {
  const moves = nextMoves(r)
  const anyMissing = moves.some((m) => m.kind === 'missing')
  const count = moves.length === 3 ? 'Your first 3 fixes' : moves.length === 1 ? 'Your first fix' : 'Your first fixes'
  const title = anyMissing ? count : 'How to reach 100'
  if (moves.length === 0)
    return (
      <div className="rounded-xl border border-line-strong p-[18px]">
        <p className="m-0 font-heading text-[17px] font-bold">Your site shows every check we read, with full points.</p>
        <p className="m-0 mt-2 text-[15px] text-body-soft">
          For the full list,{' '}
          <a href="/audit" className="text-primary underline underline-offset-[3px]">
            run the Findability Check
          </a>
          .
        </p>
      </div>
    )
  return (
    <section aria-label={title} className="grid gap-3">
      <h3 className="m-0 font-heading text-[19px] font-bold">{title}</h3>
      <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3 print:grid-cols-3">
        {moves.map((m, i) => (
          <li key={m.id} className="grid content-start gap-1.5 rounded-xl border border-line-strong p-4 print:gap-1 print:p-3">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-heading text-[13px] font-semibold text-muted-foreground">{i + 1}</span>
              <span className="font-heading text-[15px] font-bold whitespace-nowrap text-primary">
                {upTo(m.points, m.graded)} {m.points === 1 && !m.graded ? 'point' : 'points'}
              </span>
            </span>
            <b className="font-heading text-[16px] leading-snug print:text-[15px]">{m.title}</b>
            <span className="text-[15px] text-body-soft print:text-[13px] print:leading-snug">{m.body}</span>
            {m.who && <small className="text-[13px] text-muted-foreground">{m.who}</small>}
            {WHY[m.id] && (
              <small className="mt-1 border-t border-border pt-2 text-[13px] text-muted-foreground">
                <b className="font-semibold text-foreground">Why:</b> {WHY[m.id]!.text}{' '}
                <a
                  href={WHY[m.id]!.href}
                  target="_blank"
                  rel="noopener"
                  className="underline underline-offset-[3px] hover:text-foreground"
                >
                  {WHY[m.id]!.source}
                </a>
              </small>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** A rival's card: the checks it passes and you don't, with what we found on its homepage. */
function BeatsYou({ r, site }: { r: AuthorityResult; site: SiteResult }) {
  const beats = beatsYou(r, site)
  const mine = scoresOf(r.you, r)?.overall ?? null
  const theirs = scoresOf(site, r)?.overall ?? null
  const ahead = mine !== null && theirs !== null ? theirs - mine : null
  const worth = beats.reduce((n, b) => n + b.points, 0)
  return (
    <section aria-label="Where they beat you" className="grid gap-2">
      <h3 className="m-0 font-heading text-[19px] font-bold">Where they beat you</h3>
      <p className="m-0 text-[15px] text-body-soft">
        {mine === null
          ? 'We couldn’t read your homepage, so there’s nothing to set this against.'
          : beats.length === 0
            ? `Nowhere. You pass every check they pass${ahead !== null && ahead < 0 ? `, and you’re ${-ahead} points ahead` : ''}.`
            : `${beats.length} check${beats.length > 1 ? 's' : ''} they pass and you don’t, worth ${worth} points.${
                ahead !== null && ahead > 0 ? ` They’re ${ahead} points ahead of you.` : ''
              }`}
      </p>
      {beats.length > 0 && (
        <ul className="m-0 grid list-none p-0">
          {beats.map(({ check, points }) => (
            <li
              key={check.id}
              className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-baseline gap-2 border-t border-border py-2.5 first:border-t-0"
            >
              <span className="ac-gap font-semibold" aria-hidden="true">
                ✕
              </span>
              <span className="min-w-0 text-[15px]">
                {check.label}
                {site.evidence?.[check.id] && (
                  <small className="block text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
                    They show: {site.evidence[check.id]}
                  </small>
                )}
              </span>
              <span className="font-heading text-sm font-semibold whitespace-nowrap text-body-soft tabular-nums">
                {points} pts
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Under the compare table: one tab per site (rank order), then that site's report card. */
function ReportCards({ r, open, setOpen }: { r: AuthorityResult; open: string; setOpen: (d: string) => void }) {
  const order = ranked(r)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const site = [r.you, ...r.rivals].find((s) => s.domain === open) ?? r.you
  return (
    <section id="ac-cards" aria-labelledby="ac-cards-h" className="grid scroll-mt-28 gap-3.5">
      <h2 id="ac-cards-h" className="m-0 font-heading text-[22px] font-bold">
        Report cards
      </h2>
      <div role="tablist" aria-label="Report card for" className="ac-noprint flex flex-wrap gap-1.5">
        {order.map((o, i) => {
          const on = o.site.domain === site.domain
          return (
            <button
              key={o.site.domain}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`ac-card-tab-${i}`}
              aria-selected={on}
              aria-controls="ac-card-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setOpen(o.site.domain)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.preventDefault()
                const j = (i + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length
                setOpen(order[j].site.domain)
                tabRefs.current[j]?.focus()
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-sm ${
                on ? 'border-primary bg-primary-deep text-foreground' : 'border-line-strong bg-panel text-body-soft hover:border-muted-foreground'
              }`}
            >
              <b className="font-heading text-[13px] text-muted-foreground">{o.place ? ordinal(o.place) : '–'}</b>
              {o.index === 0 && <YouTag />}
              {o.site.domain}
            </button>
          )
        })}
      </div>
      <div id="ac-card-panel" role="tabpanel" aria-labelledby={`ac-card-tab-${order.findIndex((o) => o.site.domain === site.domain)}`}>
        <ReportCard key={site.domain} r={r} site={site} solo={false} />
      </div>
    </section>
  )
}

/* ── Before a check: a small preview of each tab, from the example ──────── */

function Previews({ example, mode, onPick }: { example: AuthorityResult; mode: Mode; onPick: (m: Mode) => void }) {
  const order = ranked(example)
  const you = scoresOf(example.you, example)!
  const fix = firstMoves({ ...example, rivals: [] }, 1)[0]
  const overall = order.map((o) => o.scores?.overall ?? null)
  const card = (m: Mode) =>
    `grid content-start gap-3.5 rounded-2xl border bg-panel p-[18px] text-left transition-[border-color,transform] duration-150 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
      mode === m ? 'border-primary' : 'border-line-strong hover:border-muted-foreground'
    }`
  return (
    <section aria-labelledby="ac-result" className="grid gap-3.5">
      <h2 id="ac-result" className="m-0 font-heading text-[22px] font-bold">
        Two ways to check
      </h2>
      <div className="grid gap-3.5 md:grid-cols-2">
        <button type="button" onClick={() => onPick('solo')} className={card('solo')}>
          <span className="flex items-baseline justify-between gap-2">
            <b className="font-heading text-[16px] font-semibold">Check my site</b>
            <span className="text-[13px] text-muted-foreground">Example</span>
          </span>
          <span className="ac-tint grid min-h-[172px] content-start gap-2.5 rounded-xl p-3.5" aria-hidden="true">
            <span className={`flex items-baseline gap-2 ${sClass(level(you.overall, 100))}`}>
              <span className="ac-num font-heading text-[34px] leading-none font-bold">{you.overall}</span>
              <span className="text-[13px] text-muted-foreground">/ 100</span>
              <span className="ac-pill rounded-full px-2.5 py-0.5 text-xs font-semibold">{band(you.overall)}</span>
            </span>
            {LETTERS.map((l, i) => (
              <span key={l.id} className={`grid grid-cols-[82px_minmax(0,1fr)] items-center gap-2 text-xs text-muted-foreground ${sClass(level(you[l.id], l.points))}`}>
                {l.label}
                <span className="ac-bar max-w-none!">
                  <i className="ac-grow" style={{ width: `${(you[l.id] / l.points) * 100}%`, '--d': `${i * 80}ms` } as CSSProperties} />
                </span>
              </span>
            ))}
            {fix && (
              <span className="flex justify-between gap-2 border-t border-border pt-2 text-[13px] text-body-soft">
                1st fix: {fix.title}
                <b className="font-semibold whitespace-nowrap text-primary">+{fix.points} points</b>
              </span>
            )}
          </span>
          <span className="text-[15px] text-body-soft">
            A report card: your score out of 100, what you do well, what&apos;s missing, and your first 3 fixes with
            the points each one adds.
          </span>
        </button>
        <button type="button" onClick={() => onPick('compare')} className={card('compare')}>
          <span className="flex items-baseline justify-between gap-2">
            <b className="font-heading text-[16px] font-semibold">Compare with rivals</b>
            <span className="text-[13px] text-muted-foreground">Example</span>
          </span>
          <span className="ac-tint grid min-h-[172px] content-start gap-1 rounded-xl p-3.5" aria-hidden="true">
            {order.map((o, i) => {
              const v = o.scores?.overall ?? 0
              return (
                <span
                  key={o.site.domain}
                  className={`grid grid-cols-[2.2rem_minmax(0,1fr)_70px_2rem] items-center gap-2 rounded-md px-2 py-[5px] text-[13px] ${
                    o.index === 0 ? 'shadow-[0_0_0_1.5px_var(--color-foreground)]' : ''
                  } ${sClass(standing(v, overall, OVERALL_TIE - 1))}`}
                >
                  <b className="font-heading">{o.place ? ordinal(o.place) : '–'}</b>
                  <span className="truncate text-body-soft">{o.site.domain}</span>
                  <span className="ac-bar">
                    <i className="ac-grow" style={{ width: `${v}%`, '--d': `${i * 80}ms` } as CSSProperties} />
                  </span>
                  <span className="ac-num text-right font-heading text-[15px] font-bold">{v}</span>
                </span>
              )
            })}
            <span className="mt-1 text-xs text-muted-foreground">Click any site for its report card.</span>
          </span>
          <span className="text-[15px] text-body-soft">
            You and up to {MAX_RIVALS} rivals, ranked 1st to {MAX_RIVALS + 1}th. Click any site to open its own report
            card.
          </span>
        </button>
      </div>
      <p className="m-0 text-[13px] text-muted-foreground">Example sites, made-up numbers.</p>
    </section>
  )
}

/* ── Offer ──────────────────────────────────────────────────────────────── */

function Offer() {
  const theme = useTheme()
  return (
    <aside
      aria-labelledby="ac-offer"
      className="grid items-center gap-x-10 gap-y-5 rounded-xl border border-primary-line bg-primary-deep p-6 md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <h2 id="ac-offer" className="m-0 mb-1.5 font-heading text-[22px] font-bold">
          {toolEnding.heading}
        </h2>
        <p className="m-0 max-w-[60ch] text-body-soft">
          15 minutes, free. We read your results together and pick the one move that matters most.
        </p>
        {/* Print has no button, so say where to book (Chris, 2026-10-06). */}
        <p className="m-0 mt-2 hidden font-heading font-semibold print:block">
          Book your free 15 minutes at chrishornak.com/authority-check
        </p>
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

/** One icon per part: briefcase (work and track record), ribbon (credentials), link (who links to you), shield (trust). */
const LETTER_ICON: Record<Letter, React.ReactNode> = {
  experience: (
    <svg viewBox="0 0 24 24" {...ICON}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  ),
  expertise: (
    <svg viewBox="0 0 24 24" {...ICON}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 8 21l4-2 4 2-1-7.5" />
    </svg>
  ),
  authority: (
    <svg viewBox="0 0 24 24" {...ICON}>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
  trust: (
    <svg viewBox="0 0 24 24" {...ICON}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
}

const GROW: { id: Letter; text: string }[] = [
  { id: 'experience', text: 'Show real jobs on a projects page, and say how long you have done this work.' },
  { id: 'expertise', text: 'Name the people behind the business, list licenses and awards, and give each offer its own page.' },
  {
    id: 'authority',
    text: 'Get named and linked by local news, partners, associations and lists, and link your review profiles.',
  },
  {
    id: 'trust',
    text: 'Show real reviews, a phone or street address and an About page. Most take an afternoon; earning reviews takes longer.',
  },
]

function Grow() {
  return (
    <section aria-labelledby="ac-grow" className="ac-noprint grid gap-[18px]">
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
                {LETTER_ICON[g.id]}
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

/* ── How we score: every scored check, its points and the source behind it, one open/close
 * part per letter, then what is our own choice (Chris, 2026-10-06: on this page, not a modal
 * or a new page). Native <details>, like Questions: the text stays in the HTML for search and
 * AI tools, and #how-we-score can be linked. Lines: lib/authority-check-evidence.ts. ─── */

const SCORE_SUMMARY =
  'flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 font-heading text-[16px] font-semibold hover:bg-muted sm:px-5 [&::-webkit-details-marker]:hidden'

function SourceLink({ why }: { why: { source: string; href: string } }) {
  return (
    <a href={why.href} target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-foreground">
      {why.source}
    </a>
  )
}

function Plus() {
  return (
    <span
      aria-hidden="true"
      className="flex-none text-xl leading-none font-normal text-muted-foreground transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
    >
      +
    </span>
  )
}

function HowWeScore() {
  const rows = (l: Letter) => [
    ...(l === 'authority' ? [{ id: 'links' as const, label: 'Link strength', pts: `up to ${LINK_POINTS}` }] : []),
    ...checksIn(l).map((c) => ({ id: c.id, label: c.label, pts: GRADED.has(c.id) ? `up to ${c.points}` : `${c.points}` })),
  ]
  return (
    <section id="how-we-score" aria-labelledby="ac-how" className="ac-noprint grid scroll-mt-28 gap-3.5 border-t border-border pt-10">
      <h2 id="ac-how" className="m-0 font-heading text-[22px] font-bold">
        How we score
      </h2>
      <p className="m-0 max-w-[70ch] text-body-soft">
        Every check has a reason you can read for yourself. Most come from the guidelines Google gives the people who rate
        its search results. Open a part to see each check, its points and its source.
      </p>
      <div className="grid overflow-hidden rounded-xl border border-line-strong bg-panel">
        {LETTERS.map((l) => (
          <details key={l.id} className="group border-t border-border first:border-t-0">
            <summary className={SCORE_SUMMARY}>
              <span>
                {l.label} <span className="ml-1 font-sans text-[13px] font-medium text-muted-foreground">{l.points} points</span>
              </span>
              <Plus />
            </summary>
            <div className="grid gap-3 px-4 pb-5 sm:px-5">
              {l.id === 'trust' && (
                <p className="m-0 max-w-[75ch] text-[15px] text-body-soft">
                  Trust gets 40 of the 100 points. {TRUST_WEIGHT.text}{' '}
                  <small className="text-[13px] text-muted-foreground">
                    <SourceLink why={TRUST_WEIGHT} />
                  </small>
                </p>
              )}
              <ul className="m-0 grid list-none p-0">
                {rows(l.id).map((row) => {
                  const why = WHY[row.id]
                  return (
                    <li
                      key={row.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-t border-border py-3 first:border-t-0"
                    >
                      <b className="font-heading text-[15px] font-semibold">{row.label}</b>
                      <span className="font-heading text-sm font-semibold whitespace-nowrap text-body-soft tabular-nums">
                        {row.pts} pts
                      </span>
                      {why && (
                        <p className="col-span-2 m-0 max-w-[75ch] text-[15px] text-body-soft">
                          {why.text}{' '}
                          <small className="text-[13px] text-muted-foreground">
                            <SourceLink why={why} />
                          </small>
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </details>
        ))}
        <details className="group border-t border-border">
          <summary className={SCORE_SUMMARY}>
            What is our own choice
            <Plus />
          </summary>
          <ul className="m-0 grid max-w-[75ch] list-disc gap-2 pr-4 pb-5 pl-9 text-[15px] text-body-soft sm:pr-5 sm:pl-10">
            {OWN_CHOICES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  )
}

/* ── Questions (end of the page): one open/close list in place of the old "What this can't
 * see" box and "Based on Google's public guidance" (Chris, 2026-10-05). The one line the SEO
 * panel wanted seen (6 of 6) stays above the list, never folded away. Text and FAQPage schema
 * share lib/authority-check-faq.ts. Native <details>: no script, the answers stay in the HTML
 * for search and AI tools. Not printed (Chris, 2026-10-06: the printed report is the report). ─── */

function Questions({ asOf, src }: { asOf: string | null; src: ReturnType<typeof authoritySource> }) {
  return (
    <section aria-labelledby="ac-faq" className="ac-noprint grid gap-3.5 border-t border-border pt-10">
      <h2 id="ac-faq" className="m-0 font-heading text-[22px] font-bold">
        Questions
      </h2>
      <p className="m-0 max-w-[70ch] text-body-soft">{FAQ_LEAD}</p>
      <div className="grid overflow-hidden rounded-xl border border-line-strong bg-panel">
        {AUTHORITY_FAQ.map((f) => (
          <details key={f.id} className="group border-t border-border first:border-t-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 font-heading text-[16px] font-semibold hover:bg-muted sm:px-5 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span
                aria-hidden="true"
                className="flex-none text-xl leading-none font-normal text-muted-foreground transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <div className="grid max-w-[75ch] gap-2.5 px-4 pb-5 text-[15px] text-body-soft sm:px-5">
              {f.a.map((p) => (
                <p key={p} className="m-0">
                  {p}
                </p>
              ))}
              {f.id === 'data' && src === 'opr' && (
                <p className="m-0">
                  For this check Ahrefs was busy, so link strength uses Open PageRank{asOf ? `, as of ${asOf}` : ''}.
                </p>
              )}
              {f.links && (
                <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                  {f.links.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  ))}
                </p>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ── Report header: the answer, then Copy link / Print ─────────────────── */

function ReportHead({ r }: { r: AuthorityResult }) {
  const n = r.rivals.length
  const [note, setNote] = useState('')
  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-panel px-3 py-[7px] text-sm font-medium text-foreground hover:border-muted-foreground [&>svg]:h-4 [&>svg]:w-4'
  return (
    <div className="grid gap-3">
      {/* Print only: what this is, for someone who never saw the tool (Chris, 2026-10-06). */}
      <div className="mb-1 hidden gap-1 border-b border-border pb-3 print:grid">
        <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-4 font-heading text-[18px] font-bold">
          Website Authority &amp; E-E-A-T Report
          <span className="font-sans text-[12px] font-normal text-muted-foreground">Free Authority Check by Chris Hornak · chrishornak.com/authority-check</span>
        </p>
        <p className="m-0 text-[13px] text-body-soft">
          A score out of 100 for how well a website shows experience, expertise, authority and trust (what Google calls{' '}
          <span className="whitespace-nowrap">E-E-A-T</span>), with the fixes worth the most points. {FAQ_LEAD}
        </p>
      </div>
      <p className="m-0 text-sm text-muted-foreground">
        <b className="font-medium text-body-soft">{r.you.domain}</b>{' '}
        {n === 0 ? 'alone' : `vs ${n} rival${n > 1 ? 's' : ''}`} · {fmtDate(r.checkedAt)}
      </p>
      <h2 id="ac-result" className="m-0 max-w-[36ch] font-heading text-[clamp(24px,3.4vw,32px)] leading-tight font-bold text-balance">
        {summary(r)}
      </h2>
      <div className="ac-noprint flex flex-wrap items-center gap-2">
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

/* ── While a check runs: a "checking" panel takes the report's place (Chris,
 * 2026-10-02: the dimmed sample looked like a result). ────────────────── */

/** Rough timing of one check (homepages, Ahrefs, extra pages and records run side by side). */
const CHECK_ETA = 15
const CHECK_STEPS = [
  { at: 0, text: 'Reading each homepage' },
  { at: 2, text: 'Looking up link strength' },
  { at: 4, text: 'Reading About, contact and team pages' },
  { at: 7, text: 'Checking public records' },
  { at: 10, text: 'Scoring and ranking' },
]

/** `adding`: only new rivals are being read (your result is kept). */
function Checking({ sites, adding = false }: { sites: string[]; adding?: boolean }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setT((Date.now() - start) / 1000), 250)
    return () => clearInterval(id)
  }, [])
  // The bar runs to 92% over the usual time, then waits for the answer.
  const pct = Math.min(92, (t / CHECK_ETA) * 92)
  const left = Math.ceil(CHECK_ETA - t)
  const step = CHECK_STEPS.filter((s) => t >= s.at).length - 1
  const rivals = sites.length - 1
  return (
    <div role="status" className="grid gap-4 rounded-xl border border-line-strong bg-panel p-5 sm:p-7">
      <p className="m-0 font-heading text-xs font-bold tracking-[.08em] text-primary uppercase">Checking now</p>
      <h2 className="m-0 font-heading text-[clamp(22px,3vw,28px)] leading-tight font-bold [overflow-wrap:anywhere]">
        {adding
          ? `Checking ${sites.length > 1 ? `${sites.length} new rivals` : sites[0]}…`
          : `Checking ${sites[0]}${rivals > 0 ? ` and ${rivals} rival${rivals > 1 ? 's' : ''}` : ''}…`}
      </h2>
      <div className="grid gap-1.5">
        <span className="ac-progress" aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </span>
        <p className="m-0 text-[13px] text-muted-foreground tabular-nums">
          {left > 0 ? `About ${left} second${left > 1 ? 's' : ''} left` : 'Almost done…'}
        </p>
      </div>
      <ol className="m-0 grid list-none gap-2 p-0 text-sm">
        {CHECK_STEPS.map((s, i) => (
          <li
            key={s.text}
            className={`flex items-center gap-2.5 ${i < step ? 'text-body-soft' : i === step ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
          >
            <span aria-hidden="true" className={`inline-grid h-5 w-5 flex-none place-items-center ${i === step ? 'ac-pulse' : ''}`}>
              {i < step ? <span className="text-primary">✓</span> : i === step ? <span className="ac-dot" /> : <span className="ac-dot ac-dot-idle" />}
            </span>
            {s.text}
          </li>
        ))}
      </ol>
      <p className="m-0 text-[13px] text-muted-foreground">Your report appears here when it’s ready.</p>
    </div>
  )
}

/* ── Root ───────────────────────────────────────────────────────────────── */

export function AuthorityCheck({ example }: { example: AuthorityResult }) {
  const [mode, setMode] = useState<Mode>('solo')
  const [you, setYou] = useState('')
  const [rivals, setRivals] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** A failed check or add, shown in the results area where the page has scrolled to (audit 2026-10-05). */
  const [resultError, setResultError] = useState<string | null>(null)
  const [result, setResult] = useState<AuthorityResult | null>(null)
  const [pending, setPending] = useState<string[]>([])
  /** The report card open under the compare table; null = yours. */
  const [card, setCard] = useState<string | null>(null)
  const resultRef = useRef<HTMLElement>(null)

  const scrollToResult = () =>
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })

  function pickMode(m: Mode) {
    setMode(m)
    setError(null)
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
    setResultError(null)
    setLoading(true)
    setPending(bares)
    // Show the "checking" panel right away, where the report will appear.
    scrollToResult()
    const query = shareQuery(
      me.host,
      others.map((o) => o.host),
    )
    try {
      const res = await fetch(`/api/authority-check?${query}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data.error) {
        setResultError(data?.error ?? 'Something went wrong. Try again in a minute.')
        return
      }
      setResult(data as AuthorityResult)
      setCard(null)
      window.history.replaceState(null, '', `${window.location.pathname}?${query}`)
      scrollToResult()
    } catch {
      setResultError('We could not reach the checker. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Rivals added to the check on screen (up to 3 in all): only the new sites are read (?add=),
   * then joined to your result. The first check's sources stay in charge, so every site is
   * scored alike. Errors show where the rivals were typed (`onError`), or in the hero.
   */
  async function addRivals(raws: string[], onError: (e: string) => void = setError) {
    const typed = raws.map((s) => s.trim()).filter(Boolean)
    if (!result) return run(you, [...rivals, ...typed])
    if (!typed.length) return onError('Type a rival’s site, like rivalsite.com.')
    const room = MAX_RIVALS - result.rivals.length
    if (typed.length > room) return onError(`You can add ${room} more rival${room === 1 ? '' : 's'}.`)
    const added = []
    const seen = new Set([result.you.domain, ...result.rivals.map((s) => s.domain)])
    for (const raw of typed) {
      const p = parseSite(raw)
      if (!p) return onError(`“${raw}” doesn’t look like a web address. Try rivalsite.com.`)
      if (seen.has(p.bare)) return onError(`${p.bare} is already in this check.`)
      seen.add(p.bare)
      added.push(p)
    }
    // Your site as you typed it (keeps www), from the share link.
    const site = new URLSearchParams(window.location.search).get('site') ?? result.you.domain
    setError(null)
    setResultError(null)
    onError('')
    setLoading(true)
    setPending(added.map((p) => p.bare))
    scrollToResult()
    try {
      const res = await fetch(`/api/authority-check?${new URLSearchParams({ site, add: added.map((p) => p.host).join(',') })}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data.error || !data.rivals?.length) {
        setResultError(data?.error ?? 'Something went wrong. Try again in a minute.')
        return
      }
      const merged: AuthorityResult = { ...result, checkedAt: data.checkedAt, rivals: [...result.rivals, ...data.rivals] }
      const domains = merged.rivals.map((s) => s.domain)
      setResult(merged)
      setRivals(domains)
      setMode('compare')
      setCard(null)
      window.history.replaceState(null, '', `${window.location.pathname}?${shareQuery(site, domains)}`)
      scrollToResult()
    } catch {
      setResultError('We could not reach the checker. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function openCard(domain: string) {
    setCard(domain)
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById('ac-cards')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
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
    setMode(rs.length ? 'compare' : 'solo')
    run(site, rs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const solo = !!result && result.rivals.length === 0

  return (
    <div>
      <Hero
        mode={mode}
        setMode={pickMode}
        you={you}
        setYou={setYou}
        rivals={rivals}
        setRivals={setRivals}
        onCheck={() => run(you, [])}
        onCompare={() => {
          if (!rivals.some((s) => s.trim())) {
            setError('Type a rival’s site, or use “Check my site” to check yours alone.')
            return
          }
          run(you, rivals)
        }}
        loading={loading}
        error={error}
      />
      <section aria-labelledby="ac-result" className="scroll-mt-28" ref={resultRef}>
        <div className="ac-print-tight ac-print-stack mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-10 pb-[72px] sm:px-6">
          <p className="sr-only" aria-live="polite">
            {loading
              ? `Checking ${pending.length} site${pending.length > 1 ? 's' : ''}.`
              : result
                ? `Check done for ${result.you.domain}.`
                : ''}
          </p>
          {loading && <Checking sites={pending} adding={!!result && !pending.includes(result.you.domain)} />}
          {!loading && resultError && (
            <p role="alert" className="m-0 rounded-lg border border-caution-line px-4 py-3 text-[15px] text-caution">
              {resultError}
            </p>
          )}
          {result ? (
            <div key={result.checkedAt} hidden={loading} className="ac-print-stack ac-reveal grid grid-cols-[minmax(0,1fr)] gap-10">
              <ReportHead r={result} />
              {solo ? (
                <>
                  <ReportCard r={result} site={result.you} solo />
                  {/* Nothing to compare yet when your own homepage couldn't be read. */}
                  {result.you.proof && <SoloAddRival onAdd={addRivals} loading={loading} />}
                </>
              ) : (
                <>
                  <CompareTable
                    r={result}
                    onAddRival={(v) => addRivals([v])}
                    loading={loading}
                    openDomain={card ?? result.you.domain}
                    onOpen={openCard}
                  />
                  <ReportCards r={result} open={card ?? result.you.domain} setOpen={setCard} />
                </>
              )}
            </div>
          ) : (
            !loading && (
            <Previews
              example={example}
              mode={mode}
              onPick={(m) => {
                pickMode(m)
                requestAnimationFrame(() => {
                  const el = document.getElementById('ac-site') as HTMLInputElement | null
                  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
                  el?.focus({ preventScroll: true })
                })
              }}
            />
            )
          )}
          <Offer />
          <Grow />
          <div className="ac-noprint">
            <ToolQuestions current="/authority-check" />
          </div>
          <HowWeScore />
          <Questions asOf={(result ?? example).asOf} src={authoritySource(result ?? example)} />
        </div>
      </section>
    </div>
  )
}

/* ── Solo: now add up to 3 rivals ───────────────────────────────────────── */

function SoloAddRival({
  onAdd,
  loading,
}: {
  onAdd: (values: string[], onError: (e: string) => void) => void
  loading: boolean
}) {
  const [values, setValues] = useState<string[]>([''])
  const [error, setError] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [focusNew, setFocusNew] = useState(false)
  useEffect(() => {
    if (!focusNew) return
    refs.current[values.length - 1]?.focus()
    setFocusNew(false)
  }, [focusNew, values.length])
  const INPUT_BOX =
    'h-[46px] w-full min-w-0 rounded-[4px] border border-line-strong bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none'
  return (
    <aside
      aria-labelledby="ac-solo"
      className="ac-noprint grid items-start gap-x-10 gap-y-4 rounded-xl border border-dashed border-line-strong px-6 py-5 md:grid-cols-2"
    >
      <div>
        <h2 id="ac-solo" className="m-0 mb-1 font-heading text-[20px] font-bold">
          Now add your rivals.
        </h2>
        <p className="m-0 text-body-soft">
          Your score means more next to someone you compete with. Add up to {MAX_RIVALS}; one is enough. We keep your
          result and check only the new sites.
        </p>
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onAdd(values, setError)
        }}
        className="grid gap-1.5"
      >
        {values.map((v, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5">
            <label htmlFor={`ac-solo-rival-${i}`} className="sr-only">
              Rival {i + 1}&apos;s site
            </label>
            <input
              ref={(el) => {
                refs.current[i] = el
              }}
              id={`ac-solo-rival-${i}`}
              type="text"
              inputMode="url"
              spellCheck={false}
              autoCapitalize="none"
              placeholder={i === 0 ? "a rival's site" : "another rival's site"}
              value={v}
              onChange={(e) => setValues(values.map((x, j) => (j === i ? e.target.value : x)))}
              aria-describedby={error ? 'ac-solo-error' : undefined}
              className={`${INPUT_BOX} ${i === 0 ? 'col-span-2' : ''}`}
            />
            {i > 0 && (
              <button
                type="button"
                aria-label={`Remove rival ${i + 1}`}
                onClick={() => setValues(values.filter((_, j) => j !== i))}
                className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {values.length < MAX_RIVALS ? (
            <button
              type="button"
              onClick={() => {
                setValues([...values, ''])
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
            Compare
          </button>
        </div>
        {error && (
          <p id="ac-solo-error" role="alert" className="m-0 text-sm text-caution">
            {error}
          </p>
        )}
      </form>
    </aside>
  )
}
