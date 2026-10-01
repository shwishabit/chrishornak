'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import {
  MAX_RIVALS,
  PROOF_CHECKS,
  TIE_GAP,
  TRUST_CHECKS,
  allSites,
  authorityBand,
  authorityRanks,
  firstMoves,
  isGap,
  parseSite,
  rivalLetter,
  shareQuery,
  summary,
  trustCount,
  trustRanks,
  type AuthorityResult,
  type ProofId,
  type SiteResult,
} from '@/lib/authority-check'
import { ToolQuestions } from './ToolQuestions'

/* ── Authority Check ────────────────────────────────────────────────────────
 * Hero form (Your site vs Rival, up to 3 rivals, or your site alone), then
 * the result: the answer in a sentence, the first 3 moves, one comparison
 * table (Authority · Trust, folded open on tap · Reviews, with the phrase
 * behind each ✓), the 15-minute offer, the three-questions strip and
 * "How we score". Hero look: drafts/authority-map-hero-comp.src.html.
 * ─────────────────────────────────────────────────────────────────────── */

const RIVAL_INPUT_ID = 'ac-r1'


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

const FIELD =
  'grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[4px] border bg-background pl-3'
const FIELD_LABEL = 'font-code text-[11px] font-medium tracking-[.08em] whitespace-nowrap uppercase'
const INPUT =
  'h-11 w-full min-w-0 bg-transparent pr-3 text-base text-foreground placeholder:text-[#8a8a8a] focus:outline-none'

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
      className="border-b border-border bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:24px_24px] bg-[position:-1px_-1px]"
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
            Put your site next to a rival or three. See which ones other sites link to, and which ones
            show trust and reviews on their homepage. Then the first 3 things to fix.
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
                    className="mr-1 flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-panel hover:text-foreground"
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
        <div
          className="grid gap-2.5 border-t border-primary-line pt-4 text-[13px] text-muted-foreground sm:grid-cols-3 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
          aria-label="What the tool compares"
          role="group"
        >
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Authority</b>
            Who links to you, and how strong those sites are.
          </div>
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Trust</b>
            {TRUST_CHECKS.length} things on your homepage that show a real business is behind it.
          </div>
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Reviews</b>
            Whether your homepage shows what customers say.
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── The comparison: one table, sites across the top ────────────────────
 * Authority (who links to you), Trust (7 homepage checks, folded into one
 * score that opens) and Reviews. Not added into one total: Google ranks on
 * links; the homepage checks build trust (research: drafts/research/
 * trust-signals-google-ai.md).
 * ─────────────────────────────────────────────────────────────────────── */

const DASH = 'border-dashed border-line-strong'

function Bar({ pct, me }: { pct: number; me: boolean }) {
  return (
    <span className="mt-1.5 block h-1.5 overflow-hidden rounded-[3px] bg-border" aria-hidden="true">
      <i className={`block h-full rounded-[3px] ${me ? 'bg-primary' : 'bg-[#5a5a5a]'}`} style={{ width: `${pct}%` }} />
    </span>
  )
}

function RankTag({ rank, tie }: { rank: number; tie: boolean }) {
  return (
    <small className="mt-1 block font-code text-[11px] text-muted-foreground">
      #{rank}
      {tie && <span title="About the same: under 3 points apart"> · tie</span>}
    </small>
  )
}

type Shown = { id: ProofId; index: number } | null

/** ✓ (a button that shows the phrase we found), ✕, or – when the homepage wasn't read. */
function CheckMark({
  site,
  index,
  id,
  shown,
  setShown,
}: {
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
  if (!site.proof.includes(id))
    return (
      <span className="text-[#6b6b6b]" role="img" aria-label="no">
        ✕
      </span>
    )
  const open = shown?.id === id && shown.index === index
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={`yes: show what we found on ${site.domain}`}
      onClick={() => setShown(open ? null : { id, index })}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary-deep ${
        open ? 'bg-primary-deep ring-1 ring-primary-line' : ''
      }`}
    >
      ✓
    </button>
  )
}

function CompareTable({ r }: { r: AuthorityResult }) {
  const sites = allSites(r)
  const solo = r.rivals.length === 0
  const aRanks = authorityRanks(r)
  const tRanks = trustRanks(r)
  const [openTrust, setOpenTrust] = useState(false)
  const [shown, setShown] = useState<Shown>(null)
  const nT = TRUST_CHECKS.length
  const span = sites.length + 1 + (solo ? 1 : 0)
  const reviews = PROOF_CHECKS.find((c) => c.group === 'reviews')!
  const failed = r.rivals.filter((s) => s.pageError)

  const td = (i: number, extra = '') =>
    `border-t border-border px-1.5 py-3 text-center align-top sm:px-3.5 ${i === 0 ? 'bg-primary-deep' : ''} ${extra}`
  const rowHead = 'border-t border-border px-2.5 py-3 text-left align-top font-medium sm:px-3.5'
  const addCell = solo ? <td className={`border-t border-l border-border ${DASH}`} /> : null

  const groupRow = (title: string, sub: string, id: string, how: string) => (
    <tr>
      <th id={id} scope="colgroup" colSpan={span} className="border-t border-line-strong px-2.5 pt-5 pb-2 text-left sm:px-3.5">
        <span className="font-heading text-[17px] font-bold">{title}</span>
        <span className="ml-2 text-[13px] font-normal text-muted-foreground">{sub}</span>
        <span className="mt-1 block max-w-[80ch] text-[13px] font-normal text-body-soft">
          <b className="font-semibold text-foreground">How to grow it:</b> {how}
        </span>
      </th>
    </tr>
  )

  const evidenceRow = (id: ProofId) => {
    if (!shown || shown.id !== id) return null
    const site = sites[shown.index]
    return (
      <tr>
        <td colSpan={span} className="px-2.5 pb-3 sm:px-3.5">
          <p className="m-0 flex items-start justify-between gap-3 rounded-md border border-primary-line bg-primary-deep px-3 py-2 text-[13px]">
            <span className="min-w-0 [overflow-wrap:anywhere]">
              <b className="font-semibold text-foreground">{site.domain}:</b>{' '}
              <span className="text-body-soft">{site.evidence?.[id] ?? 'Found on the homepage.'}</span>
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
    )
  }

  const checkRow = (c: (typeof PROOF_CHECKS)[number]) => (
    <Fragment key={c.id}>
      <tr>
        <th scope="row" className={rowHead}>
          {c.label}
          {isGap(r, c.id) && (
            <span className="mt-1 block w-max rounded-full border border-caution-line px-[7px] py-px font-code text-[10px] font-medium tracking-[.08em] text-caution uppercase sm:mt-0 sm:ml-2 sm:inline-block sm:align-[2px]">
              Your gap
            </span>
          )}
          <small className="hidden text-xs font-normal text-muted-foreground sm:block">{c.small}</small>
        </th>
        {sites.map((s, i) => (
          <td key={s.domain} className={td(i)}>
            <CheckMark site={s} index={i} id={c.id} shown={shown} setShown={setShown} />
          </td>
        ))}
        {addCell}
      </tr>
      {evidenceRow(c.id)}
    </Fragment>
  )

  return (
    <section aria-labelledby="ac-ct" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="ac-ct" className="m-0 font-heading text-[22px] font-bold">
          How do you compare?
        </h2>
        <p className="m-0 max-w-[60ch] text-body-soft">Tap a ✓ to see what we found on that homepage.</p>
      </div>
      {r.linksStatus !== 'ok' && (
        <p className="m-0 mb-3 rounded-md border border-dashed border-caution-line px-3 py-3 text-sm text-caution">
          {r.linksStatus === 'busy'
            ? 'Authority scores are busy, try again in a minute. Your trust and reviews results are below.'
            : 'Authority scores are not available right now. Your trust and reviews results are below.'}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border bg-panel">
        <table className="w-full table-fixed border-collapse text-[15px] tabular-nums">
          <caption className="sr-only">Authority, trust and reviews for each site</caption>
          <colgroup>
            <col className="w-[34%] sm:w-[30%]" />
            {sites.map((s) => (
              <col key={s.domain} />
            ))}
            {solo && <col />}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="px-2.5 py-3 sm:px-3.5">
                <span className="sr-only">Check</span>
              </th>
              {sites.map((s, i) => (
                <th
                  key={s.domain}
                  scope="col"
                  className={`px-1.5 py-3 text-center align-bottom font-code text-xs font-medium tracking-[.08em] uppercase sm:px-3.5 ${
                    i === 0 ? 'bg-primary-deep text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {i === 0 ? (
                    'You'
                  ) : (
                    <>
                      <span className="hidden sm:inline">Rival </span>
                      {rivalLetter(i)}
                    </>
                  )}
                  <span className="mx-auto mt-1 hidden max-w-[16ch] truncate text-[11px] tracking-normal normal-case text-muted-foreground sm:block">
                    {s.domain}
                  </span>
                </th>
              ))}
              {solo && (
                <th scope="col" className={`border-l ${DASH} px-1.5 py-2 sm:px-3.5`}>
                  <button
                    type="button"
                    onClick={focusRival}
                    className={`rounded border ${DASH} px-2 py-1.5 font-sans text-[13px] font-medium text-body-soft normal-case hover:border-primary-line hover:text-foreground`}
                  >
                    <span className="mr-1 text-primary" aria-hidden="true">
                      +
                    </span>
                    Add a rival
                  </button>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {groupRow('Authority', 'Who links to you', 'ac-g-auth', "Get other sites to mention and link to you: local news, partners, suppliers, associations. That's called digital PR. It takes months.")}
            <tr>
              <th scope="row" className={rowHead}>
                Authority score
                <small className="block text-xs font-normal text-muted-foreground">out of 100</small>
              </th>
              {sites.map((s, i) => {
                const rank = aRanks.get(i)
                return (
                  <td key={s.domain} className={td(i)}>
                    {r.linksStatus !== 'ok' ? (
                      <span className="font-code text-muted-foreground">–</span>
                    ) : s.links === null ? (
                      <>
                        <span className="font-code text-muted-foreground">–</span>
                        <small className="block text-xs text-muted-foreground">No score yet</small>
                      </>
                    ) : (
                      <>
                        <span className="font-code">{s.links}</span>
                        <small className="block text-xs leading-snug text-body-soft">{authorityBand(s.links).label}</small>
                        <Bar pct={rank?.pct ?? 0} me={i === 0} />
                        {!solo && rank && <RankTag rank={rank.rank} tie={rank.tie} />}
                      </>
                    )}
                  </td>
                )
              })}
              {addCell}
            </tr>
            <tr>
              <th scope="row" className={rowHead}>
                Sites linking here
              </th>
              {sites.map((s, i) => (
                <td key={s.domain} className={td(i, 'font-code')}>
                  {r.linksStatus === 'ok' && typeof s.linkingSites === 'number' ? (
                    s.linkingSites.toLocaleString('en-US')
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </td>
              ))}
              {addCell}
            </tr>
          </tbody>

          <tbody>
            {groupRow('Trust', 'What your homepage shows', 'ac-g-trust', 'Fix the gaps on your homepage. Your first moves above show where to start.')}
            <tr>
              <th scope="row" className={rowHead}>
                Trust score
                <small className="block text-xs font-normal text-muted-foreground">out of {nT}</small>
                <button
                  type="button"
                  aria-expanded={openTrust}
                  aria-controls="ac-trust-rows"
                  onClick={() => setOpenTrust(!openTrust)}
                  className="mt-2 rounded-full border border-line-strong px-2.5 py-1 font-sans text-xs font-medium text-body-soft hover:border-primary-line hover:text-foreground"
                >
                  {openTrust ? 'Hide the checks' : `Show the ${nT} checks`}
                </button>
              </th>
              {sites.map((s, i) => {
                const count = trustCount(s)
                const rank = tRanks.get(i)
                return (
                  <td key={s.domain} className={td(i)}>
                    {count === null ? (
                      <>
                        <span className="font-code text-muted-foreground">–</span>
                        <small className="block text-xs text-muted-foreground">Couldn&apos;t read</small>
                      </>
                    ) : (
                      <>
                        <span className="font-code whitespace-nowrap">
                          {count}
                          <span className="text-muted-foreground"> of {nT}</span>
                        </span>
                        <Bar pct={Math.round((count / nT) * 100)} me={i === 0} />
                        {!solo && rank && <RankTag rank={rank.rank} tie={rank.tie} />}
                      </>
                    )}
                  </td>
                )
              })}
              {addCell}
            </tr>
          </tbody>
          <tbody id="ac-trust-rows" hidden={!openTrust}>
            {TRUST_CHECKS.map(checkRow)}
          </tbody>

          <tbody>
            {groupRow('Reviews', 'What customers say', 'ac-g-rev', 'Ask happy customers for a review, then put the best ones on your homepage, with names.')}
            {checkRow(reviews)}
          </tbody>
        </table>
      </div>
      {!solo && (
        <p className="mt-2.5 text-[13px] text-muted-foreground sm:hidden">
          {r.rivals.map((s, k) => `${rivalLetter(k + 1)}: ${s.domain}`).join(' · ')}
        </p>
      )}
      {failed.length > 0 && (
        <ul className="mt-2.5 list-none p-0 text-[13px] text-caution">
          {failed.map((s) => (
            <li key={s.domain}>{s.pageError} Its trust and reviews show as “–”.</li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ── How we score (end of the page) ─────────────────────────────────────── */

function HowWeScore({ asOf }: { asOf: string | null }) {
  const item = 'border-t border-line-strong pt-4'
  const lower = (s: string) => s[0].toLowerCase() + s.slice(1)
  return (
    <section aria-labelledby="ac-hs" className="border-t border-border pt-10">
      <h2 id="ac-hs" className="m-0 mb-2 font-heading text-[22px] font-bold">
        How we score
      </h2>
      <p className="m-0 mb-6 max-w-[70ch] text-body-soft">
        Authority and Trust are named after two of the letters in E-E-A-T, the guide Google gives the people who
        check its search results. Google ranks pages on links. The homepage checks are what those reviewers, and
        your visitors, look for.
      </p>
      <dl className="m-0 grid gap-8 md:grid-cols-3">
        <div className={item}>
          <dt className="mb-2 font-heading text-[17px] font-bold">Authority, out of 100</dt>
          <dd className="m-0 grid gap-2 text-[15px] text-body-soft">
            <p className="m-0">
              When another website links to yours, it is a vote of trust. Votes from well-known sites count for more.
              We add up the votes and show a score out of 100. Google says links are still part of how it ranks
              pages.
            </p>
            <p className="m-0">
              New and small sites usually score under 20. That is normal for a small business. Typical active sites
              score 20 to 49, well-established sites 50 to 79, and the biggest sites on the web 80 and up.
            </p>
            <p className="m-0">
              &ldquo;Sites linking here&rdquo; counts the different websites that link to you. Spammy and tiny sites
              count for less, and the count comes from a public map of the web that can miss a few.
            </p>
          </dd>
        </div>
        <div className={item}>
          <dt className="mb-2 font-heading text-[17px] font-bold">Trust, out of {TRUST_CHECKS.length}</dt>
          <dd className="m-0 grid gap-2 text-[15px] text-body-soft">
            <p className="m-0">
              {TRUST_CHECKS.length} things on a homepage that show a real business is behind it:{' '}
              {TRUST_CHECKS.map((c) => lower(c.label)).join(', ')}.
            </p>
            <p className="m-0">
              They build trust with the people who visit. Google tells its reviewers to look for most of them, but
              says they are not a direct ranking score. A secure site is the one Google has called a small ranking
              signal.
            </p>
          </dd>
        </div>
        <div className={item}>
          <dt className="mb-2 font-heading text-[17px] font-bold">Reviews</dt>
          <dd className="m-0 grid gap-2 text-[15px] text-body-soft">
            <p className="m-0">Whether your homepage shows what customers say about you.</p>
            <p className="m-0">
              Google&apos;s reviewers are told to trust what others say about a business more than what a site says
              about itself, so reviews on other sites, like your Google Business Profile, matter too.
            </p>
          </dd>
        </div>
      </dl>
      <div className="mt-8 grid gap-1.5 text-[13px] text-muted-foreground">
        <p className="m-0">
          <b className="font-semibold text-body-soft">“Tie”</b> means about the same. Authority scores move a few
          points every month, so sites less than {TIE_GAP} points apart share a rank instead of one winning.
        </p>
        <p className="m-0">
          We read each homepage once, with the same rules as{' '}
          <a href="/audit" className="text-primary underline underline-offset-[3px]">
            the Findability Check
          </a>
          . Tap a ✓ to see the words we matched.
        </p>
        <p className="m-0 font-code text-xs">
          Authority data: Open PageRank, built from Common Crawl&apos;s map of the web.
          {asOf && ` As of ${asOf}.`} Updated about once a month.
        </p>
      </div>
    </section>
  )
}

/* ── First moves ────────────────────────────────────────────────────────── */

function Moves({ r }: { r: AuthorityResult }) {
  const moves = firstMoves(r)
  const title = moves.length === 3 ? 'Your first 3 moves' : moves.length === 1 ? 'Your first move' : 'Your first moves'
  return (
    <section aria-labelledby="ac-fm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="ac-fm" className="m-0 font-heading text-[22px] font-bold">
          {title}
        </h2>
        {moves.length > 0 && (
          <p className="m-0 max-w-[60ch] text-body-soft">
            Authority takes months to earn. {moves.length === 1 ? 'This one is' : 'These are'} on your own homepage,
            so you can do {moves.length === 1 ? 'it' : 'them'} this week.
          </p>
        )}
      </div>
      {moves.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-[18px]">
          <p className="m-0 font-heading text-[17px] font-bold">Your homepage shows every check we read.</p>
          <p className="m-0 mt-2 text-[15px] text-body-soft">
            Nothing to add here. For the full list,{' '}
            <a href="/audit" className="text-primary underline underline-offset-[3px]">
              run the Findability Check
            </a>
            .
          </p>
        </div>
      ) : (
        <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {moves.map((m, i) => (
            <li key={m.id} className="grid content-start gap-2 rounded-lg border border-border bg-panel p-[18px]">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border border-caution-line font-code text-[13px] text-caution"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <b className="font-heading text-[17px]">{m.title}</b>
              <span className="text-[15px] text-body-soft">{m.body}</span>
              {m.who && <small className="font-code text-xs text-muted-foreground">{m.who}</small>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/* ── Solo: now add a rival ──────────────────────────────────────────────── */

function AddRival({ onCompare, loading }: { onCompare: (rival: string) => void; loading: boolean }) {
  const [value, setValue] = useState('')
  return (
    <aside
      aria-labelledby="ac-solo"
      className="grid items-center gap-x-10 gap-y-5 rounded-[10px] border border-dashed border-line-strong px-7 py-6 md:grid-cols-2"
    >
      <div>
        <h2 id="ac-solo" className="m-0 mb-1.5 font-heading text-[22px] font-bold">
          Now add a rival.
        </h2>
        <p className="m-0 text-body-soft">Your scores mean more next to someone you compete with. One rival is enough.</p>
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onCompare(value)
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
          className="h-[46px] min-w-0 rounded-[4px] border border-line-strong bg-background px-3 text-base text-foreground placeholder:text-[#8a8a8a] focus:border-primary focus:outline-none"
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

/* ── Offer + the three questions ────────────────────────────────────────── */

function Offer() {
  return (
    <aside
      aria-labelledby="ac-offer"
      className="grid items-center gap-x-10 gap-y-6 rounded-[10px] border border-primary-line bg-primary-deep p-7 md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <p className="mb-2.5 font-code text-xs tracking-[.12em] text-primary uppercase">15 minutes · free</p>
        <h2 id="ac-offer" className="mb-2 font-heading text-[26px] leading-[1.15] font-bold tracking-[-.015em] text-balance">
          Read your results with me.
        </h2>
        <p className="m-0 max-w-[60ch] text-body-soft">
          We look at your table together. Then we pick the one move that matters most for your business,
          and why.
        </p>
      </div>
      <div className="grid justify-items-start gap-3">
        <button
          type="button"
          data-cal-link="chris-hornak/authority"
          data-cal-namespace="authority-check"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
          className="rounded-full bg-primary px-[22px] py-[13px] font-semibold whitespace-nowrap text-primary-foreground"
        >
          Book 15 minutes
        </button>
        <p className="m-0 text-[13px] text-muted-foreground">
          Or{' '}
          <a href="/audit" className="text-muted-foreground underline underline-offset-[3px] hover:text-foreground">
            run the Findability Check
          </a>{' '}
          for the full list.
        </p>
      </div>
    </aside>
  )
}

/* ── Result: the answer in a sentence, the moves, then the evidence ─────── */

function Result({ r, example }: { r: AuthorityResult; example: boolean }) {
  const n = r.rivals.length
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-11">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          {example ? (
            <span className="rounded-[2px] border border-dashed border-[#3a3a3a] px-2 py-1 font-code text-[11px] font-medium tracking-[.1em] text-muted-foreground uppercase">
              Example · {fmtDate(r.checkedAt)}
            </span>
          ) : (
            <span className="rounded-[2px] border border-primary-line px-2 py-1 font-code text-[11px] font-medium tracking-[.1em] text-primary uppercase">
              Your check
            </span>
          )}
          <span className="font-code text-sm break-all text-[#cfcfcf]">
            {r.you.domain} {n === 0 ? 'alone' : `vs ${n} rival${n > 1 ? 's' : ''}`}
            {example && <span className="text-muted-foreground"> · works with 0 to {MAX_RIVALS}</span>}
          </span>
        </div>
        <h2 id="ac-result" className="m-0 max-w-[36ch] font-heading text-[22px] leading-snug font-bold text-balance sm:text-[26px]">
          {summary(r).join(' ')}
        </h2>
      </div>
      <Moves r={r} />
      <CompareTable r={r} />
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
  const resultRef = useRef<HTMLElement>(null)

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
  const soloResult = !!result && result.rivals.length === 0

  return (
    <>
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
        <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-11 px-4 pt-10 pb-[72px] sm:px-6">
          <p className="sr-only" aria-live="polite">
            {loading
              ? `Checking ${pending} site${pending > 1 ? 's' : ''}.`
              : result
                ? `Check done for ${result.you.domain}.`
                : ''}
          </p>
          <div className={loading ? 'opacity-50 transition-opacity' : undefined}>
            <Result r={shown} example={!result} />
          </div>
          {soloResult && (
            <AddRival
              loading={loading}
              onCompare={(rival) => {
                setRivals([rival, ...rivals.slice(1)])
                run(you, [rival])
              }}
            />
          )}
          <Offer />
          <ToolQuestions current="/authority-check" />
          <HowWeScore asOf={shown.asOf} />
        </div>
      </section>
    </>
  )
}
