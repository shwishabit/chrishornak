'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { LINK_CARDS, PREVIEW_GROUNDS, type PreviewTabId } from '@/components/blog/SharePreviewTabs'
import {
  buildTagBlock,
  compareTitleToH1,
  isArticle,
  tagBlockText,
  type CheckRow,
  type CheckStatus,
  type OgCheckResult,
} from '@/lib/og-check'

/* ── OG image checker (Direction C, "The Proof") ────────────────────────────
 * Hero form, then the result bench: the measured image beside a cited spec
 * sheet, the fix list + tag block, two things only a person can judge, and
 * the free card offer. Look locked in drafts/og-checker-hero-comp.src.html.
 * ─────────────────────────────────────────────────────────────────────── */

type ResultTab = 'measure' | PreviewTabId

const RESULT_TABS: { id: ResultTab; label: string }[] = [
  { id: 'measure', label: 'Measured' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'sms', label: 'Text message' },
]

function normalize(input: string): string | null {
  const cleaned = input.trim()
  if (cleaned.length < 4) return null
  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
  try {
    const u = new URL(withProtocol)
    return u.hostname.includes('.') ? u.toString() : null
  } catch {
    return null
  }
}

function shortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')
}

/** The src the previews draw: the real bytes from the check, or the example's local file. */
function imageSrc(r: OgCheckResult, exampleImage?: string): string | null {
  if (exampleImage) return exampleImage
  return r.image?.dataUri ?? null
}

function emptyImageLabel(r: OgCheckResult): string {
  if (!r.tags.image) return 'No share image on this page'
  if (r.image?.tooBigToShow) return 'Image too big to show here'
  return 'The image did not load'
}

/* ── Status marks ───────────────────────────────────────────────────────── */

const STATUS_MARK: Record<CheckStatus, { glyph: string; label: string; cls: string }> = {
  pass: { glyph: '✓', label: 'Pass', cls: 'text-primary' },
  warn: { glyph: '!', label: 'Worth fixing', cls: 'text-caution' },
  fail: { glyph: '✕', label: 'Fail', cls: 'text-danger' },
  skip: { glyph: '–', label: 'Could not run', cls: 'text-muted-foreground' },
}

function Mark({ status }: { status: CheckStatus }) {
  const m = STATUS_MARK[status]
  return (
    <span className={`text-sm font-semibold ${m.cls}`} role="img" aria-label={m.label}>
      {m.glyph}
    </span>
  )
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero({
  value,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  loading: boolean
  error: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <section
      className="border-b border-border bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:24px_24px] bg-[position:-1px_-1px]"
      aria-labelledby="og-h1"
    >
      <div className="mx-auto grid max-w-[1200px] gap-7 px-4 pt-32 pb-10 sm:px-6 md:pt-40 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end lg:gap-12 lg:pb-14">
        <div>
          <p className="mb-[18px] font-code text-xs tracking-[.12em] text-primary uppercase">
            Free tool · No sign-up
          </p>
          <h1
            id="og-h1"
            className="mb-5 max-w-[16ch] font-heading text-[clamp(34px,5vw,60px)] leading-[1.05] font-bold tracking-[-.025em] text-balance"
          >
            OG image checker.{' '}
            <span className="font-semibold text-muted-foreground">See your link before you share it.</span>
          </h1>
          <p className="mb-7 max-w-[56ch] text-base text-body-soft sm:text-lg">
            Paste a link. See how it looks on Facebook, LinkedIn, X and in a text message, and what
            to fix. Every check shows its source.
          </p>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit()
            }}
            className="flex max-w-[640px] flex-col gap-1.5 rounded-md border border-field-edge bg-field p-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(45,212,168,.18)] sm:flex-row"
          >
            <label htmlFor="og-url" className="sr-only">
              Page address
            </label>
            <div className="relative flex min-w-0 flex-1 items-center">
              <input
                ref={inputRef}
                id="og-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="yoursite.com/page"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-describedby={error ? 'og-error' : 'og-hint'}
                aria-invalid={error ? true : undefined}
                className="h-12 w-full min-w-0 bg-transparent pr-11 pl-3 text-base text-foreground placeholder:text-[#8a8a8a] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {value && (
                <button
                  type="button"
                  aria-label="Clear the address"
                  onClick={() => {
                    onChange('')
                    inputRef.current?.focus()
                  }}
                  className="absolute right-1 flex h-10 w-10 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-[4px] border border-primary bg-primary px-[22px] font-code text-[13px] font-semibold tracking-[.08em] whitespace-nowrap text-primary-foreground uppercase disabled:opacity-70"
            >
              {loading ? 'Checking…' : 'Check my link'}
            </button>
          </form>
          {error ? (
            <p id="og-error" role="alert" className="mt-3 max-w-[640px] text-sm text-caution">
              {error}
            </p>
          ) : (
            <p id="og-hint" className="mt-3 text-[13px] text-muted-foreground">
              It reads the page once and the image once. Nothing to install.
            </p>
          )}
        </div>
        <div
          className="grid gap-2.5 border-t border-primary-line pt-4 text-[13px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5"
          aria-label="What the checker measures"
          role="group"
        >
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Size + shape</b>
            Pixels and ratio against Meta and LinkedIn.
          </div>
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Stress test</b>
            A centered square, so words near the edge show.
          </div>
          <div>
            <b className="block font-code text-xs font-medium tracking-[.06em] text-foreground uppercase">Tags</b>
            The four Open Graph tags, plus the image alt.
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Measured view: the real image with the square + safe margin drawn on ─ */

function Measured({ r, src }: { r: OgCheckResult; src: string | null }) {
  const maskId = useId().replace(/:/g, '')
  // Safe margin alone at first (Chris, 2026-09-30); the square test is one tap away.
  const [square, setSquare] = useState(false)
  const [margin, setMargin] = useState(true)
  const W = r.image?.width
  const H = r.image?.height
  const known = !!W && !!H

  if (!src || !known) {
    return (
      <figure className="m-0">
        <div className="flex aspect-[1200/630] w-full items-center justify-center rounded border border-dashed border-line-strong px-6 text-center text-sm text-muted-foreground">
          {!r.tags.image
            ? 'No share image on this page, so there is nothing to measure.'
            : r.image?.tooBigToShow
              ? `We measured this image${known ? ` (${W} × ${H})` : ''} but don't show files over 2.5 MB here.`
              : src
                ? 'Your image loaded, but we can only read the size of PNG, JPEG, WebP and GIF files.'
                : 'The image did not load, so there is nothing to draw.'}
        </div>
        <figcaption className="mt-2.5 max-w-[64ch] text-[13px] text-muted-foreground">
          <b className="text-foreground">The stress test</b> needs an image we can measure.
        </figcaption>
      </figure>
    )
  }

  // Draw at 1200 units wide; keep the real shape.
  const dw = 1200
  const dh = Math.round((dw * H!) / W!)
  const s = Math.min(dw, dh)
  const sx = 60 + (dw - s) / 2
  const sy = 60 + (dh - s) / 2
  // Safe margin: 60 px sides, 40 px top and bottom on a 1200 × 630 card.
  const mx = 60
  const my = (dh * 40) / 630
  const vbH = dh + 130
  const midY = 60 + dh / 2

  // Desktop: the drawing shrinks to fit the box (taller images too); phone: natural height.
  return (
    <figure className="m-0 flex min-h-0 flex-1 flex-col">
      <svg
        viewBox={`0 0 1300 ${vbH}`}
        role="img"
        aria-label={`Your share image, ${W} by ${H} pixels, with a dashed safe margin and a centered square drawn over it.`}
        className="block h-auto w-full lg:h-0 lg:min-h-0 lg:flex-1"
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="1300" height={vbH} fill="white" />
            <rect x={sx} y={sy} width={s} height={s} fill="black" />
          </mask>
        </defs>
        <image href={src} x="60" y="60" width={dw} height={dh} preserveAspectRatio="none" />
        <g style={{ opacity: square ? 1 : 0 }} className="motion-safe:transition-opacity">
          <rect x="60" y="60" width={dw} height={dh} fill="#0a0a0a" fillOpacity=".62" mask={`url(#${maskId})`} />
          <rect x={sx} y={sy} width={s} height={s} fill="none" stroke="#2dd4a8" strokeWidth="3" strokeDasharray="14 8" />
        </g>
        <g style={{ opacity: margin ? 1 : 0 }} className="motion-safe:transition-opacity">
          {/* Black and white dashes in turn, so the line shows on light and dark images. */}
          {(['#0a0a0a', '#f0f0f0'] as const).map((c, i) => (
            <rect
              key={c}
              x={60 + mx}
              y={60 + my}
              width={dw - 2 * mx}
              height={dh - 2 * my}
              fill="none"
              stroke={c}
              strokeWidth="3"
              strokeDasharray="10 10"
              strokeDashoffset={i * 10}
            />
          ))}
        </g>
        <g stroke="#2dd4a8" strokeWidth="2" fill="none">
          <path d={`M60 30 H1260 M60 18 V42 M1260 18 V42`} />
          <path d={`M30 60 V${60 + dh} M18 60 H42 M18 ${60 + dh} H42`} />
        </g>
        <g fontFamily="ui-monospace,Menlo,Consolas,monospace" fill="#2dd4a8" fontSize="38">
          <rect x="545" y="8" width="230" height="44" fill="#0a0a0a" />
          <text x="660" y="43" textAnchor="middle">{W} px</text>
          <rect x="8" y={midY - 80} width="44" height="160" fill="#0a0a0a" />
          <text x="30" y={midY + 13} textAnchor="middle" transform={`rotate(-90 30 ${midY})`}>
            {H} px
          </text>
          <text x="660" y={60 + dh + 50} textAnchor="middle" fill="#999999" fontSize="34">
            {(W! / H!).toFixed(3)} : 1
          </text>
        </g>
      </svg>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {[
          { label: 'Square test', on: square, set: setSquare },
          { label: 'Safe margin', on: margin, set: setMargin },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            aria-pressed={t.on}
            onClick={() => t.set(!t.on)}
            className={`rounded-[2px] border px-3 py-[7px] font-code text-xs font-medium tracking-[.06em] uppercase ${
              t.on ? 'border-primary-line bg-primary-deep text-primary' : 'border-line-strong bg-well text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <figcaption className="mt-2.5 max-w-[64ch] text-[13px] text-muted-foreground">
        <b className="text-foreground">The stress test.</b> The real image, drawn at {W} × {H}.
        Dashed line: the safe margin. Keep words inside it. Turn on the square test to see what a
        square crop keeps.
      </figcaption>
    </figure>
  )
}

/* ── App post frames: generic, no app logos, no real names ─────────────── */

const ICONS = {
  like: 'M7 10v10H4V10h3Zm2 10h8.2a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 18.4 10H14l.8-4a1.6 1.6 0 0 0-3-1L9 10v10Z',
  comment: 'M4 5h16v11H9l-5 4V5Z',
  share: 'M14 5l6 6-6 6M20 11H9a5 5 0 0 0-5 5v3',
  repost: 'M7 4 4 7l3 3M4 7h12a4 4 0 0 1 4 4v1M17 20l3-3-3-3M20 17H8a4 4 0 0 1-4-4v-1',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  send: 'M21 3 3 10.5l7 2.5 2.5 7L21 3ZM10 13l5-5',
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Avatar({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="flex-none overflow-hidden rounded-full" aria-hidden="true">
      <rect width="40" height="40" fill="#c9ccd1" />
      <circle cx="20" cy="16" r="7" fill="#f2f3f5" />
      <path d="M6 40c2-8 8-12 14-12s12 4 14 12Z" fill="#f2f3f5" />
    </svg>
  )
}

const POST_TEXT = 'Worth a read.'
const SYS_FONT = "font-[-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]"

function AppPreview({ tab, r, src }: { tab: PreviewTabId; r: OgCheckResult; src: string | null }) {
  const Card = LINK_CARDS[tab]
  const card = (
    <Card
      title={r.tags.title}
      description={r.tags.description}
      image={src}
      domain={r.domain}
      alt={r.tags.imageAlt ?? 'Your share image.'}
      emptyLabel={emptyImageLabel(r)}
    />
  )

  if (tab === 'facebook' || tab === 'linkedin') {
    const li = tab === 'linkedin'
    return (
      <div
        className={`overflow-hidden rounded-lg bg-white ${SYS_FONT} ${
          li ? 'border border-[#e0dfdc] text-black/90' : 'text-[#050505] shadow-[0_1px_2px_rgba(0,0,0,.2)]'
        }`}
      >
        <div className="flex items-center gap-2.5 px-3.5 pt-3 pb-2">
          <Avatar size={li ? 48 : 40} />
          <div>
            <b className="block text-[15px] leading-tight">{li ? 'Your Name' : 'Your Page'}</b>
            <small className={`mt-0.5 block text-xs ${li ? 'text-[#666666]' : 'text-[#65676b]'}`}>
              {li ? 'Founder at Your Company · 2h' : '2h'}
            </small>
          </div>
          <span className="ml-auto font-bold tracking-[1px] text-[#65676b]" aria-hidden="true">
            ···
          </span>
        </div>
        <p className="m-0 px-3.5 pb-2.5 text-[15px] leading-[1.4]">{POST_TEXT}</p>
        <div className="border-t border-[#e4e6eb] [&>div]:rounded-none [&>div]:border-0">{card}</div>
        <div className="mx-3.5 flex justify-around border-t border-[#e4e6eb] py-1.5" aria-hidden="true">
          {(li
            ? [['Like', ICONS.like], ['Comment', ICONS.comment], ['Repost', ICONS.repost], ['Send', ICONS.send]]
            : [['Like', ICONS.like], ['Comment', ICONS.comment], ['Share', ICONS.share]]
          ).map(([label, d]) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 px-2 py-1.5 font-semibold ${
                li ? 'text-[13px] text-[#666666]' : 'text-sm text-[#65676b]'
              }`}
            >
              <Icon d={d} />
              {label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (tab === 'x') {
    return (
      <div className={`grid grid-cols-[40px_minmax(0,1fr)] gap-3 text-[#e7e9ea] ${SYS_FONT}`}>
        <Avatar />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <b className="text-[15px]">Your Name</b>
            <small className="text-[15px] text-[#71767b]">@yourhandle · 2h</small>
          </div>
          <p className="m-0 pt-0.5 pb-2.5 text-[15px] leading-[1.4]">{POST_TEXT}</p>
          {card}
          <div className="mt-2.5 flex max-w-[340px] justify-between text-[#71767b]" aria-hidden="true">
            <Icon d={ICONS.comment} />
            <Icon d={ICONS.repost} />
            <Icon d={ICONS.heart} />
            <Icon d={ICONS.share} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${SYS_FONT}`}>
      <small className="text-center text-[11px] text-[#8e8e93]">Today 9:41 AM</small>
      <div className="self-start rounded-[18px] bg-[#e9e9eb] px-3 py-2 text-[15px] text-black">Did you see this?</div>
      {card}
      <small className="self-end text-[11px] text-[#8e8e93]">Delivered</small>
    </div>
  )
}

const MOCK_CAPTION: Record<PreviewTabId, string> = {
  facebook: 'text-[#65676b]',
  linkedin: 'text-[#666666]',
  x: 'text-[#71767b]',
  sms: 'text-[#6e6e73]',
}

function Previews({ r, src }: { r: OgCheckResult; src: string | null }) {
  const [active, setActive] = useState<ResultTab>('measure')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const base = useId().replace(/:/g, '')

  function onKey(e: React.KeyboardEvent, i: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + RESULT_TABS.length) % RESULT_TABS.length
    setActive(RESULT_TABS[next].id)
    refs.current[next]?.focus()
  }

  const ground =
    active === 'measure'
      ? 'border border-border bg-well p-6'
      : `${PREVIEW_GROUNDS[active]} px-4 py-[18px] ${active === 'x' ? 'border border-border' : ''}`

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div role="tablist" aria-label="Result views" className="flex flex-wrap gap-2">
        {RESULT_TABS.map((t, i) => {
          const selected = t.id === active
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-primary bg-primary-deep text-foreground'
                  : 'border-line-strong text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      {/* Desktop: the box fills the spec sheet's height and never sets it, so
          the sheet stays the same height on every tab (decision 10). */}
      <div className="relative mt-3.5 flex flex-1 flex-col lg:min-h-[420px]">
      <div
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${active}`}
        className={`flex flex-1 flex-col justify-center rounded-xl lg:absolute lg:inset-0 lg:overflow-y-auto ${ground}`}
      >
        {active === 'measure' ? (
          <Measured r={r} src={src} />
        ) : (
          <>
            <div className="mx-auto w-full max-w-[400px] lg:max-w-[340px] xl:max-w-[380px]">
              <AppPreview tab={active} r={r} src={src} />
            </div>
            <p className={`mx-auto mt-3 max-w-[52ch] text-center text-xs ${MOCK_CAPTION[active]}`}>
              Simplified mock-up, drawn from your tags. No app logos. The real apps change with
              their version and screen size, so check a real share too.
            </p>
          </>
        )}
      </div>
      </div>
    </div>
  )
}

/* ── Spec sheet ─────────────────────────────────────────────────────────── */

function SpecSheet({ checks }: { checks: CheckRow[] }) {
  return (
    <div className="rounded-md border border-border bg-panel">
      <h3 className="m-0 flex justify-between border-b border-border px-[18px] py-3.5 font-code text-xs font-medium tracking-[.1em] text-muted-foreground uppercase">
        <span>Spec sheet</span>
        <span aria-hidden="true">Source</span>
      </h3>
      <ol className="m-0 list-none p-0">
        {checks.map((c) => (
          <li
            key={c.id}
            className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 border-b border-border px-[18px] py-[15px] last:border-b-0"
          >
            <Mark status={c.status} />
            <span className="text-sm font-medium">{c.label}</span>
            <span className="text-right font-code text-[13px] text-foreground tabular-nums">{c.value}</span>
            <span className="col-[2/-1] font-code text-xs text-muted-foreground">
              {c.rule}
              {c.sources.map((s) => (
                <span key={s.href}>
                  {' · '}
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener"
                    className="text-muted-foreground underline decoration-line-strong underline-offset-[3px] hover:text-primary"
                  >
                    {s.label}
                  </a>
                </span>
              ))}
            </span>
            {(c.note || (c.status === 'skip' && !c.note)) && (
              <span className={`col-[2/-1] text-xs ${c.status === 'skip' ? 'text-muted-foreground' : 'text-caution'}`}>
                {c.note ?? 'Could not run'}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── Fix list + tag block ───────────────────────────────────────────────── */

function Fixes({ r }: { r: OgCheckResult }) {
  const [copied, setCopied] = useState(false)
  const lines = buildTagBlock(r)
  const fixes = r.checks.filter((c) => c.fix && (c.status === 'fail' || c.status === 'warn'))
  const order: Record<CheckStatus, number> = { fail: 0, warn: 1, skip: 2, pass: 3 }
  fixes.sort((a, b) => order[a.status] - order[b.status])
  const marked = lines.filter((l) => l.mark).length

  const recheck = `https://chrishornak.com/og-image-checker?url=${encodeURIComponent(shortUrl(r.url))}`
  const brief = [
    `Share card fixes for ${shortUrl(r.url)}`,
    '',
    ...(fixes.length
      ? ['What to fix:', ...fixes.map((c, i) => `${i + 1}. ${c.label}: ${c.fix}`), '']
      : ['Nothing to fix. Every check that could run passed.', '']),
    "Tags to paste in the page's <head>:",
    tagBlockText(lines),
    '',
    `Check it again: ${recheck}`,
  ].join('\n')

  async function send() {
    const title = `Share card fixes for ${r.domain}`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: brief })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(brief)}`
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(tagBlockText(lines))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-10 grid gap-8 border-t border-border pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10">
      <div>
        <h3 className="mb-1 font-heading text-[22px] font-bold">What to fix</h3>
        {fixes.length === 0 ? (
          <p className="text-body-soft">Nothing. Every check that could run passed.</p>
        ) : (
          <ol className="mt-4 grid list-none gap-4 p-0">
            {fixes.map((c, i) => (
              <li key={c.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border font-code text-xs ${
                    c.status === 'fail' ? 'border-danger/50 text-danger' : 'border-caution-line text-caution'
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="m-0 text-sm font-semibold">
                    {c.label}
                    <span className="sr-only"> ({STATUS_MARK[c.status].label})</span>
                  </p>
                  <p className="m-0 mt-1 text-[15px] text-body-soft">{c.fix}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="mb-1 font-heading text-[22px] font-bold">Your tags, ready to paste</h3>
            <p className="m-0 text-sm text-body-soft">
              Filled with what we found on your page.
              {marked > 0 && ' Lines with a note are new or changed.'} They go in the page&apos;s{' '}
              <code className="font-code text-[13px]">&lt;head&gt;</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-full border border-primary-line bg-primary-deep px-4 py-2 font-code text-xs font-medium tracking-[.06em] text-primary uppercase"
            >
              {copied ? 'Copied' : 'Copy tags'}
            </button>
            <button
              type="button"
              onClick={send}
              className="rounded-full border border-line-strong px-4 py-2 font-code text-xs font-medium tracking-[.06em] text-foreground uppercase hover:border-primary-line"
            >
              Send to developer
            </button>
          </div>
          <span className="sr-only" aria-live="polite">
            {copied ? 'Tags copied' : ''}
          </span>
        </div>
        <pre className="m-0 overflow-x-auto rounded-md border border-border bg-well p-4 font-code text-[12.5px] leading-[1.7] text-foreground">
          <code>
            {lines.map((l, i) => (
              <span key={i} className="block whitespace-pre">
                {l.code}
                {l.mark && <span className="text-caution">{` <!-- ${l.mark} -->`}</span>}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}

/* ── Two things only you can judge (decision 14) ────────────────────────── */

function Found({
  label,
  tag,
  value,
  missing,
}: {
  label: string
  tag: string
  value: string | null
  missing: string
}) {
  return (
    <div className="rounded-md border border-[#262626] bg-well px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">
          {label} <code className="ml-1 font-code text-xs text-[#8f8f8f]">{tag}</code>
        </span>
        <span
          className={`rounded-full border px-[9px] py-[3px] font-code text-[11px] font-medium tracking-[.06em] whitespace-nowrap uppercase ${
            value ? 'border-primary-line text-primary' : 'border-caution-line text-caution'
          }`}
        >
          {value ? 'Found' : 'Not found'}
        </span>
      </div>
      <p className={`m-0 mt-1.5 text-base ${value ? 'text-foreground' : 'text-caution'}`}>{value ?? missing}</p>
    </div>
  )
}

const ADVICE_BLOG = (
  <>
    So the picture should be <b className="text-foreground">one image of the topic, with no title and no logo.</b>{' '}
    Your share title and description carry the words.
  </>
)
const ADVICE_MAIN = (
  <>
    So the picture should have{' '}
    <b className="text-foreground">
      your logo, one line on what the page is, one line on what the reader gets, and your domain.
    </b>{' '}
    Keep the words inside the safe margin.
  </>
)

function Judge({ r }: { r: OgCheckResult }) {
  const article = isArticle(r.tags)
  const [blog, setBlog] = useState(article)
  useEffect(() => setBlog(article), [article, r])
  const match = compareTitleToH1(r.tags.title, r.h1)
  const type = r.tags.type

  return (
    <div className="mt-10 border-t border-border pt-8">
      <div className="mb-5">
        <h3 className="mb-1 font-heading text-[22px] font-bold">Two things only you can judge</h3>
        <p className="m-0 text-body-soft">We pulled these from your page. Read them and decide.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <section aria-labelledby="judge-title" className="flex flex-col gap-3.5 rounded-lg border border-border bg-panel p-[22px]">
          <h4 id="judge-title" className="m-0 font-heading text-[17px] font-bold">
            Does your share title fit your page?
          </h4>
          <Found
            label="Your share title"
            tag="og:title"
            value={r.tags.title}
            missing="No share title on this page. Add an og:title tag (it is in the tag block)."
          />
          <Found
            label="Your page headline"
            tag="H1"
            value={r.h1}
            missing="We read your page's HTML and found no H1 headline."
          />
          <p
            className={`m-0 border-l-2 pl-3 text-[15px] text-body-soft ${
              match === 'missing' ? 'border-caution' : 'border-primary'
            }`}
          >
            {match === 'same' && (
              <>
                <b className="text-foreground">Same words.</b> Someone who clicks gets what the title promised.
              </>
            )}
            {match === 'different' && (
              <>
                <b className="text-foreground">Different words.</b> That can be fine. They don&apos;t have to
                match, but they should make the same promise. Would someone who clicked for the title feel
                they landed in the right place?
              </>
            )}
            {match === 'missing' && (
              <>
                <b className="text-foreground">Can&apos;t compare yet.</b>{' '}
                {r.tags.title ? 'Your page needs an H1 headline first.' : 'Add a share title first, then check again.'}
              </>
            )}
          </p>
        </section>

        <section aria-labelledby="judge-type" className="flex flex-col gap-3.5 rounded-lg border border-border bg-panel p-[22px]">
          <h4 id="judge-type" className="m-0 font-heading text-[17px] font-bold">
            Is your picture the right kind?
          </h4>
          <Found
            label="Your page type"
            tag="og:type"
            value={
              type
                ? article
                  ? `${type}: your page says it is a blog post.`
                  : `${type}: your page says it is a main page, not a blog post.`
                : null
            }
            missing="Your page doesn't say what kind of page it is. We show main page advice."
          />
          <p className="m-0 text-[15px] text-body-soft">{blog ? ADVICE_BLOG : ADVICE_MAIN}</p>
          <p className="m-0 text-[13px] text-muted-foreground">
            We can&apos;t read words inside a picture. Open the Measured tab and look at your card.
          </p>
          <p className="m-0 text-sm text-body-soft">
            {blog ? 'Not a blog post?' : 'Is it a blog post?'}{' '}
            <button
              type="button"
              onClick={() => setBlog(!blog)}
              className="border-0 bg-transparent p-0 text-primary underline underline-offset-[3px]"
            >
              {blog ? 'Show main page advice' : 'Show blog post advice'}
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}

/* ── Free card offer ────────────────────────────────────────────────────── */

function Offer() {
  return (
    <aside
      aria-labelledby="offer-h"
      className="mt-11 grid items-center gap-x-10 gap-y-6 rounded-[10px] border border-primary-line bg-primary-deep p-7 md:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div>
        <p className="mb-2.5 font-code text-xs tracking-[.12em] text-primary uppercase">Free share card</p>
        <h2 id="offer-h" className="mb-2 font-heading text-[26px] leading-[1.15] font-bold tracking-[-.015em] text-balance">
          Want a better card? I&apos;ll make you one, free.
        </h2>
        <p className="m-0 max-w-[60ch] text-body-soft">
          Book 15 minutes with me. We look at your link together. Then I make you a 1200 × 630
          card from your real logo and colors, plus the tags to add it.
        </p>
      </div>
      <div className="grid justify-items-start gap-3">
        <button
          type="button"
          data-cal-link="chris-hornak/og-image"
          data-cal-namespace="og-image"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
          className="rounded-full bg-primary px-[22px] py-[13px] font-semibold whitespace-nowrap text-primary-foreground"
        >
          Book 15 minutes
        </button>
        <p className="m-0 text-[13px] text-muted-foreground">
          <a href="/audit" className="text-muted-foreground underline underline-offset-[3px] hover:text-foreground">
            Check your whole site
          </a>
          {' · '}
          <a href="/blog/og-image" className="text-muted-foreground underline underline-offset-[3px] hover:text-foreground">
            How to design a card
          </a>
        </p>
      </div>
    </aside>
  )
}

/* ── Result ─────────────────────────────────────────────────────────────── */

function Result({ r, example }: { r: OgCheckResult; example?: { image: string; date: string } }) {
  const src = imageSrc(r, example?.image)
  const ran = r.checks.filter((c) => c.status !== 'skip').length
  const skipped = r.checks.length - ran

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {example ? (
          <span className="rounded-[2px] border border-dashed border-[#3a3a3a] px-2 py-1 font-code text-[11px] font-medium tracking-[.1em] text-muted-foreground uppercase">
            Example · {example.date}
          </span>
        ) : (
          <span className="rounded-[2px] border border-primary-line px-2 py-1 font-code text-[11px] font-medium tracking-[.1em] text-primary uppercase">
            Your link
          </span>
        )}
        <span className="font-code text-sm break-all text-[#cfcfcf]">{shortUrl(r.url)}</span>
        <h2 id="og-result" className="m-0 w-full font-heading text-[22px] font-bold lg:ml-auto lg:w-auto">
          <em className="text-primary not-italic">
            {r.passed} of {ran}
          </em>{' '}
          checks pass
          {skipped > 0 && <span className="text-muted-foreground"> · {skipped} could not run</span>}
        </h2>
      </div>

      <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col">
          <Previews key={r.url + r.checkedAt} r={r} src={src} />
        </div>
        <SpecSheet checks={r.checks} />
      </div>

      <Fixes r={r} />
      <Judge r={r} />
    </>
  )
}

/* ── Root ───────────────────────────────────────────────────────────────── */

export function OgChecker({ example }: { example: OgCheckResult }) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OgCheckResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  async function run(raw: string) {
    const url = normalize(raw)
    if (!url) {
      setError('That doesn’t look like a web address. Try yoursite.com/page.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/og-check?url=${encodeURIComponent(url)}`)
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data.error) {
        setError(data?.error ?? 'Something went wrong. Try again in a minute.')
        return
      }
      setResult(data as OgCheckResult)
      const next = new URL(window.location.href)
      next.searchParams.set('url', shortUrl(url))
      window.history.replaceState(null, '', next.toString())
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

  // Auto-run from ?url= (never useSearchParams: it bails the page out of SSR).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('url')
    if (q) {
      setValue(q)
      run(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Hero value={value} onChange={setValue} onSubmit={() => run(value)} loading={loading} error={error} />
      <section aria-labelledby="og-result" className="scroll-mt-28" ref={resultRef}>
        <div className="mx-auto max-w-[1200px] px-4 pt-10 pb-[72px] sm:px-6">
          <p className="sr-only" aria-live="polite">
            {loading ? 'Checking your link.' : result ? `${result.passed} checks pass.` : ''}
          </p>
          <div className={loading ? 'opacity-50 transition-opacity' : undefined}>
            {result ? (
              <Result r={result} />
            ) : (
              <Result r={example} example={{ image: '/images/blog/og-image-card.png', date: fmtDate(example.checkedAt) }} />
            )}
          </div>
          <Offer />
        </div>
      </section>
    </>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
