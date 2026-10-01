'use client'

import { useRef, useState } from 'react'
import { getPostBySlug } from '@/lib/blog'

/**
 * A share preview laid out the way four apps show a link. Simplified mock-ups,
 * not screenshots: no app logos, no app chrome beyond the preview itself.
 * Only the active panel renders, so the title and description sit in the page
 * HTML once, not four times.
 *
 * The link cards are prop-driven so the OG image checker can draw them from
 * any page's tags. SharePreviewTabs (the /blog/og-image figure) feeds them this
 * post's own values.
 */

export interface LinkCardProps {
  title: string | null
  description: string | null
  /** Image src (a URL or data: URI). Null draws an empty grey box. */
  image: string | null
  domain: string
  alt: string
  /** Text in the grey box when image is null. */
  emptyLabel?: string
}

export const PREVIEW_TABS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'sms', label: 'Text message' },
] as const

export type PreviewTabId = (typeof PREVIEW_TABS)[number]['id']

// Each app's own feed background, so the preview sits on the ground it will
// really be seen on.
export const PREVIEW_GROUNDS: Record<PreviewTabId, string> = {
  facebook: 'bg-[#f0f2f5]',
  linkedin: 'bg-[#f4f2ee]',
  x: 'bg-black',
  sms: 'bg-white',
}

/** A missing tag shows as a grey bar, the way the post's own card draws text. */
function Missing({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block rounded-sm bg-[#c9ccd1]/70 ${className}`} />
}

function Card({ image, alt, emptyLabel }: { image: string | null; alt: string; emptyLabel?: string }) {
  if (!image) {
    return (
      <div className="flex aspect-[1200/630] w-full items-center justify-center bg-[#d8dadf] px-4 text-center text-[13px] text-[#4b4f56]">
        {emptyLabel ?? 'No image'}
      </div>
    )
  }
  return (
    <img
      src={image}
      alt={alt}
      width={1200}
      height={630}
      className="block aspect-[1200/630] w-full object-cover"
    />
  )
}

export function FacebookCard({ title, description, image, domain, alt, emptyLabel }: LinkCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#dadde1] bg-white text-left">
      <Card image={image} alt={alt} emptyLabel={emptyLabel} />
      <div className="border-t border-[#dadde1] bg-[#f0f2f5] px-3 py-2.5">
        <div className="text-[12px] tracking-wide text-[#65676b] uppercase">{domain}</div>
        {title ? (
          <div className="mt-0.5 line-clamp-2 text-[16px] leading-snug font-semibold text-[#050505]">
            {title}
          </div>
        ) : (
          <Missing className="mt-1.5 h-3.5 w-3/4" />
        )}
        {description ? (
          <div className="mt-0.5 line-clamp-1 text-[14px] text-[#65676b]">{description}</div>
        ) : (
          <Missing className="mt-1.5 h-3 w-1/2" />
        )}
      </div>
    </div>
  )
}

export function LinkedInCard({ title, image, domain, alt, emptyLabel }: LinkCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e0dfdc] bg-white text-left">
      <Card image={image} alt={alt} emptyLabel={emptyLabel} />
      <div className="px-3 py-2.5">
        {title ? (
          <div className="line-clamp-2 text-[14px] leading-snug font-semibold text-[#191919]">
            {title}
          </div>
        ) : (
          <Missing className="h-3.5 w-3/4" />
        )}
        <div className="mt-1 text-[12px] text-[#666666]">{domain}</div>
      </div>
    </div>
  )
}

export function XCard({ title, image, domain, alt, emptyLabel }: LinkCardProps) {
  return (
    <div className="text-left">
      <div className="relative overflow-hidden rounded-2xl border border-[#2f3336]">
        <Card image={image} alt={alt} emptyLabel={emptyLabel} />
        {title && (
          <span className="absolute bottom-2.5 left-2.5 max-w-[85%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[13px] text-white">
            {title}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[13px] text-[#71767b]">From {domain}</div>
    </div>
  )
}

export function SmsCard({ title, image, domain, alt, emptyLabel }: LinkCardProps) {
  return (
    <div className="flex justify-end">
      <div className="w-[85%] max-w-[320px] overflow-hidden rounded-[18px] bg-[#e9e9eb] text-left">
        <Card image={image} alt={alt} emptyLabel={emptyLabel} />
        <div className="px-3 py-2">
          {title ? (
            <div className="line-clamp-2 text-[14px] leading-snug font-semibold text-[#000000]">
              {title}
            </div>
          ) : (
            <Missing className="h-3.5 w-3/4" />
          )}
          <div className="mt-0.5 text-[12px] text-[#8e8e93]">{domain}</div>
        </div>
      </div>
    </div>
  )
}

export const LINK_CARDS: Record<PreviewTabId, (p: LinkCardProps) => React.JSX.Element> = {
  facebook: FacebookCard,
  linkedin: LinkedInCard,
  x: XCard,
  sms: SmsCard,
}

/* ── /blog/og-image: this post's own preview ─────────────────────────────── */

const post = getPostBySlug('og-image')!
const POST_CARD = post.ogImage!.url
const POST_DOMAIN = 'chrishornak.com'
const APP_NAME: Record<PreviewTabId, string> = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  x: 'X',
  sms: 'text message',
}

export function SharePreviewTabs() {
  const [active, setActive] = useState<PreviewTabId>('facebook')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const Panel = LINK_CARDS[active]

  function onKey(e: React.KeyboardEvent, i: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + PREVIEW_TABS.length) % PREVIEW_TABS.length
    setActive(PREVIEW_TABS[next].id)
    refs.current[next]?.focus()
  }

  return (
    <figure>
      <div
        role="tablist"
        aria-label="Where the preview is shown"
        className="flex flex-wrap gap-2"
      >
        {PREVIEW_TABS.map((t, i) => {
          const selected = t.id === active
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              id={`share-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls="share-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                selected
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div
        id="share-panel"
        role="tabpanel"
        aria-labelledby={`share-tab-${active}`}
        className={`mt-4 rounded-2xl px-4 py-8 md:px-10 md:py-10 ${PREVIEW_GROUNDS[active]}`}
      >
        <div className="mx-auto max-w-[480px]">
          <Panel
            title={post.title}
            description={post.metaDescription}
            image={POST_CARD}
            domain={POST_DOMAIN}
            alt={`The share image as it shows in a ${APP_NAME[active]} preview: a chat bubble holding a link preview, with a cursor about to click.`}
          />
        </div>
      </div>

      <figcaption>
        This post&apos;s own preview in 4 places. Simplified mock-ups: the real ones shift with
        the app version and screen size.
      </figcaption>
    </figure>
  )
}
