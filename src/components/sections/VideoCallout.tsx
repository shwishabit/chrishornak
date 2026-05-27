type Props = {
  href: string
  title: string
  source: string
  duration?: string
  note?: string
}

export function VideoCallout({ href, title, source, duration, note }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-6 flex items-start gap-4 rounded-lg border border-border/30 bg-muted/10 p-4 transition-all hover:border-primary/40 hover:bg-muted/20 md:p-5"
    >
      {/* Play badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3 1.5 12 7 3 12.5z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-xs uppercase tracking-widest text-primary">
          <span>Watch</span>
          <span className="text-muted-foreground/70">·</span>
          <span className="text-muted-foreground/70 normal-case tracking-normal">{source}</span>
          {duration && (
            <>
              <span className="text-muted-foreground/70">·</span>
              <span className="text-muted-foreground/70 normal-case tracking-normal">{duration}</span>
            </>
          )}
        </div>
        <p className="mt-1.5 font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">
          {title} <span aria-hidden="true">↗</span>
        </p>
        {note && (
          <p className="mt-1.5 text-sm text-muted-foreground">{note}</p>
        )}
      </div>
    </a>
  )
}
