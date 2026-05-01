export function Checklist({ items }: { items: string[] }) {
  return (
    <div className="my-10 space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border/10 bg-muted/5 px-5 py-3.5"
        >
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{item}</p>
        </div>
      ))}
    </div>
  )
}
