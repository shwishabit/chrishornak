'use client'

import { useRef, useState } from 'react'
import { getPostBySlug } from '@/lib/blog'

/**
 * This post's own share preview, laid out the way four apps show a link.
 * Simplified mock-ups, not screenshots: no app logos, no app chrome beyond the
 * preview itself. Only the active panel renders, so the title and description
 * sit in the page HTML once, not four times.
 */
const post = getPostBySlug('og-image')!
const CARD = post.ogImage!.url
const DOMAIN = 'chrishornak.com'

const tabs = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'sms', label: 'Text message' },
] as const

type TabId = (typeof tabs)[number]['id']

function Card({ app }: { app: string }) {
  return (
    <img
      src={CARD}
      alt={`The share image as it shows in a ${app} preview: a chat bubble holding a link preview, with a cursor about to click.`}
      width={1200}
      height={630}
      className="block aspect-[1200/630] w-full object-cover"
    />
  )
}

function Facebook() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#dadde1] bg-white text-left">
      <Card app="Facebook" />
      <div className="border-t border-[#dadde1] bg-[#f0f2f5] px-3 py-2.5">
        <div className="text-[12px] tracking-wide text-[#65676b] uppercase">{DOMAIN}</div>
        <div className="mt-0.5 line-clamp-2 text-[16px] leading-snug font-semibold text-[#050505]">
          {post.title}
        </div>
        <div className="mt-0.5 line-clamp-1 text-[14px] text-[#65676b]">{post.metaDescription}</div>
      </div>
    </div>
  )
}

function LinkedIn() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e0dfdc] bg-white text-left">
      <Card app="LinkedIn" />
      <div className="px-3 py-2.5">
        <div className="line-clamp-2 text-[14px] leading-snug font-semibold text-[#191919]">
          {post.title}
        </div>
        <div className="mt-1 text-[12px] text-[#666666]">{DOMAIN}</div>
      </div>
    </div>
  )
}

function X() {
  return (
    <div className="text-left">
      <div className="relative overflow-hidden rounded-2xl border border-[#2f3336]">
        <Card app="X" />
        <span className="absolute bottom-2.5 left-2.5 max-w-[85%] truncate rounded bg-black/70 px-1.5 py-0.5 text-[13px] text-white">
          {post.title}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] text-[#71767b]">From {DOMAIN}</div>
    </div>
  )
}

function Sms() {
  return (
    <div className="flex justify-end">
      <div className="w-[85%] max-w-[320px] overflow-hidden rounded-[18px] bg-[#e9e9eb] text-left">
        <Card app="text message" />
        <div className="px-3 py-2">
          <div className="line-clamp-2 text-[14px] leading-snug font-semibold text-[#000000]">
            {post.title}
          </div>
          <div className="mt-0.5 text-[12px] text-[#8e8e93]">{DOMAIN}</div>
        </div>
      </div>
    </div>
  )
}

const panels: Record<TabId, () => React.JSX.Element> = {
  facebook: Facebook,
  linkedin: LinkedIn,
  x: X,
  sms: Sms,
}

// Each app's own feed background, so the preview sits on the ground it will
// really be seen on.
const grounds: Record<TabId, string> = {
  facebook: 'bg-[#f0f2f5]',
  linkedin: 'bg-[#f4f2ee]',
  x: 'bg-black',
  sms: 'bg-white',
}

export function SharePreviewTabs() {
  const [active, setActive] = useState<TabId>('facebook')
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const Panel = panels[active]

  function onKey(e: React.KeyboardEvent, i: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + tabs.length) % tabs.length
    setActive(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <figure>
      <div
        role="tablist"
        aria-label="Where the preview is shown"
        className="flex flex-wrap gap-2"
      >
        {tabs.map((t, i) => {
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
        className={`mt-4 rounded-2xl px-4 py-8 md:px-10 md:py-10 ${grounds[active]}`}
      >
        <div className="mx-auto max-w-[480px]">
          <Panel />
        </div>
      </div>

      <figcaption>
        This post&apos;s own preview in 4 places. Simplified mock-ups: the real ones shift with
        the app version and screen size.
      </figcaption>
    </figure>
  )
}
