'use client'

import { useState } from 'react'
import {
  Search,
  Globe,
  Code2,
  ShieldCheck,
  Smartphone,
  BotMessageSquare,
  ChevronDown,
} from 'lucide-react'
import { AuditTool } from '@/components/sections/AuditTool'
import { AuditPreview } from '@/components/sections/AuditPreview'
import { auditFaqs } from '@/lib/data'

const categories = [
  {
    title: 'Search',
    icon: <Search className="h-4 w-4" />,
    desc: 'Can search engines find and index you? Your page title, description, canonical URL, and sitemap — the foundation everything else builds on.',
  },
  {
    title: 'AI',
    icon: <BotMessageSquare className="h-4 w-4" />,
    desc: 'Can AI recommend your business? When someone asks ChatGPT or Google AI for a recommendation, the signals on your site determine whether you get mentioned.',
  },
  {
    title: 'Social',
    icon: <Globe className="h-4 w-4" />,
    desc: 'How do you look when someone shares your link? The preview image, title, and description that show up on Facebook, LinkedIn, and in text messages.',
  },
  {
    title: 'Mobile',
    icon: <Smartphone className="h-4 w-4" />,
    desc: 'Does it work on their phone? Most of your visitors are on mobile — tap targets, readability, and the basics that make or break that experience.',
  },
  {
    title: 'Structure',
    icon: <Code2 className="h-4 w-4" />,
    desc: 'Is your page well-built? Headings, image descriptions, content depth, internal links — whether search engines and visitors can follow the story your page is telling.',
  },
  {
    title: 'Security',
    icon: <ShieldCheck className="h-4 w-4" />,
    desc: 'Do visitors trust your site? Secure connections, safe links, and the signals that tell both people and search engines your site is safe.',
  },
]

function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-heading text-xl font-bold md:text-2xl">
        Common questions
      </h2>
      <dl className="mt-8 divide-y divide-border/30">
        {auditFaqs.map((faq, i) => (
          <div key={i} className="py-5">
            <dt>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-start justify-between gap-4 text-left"
                aria-expanded={openIndex === i}
              >
                <span className="text-sm font-semibold text-foreground">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
            </dt>
            <dd
              className={`overflow-hidden transition-all duration-200 ${openIndex === i ? 'mt-3 max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function AuditPageClient() {
  const [hasResult, setHasResult] = useState(false)

  return (
    <>
      <div className="mt-12">
        <AuditTool onResult={setHasResult} />
      </div>

      {/* Below the fold — scroll to explore */}
      {!hasResult && (
        <div className="mt-24 space-y-20 md:mt-32 md:space-y-28">
          <div>
            <AuditPreview />
          </div>

          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-xl font-bold md:text-2xl">
              6 areas that determine whether you get found
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Search engines, AI tools, and real people all evaluate your site differently.
              This check covers the signals that matter most.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((item) => (
                <div
                  key={item.title}
                  className="group relative rounded-xl border border-border/30 bg-muted/10 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/25"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                      {item.icon}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground/0 transition-all duration-300 group-hover:text-muted-foreground/80 max-h-0 overflow-hidden group-hover:max-h-24 sm:max-h-0 sm:group-hover:max-h-24"
                     style={{ transitionProperty: 'max-height, color' }}
                  >
                    {item.desc}
                  </p>
                  {/* Mobile: always show description */}
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground/80 sm:hidden">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <FaqSection />

          {/* Closing section — proof + scope + CTA */}
          <div className="mx-auto max-w-3xl border-t border-border/20 pt-12">
            <figure className="relative pl-5 border-l-2 border-primary/30">
              <blockquote className="text-base leading-relaxed text-muted-foreground italic">
                &ldquo;Working with Chris feels like having an exceptional
                strategist on staff. We brainstorm collaboratively, and he
                turns ideas into high-quality content that actually
                performs.&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-foreground">Meredith Smith</span>
                <span className="text-muted-foreground/80">{' '}&middot; Marketing Manager</span>
              </figcaption>
            </figure>

            <p className="mt-10 text-sm leading-relaxed text-muted-foreground/80">
              This checks the on-page factors you can control right now — not
              page speed, backlink authority, or competitor positioning.
              That&apos;s the deeper work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                Check your site &uarr;
              </a>
              <a
                href="/#connect"
                className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                Or let&apos;s talk about it&nbsp;&rarr;
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Post-result closing */}
      {hasResult && (
        <div className="mx-auto mt-16 max-w-3xl space-y-20 md:space-y-28">
          <FaqSection />
        <div className="border-t border-border/20 pt-12">
          <figure className="relative pl-5 border-l-2 border-primary/30">
            <blockquote className="text-base leading-relaxed text-muted-foreground italic">
              &ldquo;Working with Chris feels like having an exceptional
              strategist on staff. We brainstorm collaboratively, and he
              turns ideas into high-quality content that actually
              performs.&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold text-foreground">Meredith Smith</span>
              <span className="text-muted-foreground/80">{' '}&middot; Marketing Manager</span>
            </figcaption>
          </figure>

          <p className="mt-10 text-sm leading-relaxed text-muted-foreground/80">
            This checks the on-page factors you can control right now — not
            page speed, backlink authority, or competitor positioning.
            That&apos;s the deeper work.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              Check your site &uarr;
            </a>
            <a
              href="/#connect"
              className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Or let&apos;s talk about it&nbsp;&rarr;
            </a>
          </div>
        </div>
        </div>
      )}
    </>
  )
}
