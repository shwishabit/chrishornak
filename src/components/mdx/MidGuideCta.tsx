import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface MidGuideCtaProps {
  title: string
  body: string
  href: string
  cta: string
}

export function MidGuideCta({ title, body, href, cta }: MidGuideCtaProps) {
  return (
    <div className="my-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10">
      <div className="flex items-start gap-4">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <div>
          <p className="font-heading text-lg font-bold text-foreground md:text-xl">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
          <Link
            href={href}
            className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            {cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
