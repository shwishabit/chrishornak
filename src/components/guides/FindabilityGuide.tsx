'use client'

import Link from 'next/link'
import { ArrowRight, Search, Bot, Share2, Smartphone, Code2, Shield } from 'lucide-react'
import { FindabilityDiagram } from './FindabilityDiagram'

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

export function FindabilityGuide() {
  return (
    <>
      <p>
        Let me tell you about the most expensive assumption in marketing.
      </p>

      <p>
        A business owner — let&apos;s call her Sarah — runs a physical therapy practice in a mid-size city. She&apos;s good. Her patients love her. She gets five-star reviews without even asking. Three years ago, she hired an SEO agency to &ldquo;get her found online.&rdquo; They optimized her site, wrote some blog posts, built a few backlinks. She started ranking on page one for &ldquo;physical therapy near me.&rdquo;
      </p>

      <p>
        And then her new patient inquiries started dropping. Not a cliff — a leak. She called her agency. Rankings were steady. Traffic looked fine. &ldquo;SEO is a long game,&rdquo; they told her.
      </p>

      <p>
        Here&apos;s what they never told her: <strong>the game changed.</strong>
      </p>

      <p>
        Her patients weren&apos;t just Googling anymore. Some were asking ChatGPT for recommendations. Others were finding clinics through YouTube exercise demos. Half her referrals were looking her up on Google Maps — where her profile hadn&apos;t been updated since 2021. A local Facebook group kept recommending her competitor because that competitor actually showed up in conversations.
      </p>

      <p>
        Sarah&apos;s agency was measuring one signal. Her customers were looking at six.
      </p>

      <figure className="my-10">
        <FindabilityDiagram />
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          One signal, six places it has to land — Google, ChatGPT, Bing, Perplexity, Gemini, Copilot.
        </figcaption>
      </figure>

      <PullQuote>
        Findability isn&apos;t a Google problem. It&apos;s an everywhere problem. And most businesses are solving for one platform while their customers have already moved to six.
      </PullQuote>

      <h2 id="the-assumption-thats-costing-you">The assumption that&apos;s costing you</h2>

      <p>
        When someone says &ldquo;I need to be found online,&rdquo; what they almost always mean is &ldquo;I need to rank on Google.&rdquo; That made sense in 2015. Google was the front door to the internet. You typed a search, got ten blue links, clicked one.
      </p>

      <p>
        That&apos;s not how people find businesses anymore. Today a potential customer might ask ChatGPT before they ever open Google. They might search Instagram or TikTok. They might check Google Maps, read Reddit threads, or look you up after a friend&apos;s recommendation. <strong>Every one of those moments is a findability moment</strong> — and most businesses are only showing up in one of them.
      </p>

      <p>
        Findability is whether a potential customer — at any moment, on any platform, through any kind of search — can discover that you exist and that you&apos;re worth their time. It&apos;s the signal your business puts out into the world.
      </p>

      <hr />

      <h2 id="the-six-signals">What your signal is actually made of</h2>

      <p>
        When I evaluate a business&apos;s online presence — whether it&apos;s a client engagement or a quick favor for a friend — I look at six things. Not because six is a magic number, but because these are the areas where I&apos;ve watched businesses lose customers they should have won.
      </p>

      <p>
        These are the same six signals the <Link href="/audit" className="guide-cta text-primary no-underline hover:underline">Findability Check</Link> measures. They&apos;re the technical foundation of your signal — the parts that can be diagnosed, scored, and fixed.
      </p>

      {/* 6 audit signals as compact cards */}
      <div className="my-10 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Search, name: 'Search Visibility', desc: 'Can search engines find, read, and rank your pages? Indexing, metadata, site speed, structured data.' },
          { icon: Bot, name: 'AI Readiness', desc: 'Can AI assistants cite and recommend you? Content clarity, schema markup, entity recognition.' },
          { icon: Share2, name: 'Social Sharing', desc: 'When someone shares your link, does it look credible? Open Graph tags, preview images, platform presence.' },
          { icon: Smartphone, name: 'Mobile Experience', desc: 'Does your site work on the device most people use? Responsive design, tap targets, load time.' },
          { icon: Code2, name: 'Site Structure', desc: 'Is your site built so machines and humans can navigate it? Headings, internal links, accessibility, sitemaps.' },
          { icon: Shield, name: 'Security', desc: 'Does your site signal trust at a technical level? HTTPS, security headers, safe browsing status.' },
        ].map(({ icon: Icon, name, desc }) => (
          <div key={name} className="rounded-xl border border-border/20 bg-muted/10 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <p className="font-heading text-sm font-bold text-foreground">{name}</p>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <p>
        These signals are the foundation. If they&apos;re broken, nothing else you do in marketing will work as well as it should. It&apos;s like having a great product in a store with no sign, a locked door, and the lights off. The product is real. But nobody can get to it.
      </p>

      <StatRow
        stats={[
          { value: '53%', label: 'of mobile users leave if a site takes >3s to load' },
          { value: '1B+', label: 'ChatGPT queries per week' },
          { value: '68%', label: 'of online experiences start with search' },
        ]}
      />

      {/* ── Mid-Guide CTA: Findability Check ─────────────────────────── */}
      <div className="my-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10">
        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-foreground md:text-xl">
              How strong is your signal right now?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The Findability Check scores all six signals in under a minute. See exactly where your foundation is solid — and where it&apos;s leaking.
            </p>
            <Link
              href="/audit"
              className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your signal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 id="the-strategic-layer">But a strong foundation isn&apos;t enough</h2>

      <p>
        Here&apos;s where it gets interesting — and where most businesses get stuck.
      </p>

      <p>
        You can score perfectly on every technical signal and still be invisible. Your site loads fast, your SSL is active, your metadata is clean — and nobody&apos;s calling. Because the technical signals tell search engines and AI what your site <em>is</em>. They don&apos;t tell customers why they should <em>care</em>.
      </p>

      <PullQuote>
        The Findability Check tells you where your signal is weak. The real question is <em>why</em> — and what to do about it.
      </PullQuote>

      <p>
        That&apos;s what this series is about. Each guide tackles one of the strategic realities I see business owners wrestle with — the gaps that no audit tool can measure but that determine whether your marketing actually works.
      </p>

      {/* The 6 guide topics as a vertical arc — matches /signal page */}
      <div className="my-10 space-y-4">
        {[
          {
            number: '01',
            headline: 'Findability: The Six Signals Your Site Sends',
            role: 'You\'re here',
            desc: 'The technical foundation — what search engines and AI need to see before strategy can do its work.',
            slug: '/signal/findability',
            published: true,
            current: true,
          },
          {
            number: '02',
            headline: 'You Built a Website. Now It\'s Sitting in the Dark.',
            role: 'Diagnoses',
            desc: 'Your site exists, but search engines can\'t read it and AI can\'t cite it. What your agency never set up — and why it matters.',
            slug: '/signal/search-visibility',
            published: true,
            current: false,
          },
          {
            number: '03',
            headline: 'AI Is Already Recommending Your Competitors.',
            role: 'Creates urgency',
            desc: 'When someone asks ChatGPT for a recommendation in your space, what comes back? The specific signals your site is missing.',
            slug: '/signal/ai-readiness',
            published: true,
            current: false,
          },
          {
            number: '04',
            headline: 'Your Reputation Is Strong. Your Website Doesn\'t Show It.',
            role: 'Shows the gap',
            desc: 'Customers love you. Your website tells a different story. The gap between reputation and online presence is costing you.',
            slug: '/signal/website-trust',
            published: true,
            current: false,
          },
          {
            number: '05',
            headline: 'Every Post You Publish Is Competing With Itself.',
            role: 'Reframes',
            desc: 'You\'re creating content consistently — and it\'s all fighting for the same keywords. More isn\'t better. Structure is.',
            slug: '/signal/content-structure',
            published: true,
            current: false,
          },
          {
            number: '06',
            headline: 'You\'re Doing All the Right Things in the Wrong Order.',
            role: 'Names root cause',
            desc: 'Ads before strategy. Content before positioning. This guide names the root cause — and gives you the sequence.',
            slug: '/signal/strategy-first',
            published: true,
            current: false,
          },
        ].map((guide) => {
          const cardClass = `flex gap-4 rounded-xl border p-5 md:p-6 transition-colors ${
            guide.current
              ? 'border-primary/40 bg-primary/5'
              : 'border-border/20 bg-muted/10 hover:border-primary/25 hover:bg-muted/20'
          }`
          const inner = (
            <>
              <span
                className={`font-heading text-lg font-bold ${
                  guide.current ? 'text-primary' : 'text-primary/30'
                }`}
              >
                {guide.number}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-heading text-sm font-bold text-foreground md:text-base">
                    {guide.headline}
                  </p>
                  {guide.current && (
                    <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-primary">
                      You&apos;re here
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {guide.desc}
                </p>
              </div>
            </>
          )
          return guide.current ? (
            <div key={guide.number} className={cardClass}>
              {inner}
            </div>
          ) : (
            <Link key={guide.number} href={guide.slug} className={`guide-cta no-underline ${cardClass}`}>
              {inner}
            </Link>
          )
        })}
      </div>

      <h2 id="how-it-connects">How the two layers work together</h2>

      <p>
        Think of it this way: the six technical signals are the instrument panel. They tell you whether the engine is running, whether the lights are on, whether the door is unlocked. The six guides are the driving lessons — where to go, why it matters, and what most people get wrong along the way.
      </p>

      {/* Connection table */}
      <div className="my-10 overflow-hidden rounded-xl border border-border/20 bg-muted/10">
        <div className="border-b border-border/10 px-6 py-4">
          <p className="font-heading text-sm font-bold tracking-wide text-primary/80">
            SIGNALS + STRATEGY: HOW THEY CONNECT
          </p>
        </div>
        <div className="divide-y divide-border/10">
          {[
            { signal: 'Search Visibility', guide: 'Guide 02: Your site is sitting in the dark', bridge: 'The audit measures indexing. The guide explains why your agency never set it up.' },
            { signal: 'AI Readiness', guide: 'Guide 03: AI is recommending competitors', bridge: 'The audit checks schema and structure. The guide shows what AI actually needs to cite you.' },
            { signal: 'Social Sharing', guide: 'Guide 04: Reputation vs. website gap', bridge: 'The audit checks OG tags. The guide addresses why your online presence doesn\'t match reality.' },
            { signal: 'Mobile + Structure', guide: 'Guide 05: Content competing with itself', bridge: 'The audit checks technical health. The guide fixes the content architecture underneath.' },
            { signal: 'All 6 signals', guide: 'Guide 06: Right things, wrong order', bridge: 'The audit shows what\'s broken. The guide gives you the sequence to fix it.' },
          ].map((row) => (
            <div key={row.signal} className="flex flex-col gap-1 px-6 py-3.5 md:flex-row md:items-start md:gap-4">
              <span className="w-32 shrink-0 text-sm font-semibold text-foreground">{row.signal}</span>
              <ArrowRight className="hidden h-3 w-3 mt-1.5 text-primary/40 md:block" />
              <div>
                <span className="text-sm text-primary/80">{row.guide}</span>
                <p className="mt-0.5 text-sm text-muted-foreground">{row.bridge}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p>
        A business with strong technical signals <em>and</em> strong strategy compounds in a way that neither layer can achieve alone. Your clean structured data helps AI recommend you — but only if your content gives AI something worth recommending. Your fast, mobile-friendly site keeps visitors — but only if what they find when they arrive matches the reputation they heard about.
      </p>

      <hr />

      <h2 id="what-good-looks-like">What a strong signal actually looks like</h2>

      <p>
        A business with real findability:
      </p>

      <div className="my-8 space-y-3">
        {[
          'Their technical foundation is clean — the audit shows green across all six signals.',
          'Their website clearly communicates what they do, who they help, and why someone should choose them.',
          'Search engines rank them. AI assistants recommend them. Both happen because the content is clear and structured.',
          'When someone gets a referral and looks them up, everything they find matches the reputation they just heard about.',
          'Their content works as a system — not 50 disconnected blog posts competing with each other.',
          'They know what to prioritize. They\'re not doing everything at once. They\'re doing the right things in the right order.',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-border/10 bg-muted/5 px-5 py-3.5">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              {item}
            </p>
          </div>
        ))}
      </div>

      <p>
        That business doesn&apos;t need to spend $10K a month on ads. They don&apos;t need to go viral. They don&apos;t need to be on every platform. They need the foundation right and the strategy clear — and then let the system compound.
      </p>

      <h2 id="the-strategy">Where to start</h2>

      <p>
        If you&apos;re reading this and thinking &ldquo;I have no idea where my signal stands&rdquo; — good. That&apos;s honest. And it&apos;s the right starting point.
      </p>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Measure your foundation',
            body: 'Run the Findability Check. It takes under a minute and scores all six technical signals. Start with the red items — those are actively hurting you.',
          },
          {
            step: '02',
            title: 'Read the guide that matches your biggest gap',
            body: 'If your search scores are low, start with Guide 02. If AI readiness is weak, Guide 03. If your website doesn\'t match your reputation, Guide 04. You don\'t need to read them in order.',
          },
          {
            step: '03',
            title: 'Fix the foundation before the strategy',
            body: 'Technical signals first. If search engines can\'t read your site, no amount of content strategy will help. Get the basics right, then build on them.',
          },
          {
            step: '04',
            title: 'Or skip all of it and talk to someone',
            body: 'If you\'d rather have someone look at the whole picture and tell you what to prioritize — that\'s what the conversation is for.',
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
        This guide opened the aperture. Findability isn&apos;t just about ranking on Google — it&apos;s the full signal your business puts out across every platform where customers are looking. The technical foundation makes you visible. The strategic understanding makes you chosen.
      </p>

      <p>
        Next up: <strong>Guide 02 — You Built a Website. Now It&apos;s Sitting in the Dark.</strong> We&apos;ll dig into the most common reason businesses are invisible online — and it&apos;s not what most people think.
      </p>

      {/* ── Closing CTA ─────────────────────────────────────────────── */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
        <p className="font-heading text-lg font-bold text-foreground md:text-xl">
          Ready to see where you stand?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          The Findability Check measures all six signals in under a minute. Start with your score — then read the guide that matters most.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/audit"
            className="guide-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Check your signal <ArrowRight className="h-4 w-4" />
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
