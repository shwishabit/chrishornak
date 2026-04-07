'use client'

import Link from 'next/link'
import { ArrowRight, FileText, Map, Tag, Gauge, Code2, Eye } from 'lucide-react'

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

export function SearchVisibilityGuide() {
  return (
    <>
      <p>
        A friend of mine — a contractor, does great work, word-of-mouth keeps him busy — called me last year. He&apos;d finally spent real money on a website. Professional design, nice photography, the works. Looked sharp. He was proud of it.
      </p>

      <p>
        Six months later, nothing. No calls from the site. No contact form submissions. Not a single lead that didn&apos;t come from someone who already knew his name.
      </p>

      <p>
        He asked me to take a look. Took me about 90 seconds to find the problem.
      </p>

      <p>
        His agency had built a beautiful website. Then they&apos;d left the lights off.
      </p>

      <h2 id="having-a-website-is-not-being-online">Having a website is not the same as being online</h2>

      <p>
        This is the most common disconnect I see with small businesses, and it costs them more than they realize. They invest in a website — sometimes $5K, sometimes $20K — and assume the job is done. The site is live. It&apos;s on the internet. Therefore people will find it.
      </p>

      <p>
        That&apos;s like opening a store, hanging no sign, putting no address on Google Maps, and wondering why foot traffic is zero. The building exists. But nobody knows it&apos;s there.
      </p>

      <PullQuote>
        &ldquo;Live&rdquo; and &ldquo;findable&rdquo; are two completely different things. Your website can exist on the internet and still be invisible to every search engine, every AI assistant, and every potential customer who doesn&apos;t already have your URL.
      </PullQuote>

      <p>
        Most web agencies are hired to make something look good. And they do. The design is clean, the photos are professional, the homepage reads well. But &ldquo;looking good&rdquo; and &ldquo;being findable&rdquo; are two different skill sets — and most agencies specialize in the first one.
      </p>

      <p>
        The result: a beautiful building with no address.
      </p>

      <hr />

      <h2 id="what-sitting-in-the-dark-means">What &ldquo;sitting in the dark&rdquo; actually means</h2>

      <p>
        When I say a website is sitting in the dark, I mean something specific. I mean the infrastructure that makes a site visible to machines — search engines, AI assistants, social platforms — was never set up or was set up wrong.
      </p>

      <p>
        This isn&apos;t about content quality. It&apos;s not about design. It&apos;s about whether the plumbing works.
      </p>

      <p>
        Search engines don&apos;t see websites the way you do. You see colors, layout, photos. A search engine sees code. And if the code doesn&apos;t tell the search engine what your pages are about, who they&apos;re for, and how they&apos;re organized — the search engine moves on. You don&apos;t rank. You don&apos;t appear. You don&apos;t exist in the results.
      </p>

      <p>
        Same with AI. When someone asks ChatGPT for a recommendation, it pulls from structured, well-organized content. If your site doesn&apos;t provide that structure, AI has nothing to cite. Your competitor down the street with worse reviews but better infrastructure gets the mention.
      </p>

      <p>
        That&apos;s what &ldquo;sitting in the dark&rdquo; looks like. It&apos;s not broken. It was never turned on.
      </p>

      {/* In-body figure: same page, two viewers */}
      <div className="my-10 rounded-xl border border-border/20 bg-muted/10 p-6 md:p-8">
        <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-primary/70">
          Same page, two viewers
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* What humans see */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              What you see
            </p>
            <div className="mt-2 space-y-2 rounded-lg border border-border/15 bg-background/40 p-4">
              <div className="h-2 w-3/5 rounded bg-foreground/70" />
              <div className="h-1.5 w-4/5 rounded bg-foreground/30" />
              <div className="h-1.5 w-3/4 rounded bg-foreground/30" />
              <div className="mt-3 h-16 rounded bg-foreground/10" />
              <div className="mt-2 inline-block h-5 rounded bg-primary/40 px-3" style={{ width: '70px' }} />
              <div className="mt-2 grid grid-cols-3 gap-2 pt-1">
                <div className="h-8 rounded bg-foreground/10" />
                <div className="h-8 rounded bg-foreground/10" />
                <div className="h-8 rounded bg-foreground/10" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              Hero, image, button, three feature cards.
            </p>
          </div>

          {/* What Google sees */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              What Google sees
            </p>
            <div className="mt-2 space-y-1.5 rounded-lg border border-border/15 bg-background/40 p-4 font-mono text-[11px] leading-relaxed">
              <div>
                <span className="text-muted-foreground/60">{'<title>'}</span>
                <span className="text-foreground/70"> Home | Your Company </span>
                <span className="text-muted-foreground/60">{'</title>'}</span>
              </div>
              <div>
                <span className="text-muted-foreground/60">{'<meta description='}</span>
                <span className="text-red-400/70">missing</span>
                <span className="text-muted-foreground/60">{' />'}</span>
              </div>
              <div>
                <span className="text-muted-foreground/60">{'<h1>'}</span>
                <span className="text-red-400/70"> none </span>
                <span className="text-muted-foreground/60">{'</h1>'}</span>
              </div>
              <div>
                <span className="text-muted-foreground/60">{'<img alt='}</span>
                <span className="text-red-400/70">&quot;&quot;</span>
                <span className="text-muted-foreground/60">{' />'}</span>
              </div>
              <div>
                <span className="text-muted-foreground/60">schema:</span>
                <span className="text-red-400/70"> none</span>
              </div>
              <div>
                <span className="text-muted-foreground/60">sitemap:</span>
                <span className="text-red-400/70"> not submitted</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              A page with no name, no headline, no structure.
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Both panels are the same URL. The left side is what your designer delivered. The right side is what every search engine and AI crawler actually sees. The gap is the reason you don&apos;t rank.
        </p>
      </div>

      <h2 id="what-your-agency-never-set-up">The six things your agency probably never set up</h2>

      <p>
        I&apos;ve audited hundreds of small business websites. The same gaps show up over and over. Not because agencies are lazy — most of them simply don&apos;t think of these as their job. They were hired to build a website, not to make it findable.
      </p>

      <p>
        Here&apos;s what&apos;s usually missing:
      </p>

      <div className="my-10 space-y-5">
        {[
          {
            icon: Tag,
            title: 'Title tags and meta descriptions',
            body: 'Every page needs a unique title tag (the line that shows up in search results) and a meta description (the two-line summary underneath). Most agency sites either have the same generic title on every page — "Home | Company Name" — or no meta descriptions at all. Search engines use these to decide what your page is about. If they\'re missing, Google writes its own — and Google\'s version is usually terrible.',
          },
          {
            icon: Map,
            title: 'A sitemap',
            body: 'A sitemap is a file that lists every page on your site. You submit it to Google, and it tells search engines exactly what to crawl. Without one, Google has to discover your pages on its own — if it finds them at all. Most agency sites don\'t have one. The ones that do often have an outdated version that hasn\'t been regenerated since launch.',
          },
          {
            icon: FileText,
            title: 'Robots.txt done right',
            body: 'This tiny file tells search engines what they\'re allowed to crawl. A bad robots.txt can accidentally block your entire site from search results. I\'ve seen it happen — an agency leaving "Disallow: /" in the file from the staging environment, which tells Google "don\'t index anything." The site looks fine to humans. It\'s invisible to search engines.',
          },
          {
            icon: Code2,
            title: 'Structured data',
            body: 'Structured data (also called schema markup) is code that tells search engines and AI exactly what your business is, where you\'re located, what services you offer, and what people say about you. It\'s the difference between Google knowing your page contains text and Google knowing your page is about a plumbing company in Denver with 4.8 stars. Most small business sites have zero structured data.',
          },
          {
            icon: Eye,
            title: 'Heading structure',
            body: 'H1, H2, H3 — these aren\'t just font sizes. They\'re a hierarchy that tells search engines how your content is organized. When an agency uses an H1 for the hero image caption and an H3 for the main headline because it "looked better," they\'ve scrambled the only table of contents a search engine can read.',
          },
          {
            icon: Gauge,
            title: 'Page speed basics',
            body: 'A beautiful site that takes 8 seconds to load on a phone is a site that 53% of visitors will abandon before it renders. Uncompressed images, render-blocking scripts, no lazy loading — these are the performance killers agencies leave behind because the site loaded fine on their office Wi-Fi.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 rounded-xl border border-border/20 bg-muted/10 p-5 md:p-6">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="font-heading text-sm font-bold text-foreground md:text-base">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p>
        None of this is rocket science. Every item on that list is a solved problem — well-documented, widely understood in the SEO world. But for the business owner who just spent $15K on a website and assumed &ldquo;it&apos;s handled,&rdquo; these gaps are invisible until someone points them out.
      </p>

      <StatRow
        stats={[
          { value: '73%', label: 'of small business sites I audit have missing or duplicate title tags' },
          { value: '0', label: 'structured data on the average agency-built SMB site' },
          { value: '4.2s', label: 'average mobile load time for agency-built sites' },
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
              Is your site sitting in the dark?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The Findability Check tests for every issue on this list — title tags, sitemap, structured data, page speed, and more. Takes under a minute. No signup.
            </p>
            <Link
              href="/audit"
              className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your site <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 id="why-agencies-skip-this">Why agencies skip this stuff</h2>

      <p>
        I want to be fair here, because I&apos;ve worked alongside plenty of good web agencies. The gap isn&apos;t usually about competence. It&apos;s about incentives.
      </p>

      <p>
        A web design agency gets hired to deliver a website. The project has a timeline, a budget, and a set of deliverables. The client approved the homepage mockup, signed off on the design, and reviewed the copy. The site launches. Invoice sent. Everyone celebrates.
      </p>

      <p>
        But nobody scoped &ldquo;submit the sitemap to Google Search Console.&rdquo; Nobody budgeted for writing unique meta descriptions for 15 pages. Nobody included &ldquo;add LocalBusiness schema markup&rdquo; in the contract. These tasks feel like maintenance — or they feel like SEO work, which is a different contract entirely.
      </p>

      <PullQuote>
        The agency delivered what they were hired to build. The problem is that what most businesses need isn&apos;t what most agencies are hired to do.
      </PullQuote>

      <p>
        And here&apos;s the uncomfortable truth: many businesses don&apos;t even know these gaps exist. If no one told you that a sitemap is important, you&apos;d never think to ask for one. If your site looks great on your phone, you&apos;d never suspect that Google can&apos;t read it. The gaps are silent. The site works. Nobody calls. And the business owner blames the market, the economy, or their own marketing — instead of the infrastructure nobody set up.
      </p>

      <hr />

      <h2 id="turning-the-lights-on">What turning the lights on actually looks like</h2>

      <p>
        The good news: this is fixable. Every item on the list above is a one-time setup. You don&apos;t need to rebuild your site. You don&apos;t need a new agency. You need someone to turn on the things that should have been turned on from the start.
      </p>

      <p>
        Here&apos;s what changes when the lights come on:
      </p>

      <div className="my-10 overflow-hidden rounded-xl border border-border/20 bg-muted/10">
        <div className="border-b border-border/10 px-6 py-4">
          <p className="font-heading text-sm font-bold tracking-wide text-primary/80">
            BEFORE &amp; AFTER: THE SAME SITE, DIFFERENT INFRASTRUCTURE
          </p>
        </div>
        <div className="divide-y divide-border/10">
          {[
            { before: 'Every page titled "Home | Your Company"', after: 'Unique titles that tell Google exactly what each page is about' },
            { before: 'No sitemap — Google discovers pages by accident', after: 'Sitemap submitted, every page indexed within days' },
            { before: 'Zero structured data — Google sees text, not a business', after: 'Schema markup tells Google your name, location, reviews, services' },
            { before: '8-second mobile load — 53% of visitors leave', after: 'Under 3 seconds — images compressed, scripts deferred, lazy loading' },
            { before: 'Headings chosen for appearance, not hierarchy', after: 'Clean H1→H2→H3 structure that search engines can parse' },
            { before: 'Shared on social: broken preview, no image', after: 'Rich previews with title, description, branded image on every platform' },
          ].map((row) => (
            <div key={row.before} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-red-400/60">Before</span>
                <p className="mt-1 text-sm text-muted-foreground">{row.before}</p>
              </div>
              <ArrowRight className="hidden h-4 w-4 mt-5 text-primary/40 md:block" />
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-primary/60">After</span>
                <p className="mt-1 text-sm text-foreground/90">{row.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p>
        None of these changes require a redesign. They don&apos;t change how your site looks to a human visitor. They change how your site looks to machines — and machines are the gatekeepers to every new customer who doesn&apos;t already know your name.
      </p>

      <h2 id="the-compound-effect">Why this compounds</h2>

      <p>
        Here&apos;s what people miss about search visibility: it&apos;s not a one-time boost. It&apos;s a permanent shift in how your business appears in the world.
      </p>

      <p>
        A properly indexed site with clean structured data and fast load times earns trust from search engines over time. Each page you add inherits the credibility of the domain. Your Google Business Profile connects to your website, which connects to your schema markup, which tells AI assistants what you do. The signals reinforce each other.
      </p>

      <p>
        A site sitting in the dark doesn&apos;t compound. It decays. Every month without a sitemap is another month Google doesn&apos;t know your new pages exist. Every week without structured data is another week AI assistants recommend your competitor instead. The gap between visible and invisible doesn&apos;t stay static — it widens.
      </p>

      <PullQuote>
        Search visibility isn&apos;t a tactic. It&apos;s infrastructure. Get it right once, and everything you do in marketing works better. Leave it broken, and everything you do works harder than it should.
      </PullQuote>

      <h2 id="where-to-start">Where to start</h2>

      <p>
        If you&apos;re reading this and thinking &ldquo;I bet my site has half these problems&rdquo; — you&apos;re probably right. Most do. Here&apos;s the order that matters:
      </p>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Run the Findability Check',
            body: 'It tests for every issue in this guide — title tags, sitemap, structured data, page speed, heading structure, and more. Start with the red items. Those are the lights that need turning on first.',
          },
          {
            step: '02',
            title: 'Fix the access issues first',
            body: 'If your robots.txt is blocking search engines, nothing else matters until that\'s fixed. Same with a missing sitemap. These are the "can Google even find you" basics.',
          },
          {
            step: '03',
            title: 'Add the identity layer',
            body: 'Title tags, meta descriptions, structured data — this is how you tell search engines and AI who you are. It\'s the difference between being a random page of text and being a business with a name, location, and reputation.',
          },
          {
            step: '04',
            title: 'Then worry about speed and polish',
            body: 'Page speed, image optimization, heading structure. These matter — but only after the access and identity layers are in place. Don\'t optimize the paint job on a building that still has no address.',
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
        This guide covered the foundation — the infrastructure that makes your website visible to search engines, AI assistants, and every platform where customers are looking. It&apos;s the first thing to fix because nothing else works without it.
      </p>

      <p>
        But being visible is only half the equation. Showing up is step one. Being <em>chosen</em> when AI assistants recommend businesses in your space — that&apos;s step two.
      </p>

      <p>
        Next up: <strong>Guide 03 — AI Is Already Recommending Your Competitors.</strong> We&apos;ll look at what AI assistants actually need to cite your business — and why most sites give them nothing to work with.
      </p>

      {/* Closing CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
        <p className="font-heading text-lg font-bold text-foreground md:text-xl">
          Find out what your agency left in the dark.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          The Findability Check scores every signal from this guide — title tags, sitemap, structured data, speed, and more. Free. Under a minute.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/audit"
            className="guide-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Check your site <ArrowRight className="h-4 w-4" />
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
