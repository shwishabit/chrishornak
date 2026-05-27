type Props = {
  href: string
  title: string
  source: string
  /** Length of the resource — e.g. "12 min" for video, "2 min read" for doc. */
  duration?: string
  /** Visual treatment — video uses a play triangle; doc uses a document icon. Default: video. */
  kind?: 'video' | 'doc'
  note?: string
}

export function VideoCallout({ href, title, source, duration, kind = 'video', note }: Props) {
  const isVideo = kind === 'video'
  const actionLabel = isVideo ? 'Watch' : 'Read'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-6 flex items-start gap-4 rounded-lg border border-border/30 bg-muted/10 p-4 transition-all hover:border-primary/40 hover:bg-muted/20 md:p-5"
    >
      {/* Badge — play triangle for video, document for doc */}
      <div
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors',
          isVideo
            ? 'border-primary/40 bg-primary/10 text-primary group-hover:bg-primary/20'
            : 'border-border/40 bg-muted/40 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary',
        ].join(' ')}
      >
        {isVideo ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M3 1.5 12 7 3 12.5z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 1.5h5.5L11 4v8.5H3z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <path d="M8.5 1.5V4H11" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
            <path d="M5 7h4M5 9h4M5 11h2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-xs uppercase tracking-widest">
          <span className={isVideo ? 'text-primary' : 'text-muted-foreground'}>
            {actionLabel}
          </span>
          {duration && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="font-semibold normal-case tracking-normal text-foreground">
                {duration}
              </span>
            </>
          )}
          <span className="text-muted-foreground/60">·</span>
          <span className="text-muted-foreground/80 normal-case tracking-normal">{source}</span>
        </div>
        <p className="mt-1.5 font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">
          {title} <span aria-hidden="true">↗</span>
        </p>
        {note && <p className="mt-1.5 text-sm text-muted-foreground">{note}</p>}
      </div>
    </a>
  )
}
