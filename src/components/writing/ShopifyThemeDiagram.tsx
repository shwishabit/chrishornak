'use client'

/**
 * Featured visual for "A small team moves fast if the Shopify theme allows it".
 *
 * Two panels. Left: a page as one opaque block, nothing addressable. Right: the
 * same page as named sections with visible settings. The argument of the piece,
 * drawn rather than described.
 */
export function ShopifyThemeDiagram() {
  return (
    <figure className="overflow-hidden rounded-xl border border-border/20">
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {/* Opaque */}
        <div className="border-b border-border/20 bg-muted/20 p-6 sm:border-b-0 sm:border-r">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
            One block
          </p>
          <p className="mt-2 font-heading text-base font-bold leading-snug">
            Nothing has a name
          </p>

          <div className="mt-5 space-y-2" aria-hidden="true">
            <div className="h-[86px] rounded-md bg-foreground/[0.14]" />
            <div className="h-[46px] rounded-md bg-foreground/[0.14]" />
            <div className="h-[46px] rounded-md bg-foreground/[0.14]" />
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground/70">
            Every change is a ticket, because there is nothing to point at.
          </p>
        </div>

        {/* Legible */}
        <div className="bg-background p-6">
          <p className="font-heading text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Named sections
          </p>
          <p className="mt-2 font-heading text-base font-bold leading-snug">
            Everything has an address
          </p>

          <div className="mt-5 space-y-2" aria-hidden="true">
            {[
              { name: 'product-hero', settings: 4 },
              { name: 'kit-products', settings: 3 },
              { name: 'comparison-table', settings: 6 },
            ].map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-md border border-primary/25 bg-primary/[0.07] px-3 py-2.5"
              >
                <span className="font-mono text-[11px] text-foreground/80">{s.name}</span>
                <span className="font-mono text-[10px] text-primary">{s.settings} settings</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground/70">
            A person, a contractor or an agent can all find the same thing.
          </p>
        </div>
      </div>

      <figcaption className="border-t border-border/20 bg-muted/10 px-6 py-3 text-xs text-muted-foreground/70">
        Same page, two structures. One of these can be changed on a Tuesday.
      </figcaption>
    </figure>
  )
}
