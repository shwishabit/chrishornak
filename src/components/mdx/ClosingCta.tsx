import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface ClosingCtaProps {
  title: string
  body: string
  primaryHref: string
  primaryCta: string
  secondaryHref?: string
  secondaryCta?: string
}

export function ClosingCta({
  title,
  body,
  primaryHref,
  primaryCta,
  secondaryHref,
  secondaryCta,
}: ClosingCtaProps) {
  return (
    <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
      <p className="font-heading text-lg font-bold text-foreground md:text-xl">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
        <Link
          href={primaryHref}
          className="guide-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
        >
          {primaryCta} <ArrowRight className="h-4 w-4" />
        </Link>
        {secondaryHref && secondaryCta && (
          <Link
            href={secondaryHref}
            className="guide-cta text-sm font-semibold text-muted-foreground no-underline transition-colors duration-200 hover:text-foreground"
          >
            {secondaryCta}&nbsp;&rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
