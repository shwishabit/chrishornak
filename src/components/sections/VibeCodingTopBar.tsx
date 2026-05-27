import Link from 'next/link'

export function VibeCodingTopBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-border/20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-10 lg:px-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span>
          <span>chrishornak.com</span>
        </Link>
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
          Vibe Coding
        </span>
      </div>
    </div>
  )
}
