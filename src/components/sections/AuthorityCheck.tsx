'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MAX_RIVALS,
  PROOF_CHECKS,
  TIE_GAP,
  firstMoves,
  isGap,
  linksVerdict,
  parseSite,
  proofVerdict,
  rankLinks,
  rankProof,
  rivalLetter,
  shareQuery,
  type AuthorityResult,
  type RankRow,
  type SiteResult,
} from '@/lib/authority-check'

/* ── Authority Check ────────────────────────────────────────────────────────
 * Hero form (Your site vs Rival, up to 3 rivals, or your site alone), then
 * the result: two ranked lists (Links, Proof) beside the "How we score"
 * sheet, the proof table, the first 3 moves, the 15-minute offer and the
 * three-questions strip. Look locked in drafts/authority-map-hero-comp.src.html.
 * ─────────────────────────────────────────────────────────────────────── */

const RIVAL_INPUT_ID = 'ac-r1'

function siteName(index: number): string {
  return index === 0 ? 'You' : `Rival ${rivalLetter(index)}`
}

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
            show proof on their homepage. Then the first 3 things to fix.
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
                  placeholder="a rival's site"
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
            It reads each homepage once and asks Open PageRank for the link scores.
          </p>
        </div>
        <div
          className="grid gap-2.5 border-t border-primary-line pt-4 text-[13px] text-muted-foreground sm:grid-cols-3 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
          aria-label="What the tool compares"
          role="group"
        >
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Links</b>
            How many other sites link to you, scored by Open PageRank.
          </div>
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Proof</b>7
            things on your homepage that show you are real.
          </div>
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">
              First moves
            </b>
            What your rivals show that you don&apos;t.
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Ranked lists ───────────────────────────────────────────────────────── */

function Row({ row, rank, value, note }: { row: { site: SiteResult; index: number; pct?: number }; rank: string; value: string; note?: string }) {
  const me = row.index === 0
  return (
    <div
      className={`grid grid-cols-[1.6em_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 rounded-md border px-3 py-2.5 ${
        me ? 'border-primary-line bg-primary-deep' : 'border-border bg-well'
      }`}
    >
      <span className="row-span-2 self-start pt-px font-code text-[13px] text-muted-foreground">{rank}</span>
      <span className={`truncate text-[15px] font-semibold ${me ? 'text-primary' : ''}`} title={row.site.domain}>
        {row.site.domain}
        {me && <span className="sr-only"> (your site)</span>}
      </span>
      <span className={`font-code text-sm tabular-nums ${note ? 'text-muted-foreground' : ''}`}>{value}</span>
      <span className="col-span-2 h-1.5 overflow-hidden rounded-[3px] bg-border">
        {row.pct !== undefined && (
          <i
            className={`block h-full rounded-[3px] ${me ? 'bg-primary' : 'bg-[#5a5a5a]'}`}
            style={{ width: `${row.pct}%` }}
          />
        )}
      </span>
      {note && <span className="col-span-2 col-start-2 text-xs text-muted-foreground">{note}</span>}
    </div>
  )
}

function AddSlot() {
  return (
    <li>
      <button
        type="button"
        onClick={focusRival}
        className="w-full rounded-md border border-dashed border-line-strong px-3 py-3.5 text-left text-sm font-medium text-body-soft hover:border-primary-line hover:text-foreground"
      >
        <span className="mr-1 text-primary" aria-hidden="true">
          +
        </span>
        Add a rival
      </button>
    </li>
  )
}

function RankCard({ id, title, sub, children }: { id: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-lg border border-border bg-panel p-[18px]">
      <h3 id={id} className="m-0 mb-0.5 font-heading text-[17px] font-bold">
        {title}
      </h3>
      <p className="m-0 mb-3.5 text-[13px] text-muted-foreground">{sub}</p>
      {children}
    </section>
  )
}

function LinksList({ r }: { r: AuthorityResult }) {
  if (r.linksStatus !== 'ok') {
    return (
      <RankCard id="ac-links" title="Links" sub="Open PageRank, out of 100">
        <p className="m-0 rounded-md border border-dashed border-caution-line px-3 py-3 text-sm text-caution">
          {r.linksStatus === 'busy'
            ? 'Link scores are busy, try again in a minute. Your proof results are below.'
            : 'Link scores are not available right now. Your proof results are below.'}
        </p>
      </RankCard>
    )
  }
  const { groups, missing } = rankLinks(r)
  return (
    <RankCard id="ac-links" title="Links" sub="Open PageRank, out of 100">
      <ol className="m-0 grid list-none gap-2 p-0">
        {groups.map((g) =>
          g.rows.length > 1 ? (
            <li
              key={g.rank}
              className="relative grid gap-1.5 rounded-lg border border-dashed border-line-strong px-1.5 pt-[26px] pb-1.5"
              aria-label={`About the same: ${g.rows.map((row) => row.site.domain).join(' and ')}`}
            >
              <span className="absolute top-1.5 left-2.5 font-code text-[11px] font-medium tracking-[.08em] text-muted-foreground uppercase">
                About the same
              </span>
              {g.rows.map((row: RankRow) => (
                <Row key={row.index} row={row} rank={String(g.rank)} value={String(row.value)} />
              ))}
            </li>
          ) : (
            <li key={g.rank}>
              <Row row={g.rows[0]} rank={String(g.rank)} value={String(g.rows[0].value)} />
            </li>
          ),
        )}
        {missing.map((m) => (
          <li key={m.index}>
            <Row row={m} rank="–" value="–" note="No link data yet" />
          </li>
        ))}
        {r.rivals.length === 0 && <AddSlot />}
      </ol>
    </RankCard>
  )
}

function ProofList({ r }: { r: AuthorityResult }) {
  const { rows, unread } = rankProof(r)
  return (
    <RankCard id="ac-proof" title="Proof" sub={`Found on the homepage, out of ${PROOF_CHECKS.length}`}>
      <ol className="m-0 grid list-none gap-2 p-0">
        {rows.map((row) => (
          <li key={row.index}>
            <Row row={row} rank={String(row.rank)} value={String(row.value)} />
          </li>
        ))}
        {unread.map((u) => (
          <li key={u.index}>
            <Row row={u} rank="–" value="–" note="Couldn't read this homepage" />
          </li>
        ))}
        {r.rivals.length === 0 && <AddSlot />}
      </ol>
    </RankCard>
  )
}

/* ── How we score ───────────────────────────────────────────────────────── */

function Sheet({ asOf }: { asOf: string | null }) {
  return (
    <aside aria-labelledby="ac-hs" className="rounded-md border border-border bg-panel">
      <h3
        id="ac-hs"
        className="m-0 border-b border-border px-[18px] py-3.5 font-code text-xs font-medium tracking-[.1em] text-muted-foreground uppercase"
      >
        How we score
      </h3>
      <dl className="m-0">
        <div className="border-b border-border px-[18px] py-3.5">
          <dt className="mb-1 text-sm font-semibold">Links</dt>
          <dd className="m-0 text-sm text-body-soft">
            Open PageRank&apos;s score, built from the links between sites in Common Crawl. They score 0 to 10.
            We show it out of 100, so 0.96 reads as 10. It is not Moz DA, and it is not a Google ranking factor.
          </dd>
          <small className="mt-1.5 block font-code text-xs text-muted-foreground">
            Link data: Open PageRank, derived from Common Crawl.
            {asOf && ` Data as of ${asOf}.`} Updates about monthly.
          </small>
        </div>
        <div className="border-b border-border px-[18px] py-3.5">
          <dt className="mb-1 text-sm font-semibold">About the same</dt>
          <dd className="m-0 text-sm text-body-soft">
            Small sites&apos; link scores move a few points from month to month. A gap under {TIE_GAP} points
            shows as a tie, not a win.
          </dd>
        </div>
        <div className="px-[18px] py-3.5">
          <dt className="mb-1 text-sm font-semibold">Proof</dt>
          <dd className="m-0 text-sm text-body-soft">
            {PROOF_CHECKS.length} checks from the Findability Check, read from each homepage&apos;s text and code.
          </dd>
          <small className="mt-1.5 block font-code text-xs text-muted-foreground">
            Same rules as{' '}
            <a href="/audit" className="underline decoration-line-strong underline-offset-[3px] hover:text-primary">
              the Findability Check
            </a>
          </small>
        </div>
      </dl>
    </aside>
  )
}

/* ── Proof table ────────────────────────────────────────────────────────── */

function Mark({ found }: { found: boolean | null }) {
  if (found === null)
    return (
      <span className="text-muted-foreground" role="img" aria-label="not read">
        –
      </span>
    )
  return found ? (
    <span className="text-primary" role="img" aria-label="yes">
      ✓
    </span>
  ) : (
    <span className="text-[#6b6b6b]" role="img" aria-label="no">
      ✕
    </span>
  )
}

function ProofTable({ r }: { r: AuthorityResult }) {
  const sites = [r.you, ...r.rivals]
  const solo = r.rivals.length === 0
  const failed = r.rivals.filter((s) => s.pageError)
  return (
    <section aria-labelledby="ac-pt">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 id="ac-pt" className="m-0 font-heading text-[22px] font-bold">
          What does each site show?
        </h2>
        <p className="m-0 max-w-[60ch] text-body-soft">
          {solo
            ? 'Add a rival to see which of these they show and you don’t.'
            : 'Rows marked “Your gap” are proof your rivals show and you don’t.'}
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-[15px] tabular-nums">
          <thead>
            <tr>
              <th scope="col" className="bg-panel px-2 py-3 sm:px-3.5">
                <span className="sr-only">Check</span>
              </th>
              {sites.map((s, i) => (
                <th
                  key={s.domain}
                  scope="col"
                  className={`bg-panel px-2 py-3 text-center align-bottom font-code text-xs font-medium tracking-[.08em] uppercase sm:px-3.5 ${
                    i === 0 ? 'text-primary' : 'text-muted-foreground'
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
                <th scope="col" className="bg-panel px-2 py-2 sm:px-3.5">
                  <button
                    type="button"
                    onClick={focusRival}
                    className="rounded border border-dashed border-line-strong px-2.5 py-1.5 font-sans text-[13px] font-medium whitespace-nowrap text-body-soft normal-case hover:border-primary-line hover:text-foreground"
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
            {PROOF_CHECKS.map((c) => {
              const gap = isGap(r, c.id)
              return (
                <tr key={c.id} className="border-t border-border">
                  <th scope="row" className="px-2 py-3 text-left font-medium sm:px-3.5">
                    {c.label}
                    {gap && (
                      <span className="mt-1 block w-max rounded-full border border-caution-line px-[7px] py-px font-code text-[10px] font-medium tracking-[.08em] text-caution uppercase sm:mt-0 sm:ml-2 sm:inline-block sm:align-[2px]">
                        Your gap
                      </span>
                    )}
                    <small className="hidden text-xs font-normal text-muted-foreground sm:block">{c.small}</small>
                  </th>
                  {sites.map((s, i) => (
                    <td key={s.domain} className={`px-2 py-3 text-center sm:px-3.5 ${i === 0 ? 'bg-primary-deep' : ''}`}>
                      <Mark found={s.proof ? s.proof.includes(c.id) : null} />
                    </td>
                  ))}
                  {solo && <td className="border-l border-dashed border-line-strong" />}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-panel font-code text-[13px] text-muted-foreground">
              <th scope="row" className="px-2 py-3 text-left font-normal sm:px-3.5">
                Proof found
              </th>
              {sites.map((s, i) => (
                <td
                  key={s.domain}
                  className={`px-2 py-3 text-center text-xs whitespace-nowrap sm:px-3.5 sm:text-[13px] ${i === 0 ? 'text-primary' : ''}`}
                >
                  {s.proof ? `${s.proof.length} of ${PROOF_CHECKS.length}` : 'Not read'}
                </td>
              ))}
              {solo && <td className="border-l border-dashed border-line-strong" />}
            </tr>
          </tfoot>
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
            <li key={s.domain}>{s.pageError} Its proof shows as “–”.</li>
          ))}
        </ul>
      )}
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
            Links take months to earn. {moves.length === 1 ? 'This one is' : 'These are'} on your own page, so you
            can do {moves.length === 1 ? 'it' : 'them'} this week.
          </p>
        )}
      </div>
      {moves.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-[18px]">
          <p className="m-0 font-heading text-[17px] font-bold">You show all {PROOF_CHECKS.length}.</p>
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
          data-cal-link="chris-hornak/authority-check"
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

const QUESTIONS = [
  { q: 'Can your website be found?', tool: 'Findability Check', href: '/audit' },
  { q: 'What do people see first?', tool: 'OG Image Checker', href: '/og-image-checker' },
]

function Questions() {
  return (
    <nav aria-label="Three free checks">
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
        {QUESTIONS.map((x, i) => (
          <li key={x.href} className="grid gap-0.5 border-t border-line-strong pt-3">
            <span className="font-code text-xs text-muted-foreground">{i + 1}</span>
            <a href={x.href} className="group no-underline">
              <b className="font-heading text-base group-hover:underline group-hover:underline-offset-[3px]">{x.q}</b>
            </a>
            <small className="text-[13px] text-muted-foreground">{x.tool}</small>
          </li>
        ))}
        <li className="grid gap-0.5 border-t border-primary pt-3" aria-current="page">
          <span className="font-code text-xs text-muted-foreground">3</span>
          <b className="font-heading text-base text-primary">How do you stack up?</b>
          <small className="text-[13px] text-muted-foreground">You are here</small>
        </li>
      </ol>
    </nav>
  )
}

/* ── Result ─────────────────────────────────────────────────────────────── */

function Verdict({ r }: { r: AuthorityResult }) {
  const links = linksVerdict(r)
  const proof = proofVerdict(r)
  const Part = ({ v }: { v: { text: string; good: boolean } }) =>
    v.good ? <em className="text-primary not-italic">{v.text}</em> : <i className="text-caution not-italic">{v.text}</i>
  return (
    <h2 id="ac-result" className="m-0 w-full font-heading text-[22px] font-bold lg:ml-auto lg:w-auto">
      {links &&
        (r.you.links === null ? (
          <>
            <Part v={links} /> for your site yet.{' '}
          </>
        ) : (
          <>
            <Part v={links} /> on links.{' '}
          </>
        ))}
      <Part v={proof} /> on proof.
    </h2>
  )
}

function Result({ r, example }: { r: AuthorityResult; example: boolean }) {
  const n = r.rivals.length
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-11">
      <div>
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2.5">
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
          <Verdict r={r} />
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="grid gap-5 sm:grid-cols-2">
            <LinksList r={r} />
            <ProofList r={r} />
          </div>
          <Sheet asOf={r.asOf} />
        </div>
      </div>
      <ProofTable r={r} />
      <Moves r={r} />
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
          <Questions />
        </div>
      </section>
    </>
  )
}
