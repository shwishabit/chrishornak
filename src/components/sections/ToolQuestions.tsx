/* ── The three free checks, as the owner's three questions ────────────────
 * Ends each tool page, in order: Found → Seen → Chosen. Each other tool is a
 * whole-card link with an "Open the … →" line (Chris, 2026-10-01: the old
 * text links didn't read as links). The current page is marked, not linked.
 * NextCheck is the one-line "what's next" under a tool's result.
 * ─────────────────────────────────────────────────────────────────────── */

import { toolLinks } from '@/lib/data'

export type ToolHref = (typeof toolLinks)[number]['href']

export function ToolQuestions({ current, className = '' }: { current?: ToolHref; className?: string }) {
  return (
    <nav aria-labelledby="tool-questions" className={`grid gap-3 ${className}`}>
      <h2 id="tool-questions" className="m-0 text-left font-heading text-[17px] font-bold">
        Found, seen, chosen: three free checks
      </h2>
      <ol className="m-0 grid list-none gap-3 p-0 text-left sm:grid-cols-3">
        {toolLinks.map((x, i) =>
          x.href === current ? (
            <li
              key={x.href}
              className="grid content-start gap-1 rounded-lg border border-dashed border-line-strong p-4"
              aria-current="page"
            >
              <span className="text-xs text-muted-foreground">
                Step {i + 1} · {x.step}
              </span>
              <b className="font-heading text-base">{x.question}</b>
              <span className="text-sm text-muted-foreground">You are here</span>
            </li>
          ) : (
            <li key={x.href} className="grid">
              <a
                href={x.href}
                className="group grid content-start gap-1 rounded-lg border border-line-strong bg-panel p-4 no-underline transition-colors hover:border-primary focus-visible:border-primary"
              >
                <span className="text-xs text-muted-foreground">
                  Step {i + 1} · {x.step}
                </span>
                <b className="font-heading text-base text-foreground">{x.question}</b>
                <span className="text-sm font-medium text-primary group-hover:underline group-hover:underline-offset-[3px]">
                  Open the {x.label}&nbsp;<span aria-hidden="true">→</span>
                </span>
              </a>
            </li>
          ),
        )}
      </ol>
    </nav>
  )
}

/** The next step after a tool's result, in story order. */
export function NextCheck({ current, className = '' }: { current: ToolHref; className?: string }) {
  const i = toolLinks.findIndex((t) => t.href === current)
  const next = toolLinks[i + 1]
  if (!next) return null
  return (
    <p className={`m-0 text-sm text-muted-foreground ${className}`}>
      <span className="font-code text-xs tracking-[.08em] text-primary uppercase">
        Next · {next.step}
      </span>{' '}
      {next.question}{' '}
      <a href={next.href} className="font-semibold text-foreground underline underline-offset-[3px] hover:text-primary">
        Open the {next.label}&nbsp;<span aria-hidden="true">→</span>
      </a>
    </p>
  )
}
