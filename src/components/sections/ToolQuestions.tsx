/* ── The three free checks, as the owner's three questions ────────────────
 * Ends each tool page, in order. Each other tool is a whole-card link with
 * an "Open the … →" line (Chris, 2026-10-01: the old text links didn't read
 * as links). The current page is marked, not linked.
 * ─────────────────────────────────────────────────────────────────────── */

import { toolLinks } from '@/lib/data'

const QUESTIONS = toolLinks.map((t) => ({ q: t.question, tool: t.label, href: t.href }))

export type ToolHref = (typeof toolLinks)[number]['href']

export function ToolQuestions({ current, className = '' }: { current: ToolHref; className?: string }) {
  return (
    <nav aria-labelledby="tool-questions" className={`grid gap-3 ${className}`}>
      <h2 id="tool-questions" className="m-0 text-left font-heading text-[17px] font-bold">
        More free checks
      </h2>
      <ol className="m-0 grid list-none gap-3 p-0 text-left sm:grid-cols-3">
        {QUESTIONS.map((x, i) =>
          x.href === current ? (
            <li
              key={x.href}
              className="grid content-start gap-1 rounded-lg border border-dashed border-line-strong p-4"
              aria-current="page"
            >
              <span className="text-xs text-muted-foreground">Check {i + 1} of 3</span>
              <b className="font-heading text-base">{x.q}</b>
              <span className="text-sm text-muted-foreground">You are here</span>
            </li>
          ) : (
            <li key={x.href} className="grid">
              <a
                href={x.href}
                className="group grid content-start gap-1 rounded-lg border border-line-strong bg-panel p-4 no-underline transition-colors hover:border-primary focus-visible:border-primary"
              >
                <span className="text-xs text-muted-foreground">Check {i + 1} of 3</span>
                <b className="font-heading text-base text-foreground">{x.q}</b>
                <span className="text-sm font-medium text-primary group-hover:underline group-hover:underline-offset-[3px]">
                  Open the {x.tool} <span aria-hidden="true">→</span>
                </span>
              </a>
            </li>
          ),
        )}
      </ol>
    </nav>
  )
}
