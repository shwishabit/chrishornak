'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-10 border-l-2 border-primary/40 pl-6 md:pl-8">
      <p className="font-heading text-xl font-bold leading-snug text-foreground md:text-2xl">
        {children}
      </p>
    </div>
  )
}

function StatRow({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div className="my-10 grid grid-cols-2 gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border/20 bg-muted/10 px-4 py-5 text-center"
        >
          <p className="font-heading text-2xl font-bold text-primary md:text-3xl">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}

export function AiReadinessGuide() {
  return (
    <>
      <p>
        Try something right now. Open ChatGPT and type: &ldquo;Recommend a [your industry] in [your city].&rdquo;
      </p>

      <p>
        If your business doesn&apos;t come back in the answer, that&apos;s not a bug. That&apos;s a signal — and it&apos;s telling you something important about how customers are starting to find businesses.
      </p>

      <p>
        A restaurant owner in Austin told me his bookings dropped 15% over six months. His Google rankings hadn&apos;t changed. His Yelp reviews were strong. His Instagram was active. But when I asked ChatGPT for the best Italian restaurants in his neighborhood, three competitors showed up. He didn&apos;t. Neither did Perplexity. Neither did Google&apos;s AI Overview.
      </p>

      <p>
        His business was invisible in the fastest-growing discovery channel on the internet — and he had no idea it existed.
      </p>

      <PullQuote>
        AI isn&apos;t replacing search. It&apos;s adding a new layer on top of it — and most businesses don&apos;t show up in that layer at all.
      </PullQuote>

      <h2 id="how-ai-recommendations-work">How AI recommendations actually work</h2>

      <p>
        When someone asks ChatGPT, Perplexity, or Google&apos;s AI Overview for a recommendation, the AI doesn&apos;t Google it and read the results like you would. It synthesizes. It pulls from structured data, reviews, content patterns, entity recognition, and the overall clarity of what your business is and does.
      </p>

      <p>
        That last part is critical. AI doesn&apos;t guess. It summarizes what it can confidently understand. If your website is a jumble of vague copy, no structured data, and generic service descriptions — the AI has nothing to work with. It skips you. Not because you&apos;re bad at what you do, but because your site didn&apos;t give it anything to cite.
      </p>

      <p>
        Think of it this way: search engines rank pages. AI recommends <em>entities</em> — businesses, people, products that it can clearly identify and describe. If your website doesn&apos;t communicate what you are in a way machines can parse, you&apos;re not an entity to AI. You&apos;re noise.
      </p>

      <h2 id="why-your-competitors-show-up">Why your competitors show up and you don&apos;t</h2>

      <p>
        The businesses that get recommended by AI aren&apos;t always the best in their category. They&apos;re the most clearly described. That&apos;s a different thing entirely.
      </p>

      {/* In-body figure: a typical AI answer */}
      <div className="my-10 overflow-hidden rounded-xl border border-border/20 bg-background/60">
        {/* Browser-style window chrome */}
        <div className="flex items-center gap-2 border-b border-border/15 bg-muted/20 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <div className="ml-3 flex flex-1 items-center gap-2 rounded-md bg-background/60 px-3 py-1 font-mono text-[10px] text-muted-foreground/60">
            <span>chatgpt.com</span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* User prompt — right aligned, soft pill */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground/8 px-4 py-2.5 text-sm text-foreground/90">
              who&apos;s the best family law attorney in denver for custody?
            </div>
          </div>

          {/* AI response — left aligned with avatar */}
          <div className="mt-5 flex gap-3">
            {/* AI avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/6 ring-1 ring-border/30">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-foreground/60" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground/70">ChatGPT</span>
                <span className="rounded-full bg-foreground/6 px-1.5 py-px font-mono text-[9px] text-muted-foreground/70">
                  GPT-5
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                Based on reviews, specialization, and reputation in the Denver area, three attorneys consistently come up for custody cases:
              </p>

              <div className="mt-3 space-y-3">
                {[
                  {
                    name: 'Mountain Ridge Family Law',
                    tag: 'Custody and mediation specialists. 4.9★ across 180+ reviews. Free initial consult.',
                    sources: ['google.com', 'avvo.com', 'yelp.com'],
                  },
                  {
                    name: 'Ainsworth & Cole',
                    tag: 'Denver-based since 2008. Focused on collaborative divorce and shared custody.',
                    sources: ['google.com', 'lawyers.com'],
                  },
                  {
                    name: 'Front Range Legal Group',
                    tag: 'Family law and estate planning. Spanish-speaking attorneys on staff.',
                    sources: ['google.com', 'martindale.com'],
                  },
                ].map((item, i) => (
                  <div key={item.name} className="flex gap-3">
                    <span className="mt-0.5 font-mono text-xs text-foreground/40">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{item.tag}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.sources.map((src) => (
                          <span
                            key={src}
                            className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 font-mono text-[9px] text-muted-foreground/70 ring-1 ring-border/20"
                          >
                            <span className="h-1 w-1 rounded-full bg-primary/60" />
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* The missing slot — your business */}
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed border-red-400/25 bg-red-400/3 p-3">
                <span className="mt-0.5 font-mono text-xs text-red-400/60">4.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground/50">
                    <span className="italic">your firm</span> — not surfaced
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/60">
                    No schema markup. No entity match. Reviews exist on Google, but the site gives ChatGPT nothing structured to cite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/15 bg-muted/10 px-6 py-3 text-xs leading-relaxed text-muted-foreground md:px-8">
          The three competitors aren&apos;t better lawyers. They&apos;re better described — schema, location, specialty, sources AI can verify. AI cited what it could parse, and skipped what it couldn&apos;t.
        </div>
      </div>

      <p>
        Here&apos;s what separates businesses that AI recommends from businesses it ignores:
      </p>

      <div className="my-10 space-y-5">
        {[
          {
            title: 'They have structured data',
            body: 'Schema markup — LocalBusiness, Organization, Product, Review — tells AI exactly what your business is, where it operates, and what customers say about it. Without it, AI has to guess from unstructured text. AI doesn\'t like guessing. It moves to the next option.',
          },
          {
            title: 'Their content answers specific questions',
            body: 'AI pulls from content that directly answers the kind of questions people ask it. "What\'s the best accountant for small businesses in Portland?" If your site has a clear, specific answer to that kind of question — in your copy, your FAQ, your service pages — AI has something to cite. If your homepage just says "We provide accounting services," you\'re invisible.',
          },
          {
            title: 'They\'re mentioned across multiple sources',
            body: 'AI cross-references. If your business name appears on your website, in Google Business Profile, across review sites, in local directories, and in articles — all saying consistent things — AI treats you as a verified entity. If you only exist on your own website, you\'re an unverified claim.',
          },
          {
            title: 'Their website loads fast and is well-structured',
            body: 'AI crawlers are impatient. A slow site with broken heading hierarchy and no clear content structure gives AI less usable material. The technical signals from Guide 02 aren\'t just about search engines — they\'re the foundation AI needs to even consider you.',
          },
          {
            title: 'They state what they do with clarity, not cleverness',
            body: 'The #1 killer of AI recommendations is vague, clever copy. "We help businesses thrive" tells AI nothing. "We\'re a family law firm in Denver specializing in custody and divorce mediation" tells AI exactly what to recommend and when. Clarity wins. Every time.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="flex gap-4 rounded-xl border border-border/20 bg-muted/10 p-5 md:p-6">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <div>
              <p className="font-heading text-sm font-bold text-foreground md:text-base">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <StatRow
        stats={[
          { value: '1B+', label: 'ChatGPT queries per week' },
          { value: '37%', label: 'of consumers have used AI to find local businesses' },
          { value: '0', label: 'schema markup on most small business sites' },
        ]}
      />

      {/* Mid-Guide CTA: Findability Check */}
      <div className="my-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10">
        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-foreground md:text-xl">
              Can AI actually find your business?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The Findability Check scores your AI readiness — structured data, content clarity, entity signals, and more. See exactly what AI can and can&apos;t understand about your business.
            </p>
            <Link
              href="/audit"
              className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your AI readiness <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 id="the-window-is-open">The window is still open — but it&apos;s closing</h2>

      <p>
        Here&apos;s the good news: most of your competitors haven&apos;t figured this out either.
      </p>

      <p>
        AI recommendations are new enough that the bar for showing up is still low. You don&apos;t need a massive content operation. You don&apos;t need to hire an AI consultant. You need your existing website to communicate clearly — to humans <em>and</em> machines.
      </p>

      <p>
        But that window won&apos;t stay open. As more businesses optimize for AI visibility, the ones who moved first will have a compounding advantage. AI learns from patterns. The businesses it recommends today get more traffic, more reviews, more mentions — which makes AI recommend them more tomorrow. It&apos;s a flywheel, and right now most of your competition hasn&apos;t even started spinning it.
      </p>

      <PullQuote>
        The businesses that AI recommends tomorrow are the ones that make themselves clearly understandable today. This isn&apos;t about gaming an algorithm. It&apos;s about being specific about who you are and what you do.
      </PullQuote>

      <h2 id="what-ai-readiness-looks-like">What AI readiness actually looks like</h2>

      <p>
        An AI-ready business doesn&apos;t look dramatically different from a well-run business that communicates clearly. That&apos;s the point. AI readiness isn&apos;t a separate strategy — it&apos;s what happens when your marketing fundamentals are actually solid.
      </p>

      <div className="my-10 overflow-hidden rounded-xl border border-border/20 bg-muted/10">
        <div className="border-b border-border/10 px-6 py-4">
          <p className="font-heading text-sm font-bold tracking-wide text-primary/80">
            AI-INVISIBLE VS. AI-READY
          </p>
        </div>
        <div className="divide-y divide-border/10">
          {[
            { invisible: '"We help businesses succeed"', ready: '"We\'re a Denver accounting firm for small businesses under 50 employees"' },
            { invisible: 'No structured data — AI guesses what you are', ready: 'LocalBusiness schema with services, reviews, location' },
            { invisible: 'Name only appears on your own website', ready: 'Consistent name/description across directories, reviews, profiles' },
            { invisible: 'FAQ page with generic questions', ready: 'FAQ answers the exact questions people ask AI about your industry' },
            { invisible: 'Blog posts with no clear topic hierarchy', ready: 'Content organized around specific, answerable questions' },
          ].map((row) => (
            <div key={row.invisible} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-red-400/60">Invisible</span>
                <p className="mt-1 text-sm text-muted-foreground">{row.invisible}</p>
              </div>
              <ArrowRight className="hidden h-4 w-4 mt-5 text-primary/40 md:block" />
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-primary/60">Ready</span>
                <p className="mt-1 text-sm text-foreground/90">{row.ready}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 id="this-isnt-about-tricks">This isn&apos;t about tricking AI</h2>

      <p>
        I want to be direct about something: there&apos;s a growing industry of &ldquo;AI SEO&rdquo; consultants selling snake oil. Prompt stuffing. Hidden schema. Fake review signals. That stuff will get you filtered, not recommended.
      </p>

      <p>
        AI readiness is the opposite of a hack. It&apos;s clarity. It&apos;s making your website say — in both human-readable and machine-readable language — exactly what your business does, who it serves, and why someone should choose you. That&apos;s it. If that sounds like good marketing, it&apos;s because it is.
      </p>

      <p>
        The businesses that win in AI discovery will be the same businesses that win everywhere else: the ones with clear positioning, genuine proof, and a signal that&apos;s strong enough to find.
      </p>

      <hr />

      <h2 id="where-to-start">Where to start</h2>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Check your current AI visibility',
            body: 'Run the Findability Check to see your AI Readiness score. Then actually ask ChatGPT and Perplexity to recommend a business in your category and city. See what comes back. That\'s your baseline.',
          },
          {
            step: '02',
            title: 'Add structured data to your website',
            body: 'At minimum, add LocalBusiness or Organization schema with your name, address, phone number, services, and review aggregate. This is the single highest-impact change for AI visibility.',
          },
          {
            step: '03',
            title: 'Rewrite your copy for clarity, not cleverness',
            body: 'Look at your homepage, about page, and service pages. If a stranger — or a machine — can\'t tell exactly what you do and where you do it within 10 seconds, the copy needs work.',
          },
          {
            step: '04',
            title: 'Build your entity presence',
            body: 'Make sure your business appears consistently across Google Business Profile, relevant directories, review sites, and social platforms. AI trusts businesses it can verify from multiple sources.',
          },
        ].map((item) => (
          <div key={item.step} className="flex gap-5">
            <span className="font-heading text-2xl font-bold text-primary/30">{item.step}</span>
            <div>
              <p className="font-heading text-base font-bold text-foreground">{item.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 id="what-happens-next">What happens next</h2>

      <p>
        This guide tackled the urgency: AI is recommending businesses right now, and most of your competitors are already showing up while you&apos;re not. The fix isn&apos;t complicated — it&apos;s clarity and structure.
      </p>

      <p>
        But AI recommendations only matter if someone trusts what they find when they click through to your site. That&apos;s the next gap — and it&apos;s bigger than most businesses realize.
      </p>

      <p>
        Next up: <strong>Guide 04 — Your Reputation Is Strong. Your Website Doesn&apos;t Show It.</strong> The disconnect between what customers say about you and what your website communicates is costing you business you&apos;ll never know you lost.
      </p>

      {/* Closing CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
        <p className="font-heading text-lg font-bold text-foreground md:text-xl">
          Is AI recommending your competitors?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          The Findability Check measures your AI readiness alongside five other signals. See where you stand — before your competitors pull further ahead.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/audit"
            className="guide-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Check your AI readiness <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/#connect"
            className="guide-cta text-sm font-semibold text-muted-foreground no-underline transition-colors duration-200 hover:text-foreground"
          >
            Or let&apos;s talk about it&nbsp;&rarr;
          </Link>
        </div>
      </div>
    </>
  )
}
