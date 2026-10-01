/* ── The three free checks, as the owner's three questions ────────────────
 * Ends each tool page, in order. The current page is marked, not linked.
 * ─────────────────────────────────────────────────────────────────────── */

const QUESTIONS = [
  { q: 'Can your website be found?', tool: 'Findability Check', href: '/audit' },
  { q: 'What do people see first?', tool: 'OG Image Checker', href: '/og-image-checker' },
  { q: 'How do you stack up?', tool: 'Authority Check', href: '/authority-check' },
] as const

export type ToolHref = (typeof QUESTIONS)[number]['href']

export function ToolQuestions({ current, className = '' }: { current: ToolHref; className?: string }) {
  return (
    <nav aria-label="Three free checks" className={className}>
      <ol className="m-0 grid list-none gap-3 p-0 text-left sm:grid-cols-3">
        {QUESTIONS.map((x, i) =>
          x.href === current ? (
            <li key={x.href} className="grid gap-0.5 border-t border-primary pt-3" aria-current="page">
              <span className="font-code text-xs text-muted-foreground">{i + 1}</span>
              <b className="font-heading text-base text-primary">{x.q}</b>
              <small className="text-[13px] text-muted-foreground">You are here</small>
            </li>
          ) : (
            <li key={x.href} className="grid gap-0.5 border-t border-line-strong pt-3">
              <span className="font-code text-xs text-muted-foreground">{i + 1}</span>
              <a href={x.href} className="group no-underline">
                <b className="font-heading text-base group-hover:underline group-hover:underline-offset-[3px]">{x.q}</b>
              </a>
              <small className="text-[13px] text-muted-foreground">{x.tool}</small>
            </li>
          ),
        )}
      </ol>
    </nav>
  )
}
