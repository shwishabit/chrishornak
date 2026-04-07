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

export function ContentStructureGuide() {
  return (
    <>
      <p>
        A marketing manager I work with — sharp, disciplined, consistent — came to me frustrated. Her team had been publishing two blog posts a week for over a year. More than a hundred articles. Traffic was flat. Rankings were actually declining.
      </p>

      <p>
        She thought she needed more content. Better writers, maybe. A bigger budget. Her agency was recommending they increase to three posts a week.
      </p>

      <p>
        I pulled up her analytics and showed her something she hadn&apos;t noticed: twelve of her blog posts were all targeting the same keyword. &ldquo;Small business marketing tips.&rdquo; Each written at a different time, by a different writer, with slightly different angles — but all competing for the same search query. Google didn&apos;t know which one to rank. So it ranked none of them well.
      </p>

      <p>
        Her content wasn&apos;t underperforming. It was fighting itself.
      </p>

      <PullQuote>
        The problem isn&apos;t that you&apos;re not creating enough content. The problem is that every piece you publish is competing with the last one — and Google can&apos;t tell which one matters.
      </PullQuote>

      <h2 id="what-content-cannibalization-looks-like">What content cannibalization actually looks like</h2>

      <p>
        Content cannibalization sounds technical, but the concept is simple: when multiple pages on your site target the same topic, they split the signal. Instead of one strong page ranking well, you have five mediocre pages ranking poorly — or not at all.
      </p>

      <p>
        It happens gradually. You write a blog post about &ldquo;how to improve local SEO.&rdquo; Six months later, someone writes &ldquo;local SEO tips for small businesses.&rdquo; Three months after that, &ldquo;the complete guide to local SEO.&rdquo; Each one felt fresh when it was published. But to Google, they&apos;re all saying the same thing — and Google doesn&apos;t reward redundancy. It punishes it.
      </p>

      <p>
        The result: your domain has fifty pieces of content and the authority of five. All that effort, all those words, working against each other instead of compounding.
      </p>

      <StatRow
        stats={[
          { value: '60%+', label: 'of business blogs have cannibalization issues' },
          { value: '12', label: 'posts targeting the same keyword (real client example)' },
          { value: '0', label: 'of those 12 posts ranked in the top 10' },
        ]}
      />

      <h2 id="why-more-content-makes-it-worse">Why &ldquo;publish more&rdquo; makes it worse</h2>

      <p>
        The standard advice from most agencies and marketing playbooks is simple: publish consistently. More content equals more traffic. It&apos;s a volume game.
      </p>

      <p>
        That advice made sense when the internet had less competition and Google rewarded freshness over depth. It doesn&apos;t hold up anymore. Google&apos;s algorithm has shifted dramatically toward topical authority — rewarding sites that demonstrate deep, organized expertise on specific topics over sites that spray thin content across a hundred different keywords.
      </p>

      <p>
        Publishing more without structure is like adding more roads to a city with no map. More paths, more confusion, more dead ends. The traffic doesn&apos;t flow better — it fragments.
      </p>

      <PullQuote>
        Content without structure is just noise with a publish date. The businesses that win in search aren&apos;t publishing the most — they&apos;re publishing the most organized.
      </PullQuote>

      <h2 id="how-content-should-be-structured">How content should actually be structured</h2>

      <p>
        The model that works — and the one Google explicitly rewards — is called hub-and-spoke. One comprehensive pillar page sits at the center of a topic. Surrounding it are specific, focused articles that go deep on subtopics. They all link to each other in a clear hierarchy.
      </p>

      <p>
        Think of it like a textbook. The pillar page is the chapter overview. The spoke articles are the sections within the chapter. Together, they tell Google: &ldquo;This site knows this topic thoroughly, from the overview down to the details.&rdquo;
      </p>

      {/* In-body figure: cannibalization vs hub-and-spoke */}
      <div className="my-10 rounded-xl border border-border/20 bg-muted/10 p-6 md:p-8">
        <p className="font-heading text-[11px] font-bold uppercase tracking-widest text-primary/70">
          Cannibalization vs hub-and-spoke
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* LEFT: cannibalization */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              What you have now
            </p>
            <div className="mt-2 rounded-lg border border-border/15 bg-background/40 p-4">
              <svg viewBox="0 0 200 140" className="h-auto w-full">
                {/* Scattered, overlapping post dots — all chasing the same target */}
                {[
                  { x: 60, y: 50 }, { x: 80, y: 45 }, { x: 95, y: 60 },
                  { x: 70, y: 70 }, { x: 110, y: 50 }, { x: 90, y: 80 },
                  { x: 130, y: 55 }, { x: 75, y: 90 }, { x: 115, y: 75 },
                  { x: 100, y: 95 }, { x: 125, y: 85 }, { x: 85, y: 105 },
                ].map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={9}
                    fill="white"
                    fillOpacity={0.18}
                    stroke="white"
                    strokeOpacity={0.25}
                    strokeWidth={0.8}
                  />
                ))}
                {/* The single keyword they're all fighting over */}
                <text x={100} y={130} textAnchor="middle" fill="white" fillOpacity={0.45} fontSize={9} fontFamily="ui-monospace, monospace">
                  &quot;how to fix a leaky faucet&quot;
                </text>
              </svg>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              12 posts, one keyword. Google can&apos;t pick a winner.
            </p>
          </div>

          {/* RIGHT: hub and spoke */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              What you need
            </p>
            <div className="mt-2 rounded-lg border border-border/15 bg-background/40 p-4">
              <svg viewBox="0 0 200 140" className="h-auto w-full">
                {/* Spoke connector lines */}
                {[
                  { x: 100, y: 25 },
                  { x: 165, y: 50 },
                  { x: 150, y: 110 },
                  { x: 50, y: 110 },
                  { x: 35, y: 50 },
                ].map((s, i) => (
                  <line
                    key={`l-${i}`}
                    x1={100}
                    y1={70}
                    x2={s.x}
                    y2={s.y}
                    stroke="#2dd4a8"
                    strokeOpacity={0.35}
                    strokeWidth={1}
                  />
                ))}

                {/* Spoke nodes */}
                {[
                  { x: 100, y: 25 },
                  { x: 165, y: 50 },
                  { x: 150, y: 110 },
                  { x: 50, y: 110 },
                  { x: 35, y: 50 },
                ].map((s, i) => (
                  <circle
                    key={`s-${i}`}
                    cx={s.x}
                    cy={s.y}
                    r={9}
                    fill="white"
                    fillOpacity={0.25}
                    stroke="white"
                    strokeOpacity={0.4}
                    strokeWidth={1}
                  />
                ))}

                {/* Pillar */}
                <circle cx={100} cy={70} r={20} fill="#2dd4a8" fillOpacity={0.18} />
                <circle cx={100} cy={70} r={14} fill="#2dd4a8" fillOpacity={0.6} />
                <text x={100} y={73} textAnchor="middle" fill="#0a0a0a" fontSize={8} fontWeight={700} fontFamily="system-ui, sans-serif">
                  PILLAR
                </text>

                <text x={100} y={130} textAnchor="middle" fill="white" fillOpacity={0.45} fontSize={9} fontFamily="ui-monospace, monospace">
                  one topic, organized
                </text>
              </svg>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground/70">
              One pillar, five focused spokes. Authority compounds.
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Same number of posts. Same effort. The only difference is whether they reinforce each other or split the signal.
        </p>
      </div>

      <div className="my-10 space-y-5">
        {[
          {
            title: 'One pillar page per core topic',
            body: 'This is your comprehensive resource — 2,000 to 5,000 words covering the full topic. It defines your authority on that subject. You have one, and everything else points to it.',
          },
          {
            title: 'Spoke articles go deep on subtopics',
            body: 'Each spoke answers one specific question or covers one narrow angle. "How to set up Google Business Profile" is a spoke under a "Local SEO" pillar. It links back to the pillar. The pillar links out to it. The hierarchy is explicit.',
          },
          {
            title: 'Every page has one job',
            body: 'A page targets one primary keyword. Period. If you have three pages targeting "email marketing for restaurants," two of them need to be consolidated or redirected. One strong page beats three competing ones every time.',
          },
          {
            title: 'Internal links create the map',
            body: 'Without internal links, your content is a pile of disconnected documents. With strategic internal linking, it\'s a structured network that tells both Google and visitors how your content relates. The pillar links to the spokes. The spokes link to each other. Every page is connected.',
          },
          {
            title: 'Old content gets updated, not duplicated',
            body: 'When a topic needs refreshing, update the existing page. Don\'t publish a new one with a 2026 date and let the old one rot. Two pages on the same topic = cannibalization. One page that gets regularly updated = authority.',
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

      {/* Mid-Guide CTA */}
      <div className="my-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10">
        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-foreground md:text-xl">
              Is your content working together or against itself?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The Findability Check evaluates your site structure, heading hierarchy, and internal linking — the technical foundation that content architecture is built on.
            </p>
            <Link
              href="/audit"
              className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your structure <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 id="the-content-audit">The content audit nobody wants to do</h2>

      <p>
        Before you publish another word, you need to know what you already have. That means a content audit — and I know that sounds about as exciting as a tax filing. But it&apos;s the single most valuable exercise you can do for your content strategy.
      </p>

      <p>
        Pull every URL from your blog or content section. For each one, write down: the target keyword, the publish date, the last update, and the monthly traffic. Now sort by keyword. You&apos;ll find clusters — three posts about the same thing, five posts about related things that never link to each other, and a dozen posts that get zero traffic because they&apos;re not about anything specific enough to rank.
      </p>

      <p>
        That&apos;s your map. And it tells you exactly what to do next:
      </p>

      <div className="my-10 overflow-hidden rounded-xl border border-border/20 bg-muted/10">
        <div className="border-b border-border/10 px-6 py-4">
          <p className="font-heading text-sm font-bold tracking-wide text-primary/80">
            WHAT TO DO WITH WHAT YOU FIND
          </p>
        </div>
        <div className="divide-y divide-border/10">
          {[
            { find: 'Multiple posts targeting the same keyword', fix: 'Consolidate into one strong page. Redirect the others.' },
            { find: 'Related posts that don\'t link to each other', fix: 'Add internal links. Create a pillar page that ties them together.' },
            { find: 'Posts with zero traffic and no strategic value', fix: 'Delete or merge. Dead content dilutes your domain authority.' },
            { find: 'Outdated content that still ranks', fix: 'Update it. Refresh the data, add new insights, keep the URL.' },
            { find: 'Topic gaps where you have no content', fix: 'Write it — once, well, within your hub-and-spoke structure.' },
          ].map((row) => (
            <div key={row.find} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-red-400/60">Find</span>
                <p className="mt-1 text-sm text-muted-foreground">{row.find}</p>
              </div>
              <ArrowRight className="hidden h-4 w-4 mt-5 text-primary/40 md:block" />
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-primary/60">Fix</span>
                <p className="mt-1 text-sm text-foreground/90">{row.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 id="quality-over-quantity">The counterintuitive truth about less content</h2>

      <p>
        Here&apos;s the part that feels wrong: after a content audit, most businesses should have <em>fewer</em> pages, not more. Consolidating three weak posts into one strong one doesn&apos;t feel productive. Deleting content you paid for feels wasteful. But the math doesn&apos;t lie.
      </p>

      <PullQuote>
        One definitive page that ranks #3 for a high-intent keyword will generate more business than fifty pages that rank nowhere. The goal isn&apos;t more content. It&apos;s the right content, in the right structure, doing the right job.
      </PullQuote>

      <p>
        I&apos;ve watched businesses cut their blog from 200 posts to 40 and see their organic traffic double within six months. Not because they lost content — because they stopped diluting their own authority. The 40 remaining pages were stronger, better linked, and clearly organized. Google rewarded the clarity.
      </p>

      <hr />

      <h2 id="where-to-start">Where to start</h2>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Audit what you have',
            body: 'Export every content URL. Map each to a target keyword. Find the overlaps, the orphans, and the dead weight. This is the foundation for everything else.',
          },
          {
            step: '02',
            title: 'Identify your 3-5 core topics',
            body: 'What are the main things your business should be known for? Each one becomes a pillar. Everything else is a spoke. If a piece of content doesn\'t fit into a pillar, it probably doesn\'t need to exist.',
          },
          {
            step: '03',
            title: 'Consolidate before you create',
            body: 'Merge competing pages. Redirect old URLs to the consolidated version. Update the surviving page with the best insights from each. You\'ll be amazed how much stronger one page is than three.',
          },
          {
            step: '04',
            title: 'Build the internal link network',
            body: 'Every spoke links to its pillar. Every pillar links to its spokes. Related spokes link to each other. This isn\'t busy work — it\'s the architecture that tells Google you\'re an authority on these topics.',
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
        This guide reframed the content problem: it&apos;s not volume, it&apos;s structure. Your content should work as a system — each piece supporting the others, none competing, all compounding toward authority on the topics that matter to your business.
      </p>

      <p>
        But even the best content structure can&apos;t save you if you&apos;re executing in the wrong order. Ads before strategy. Content before positioning. A new website before knowing what it should say. The final guide names the root cause most businesses miss.
      </p>

      <p>
        Next up: <strong>Guide 06 — You&apos;re Doing All the Right Things in the Wrong Order.</strong> The sequence matters more than the tactics.
      </p>

      {/* Closing CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
        <p className="font-heading text-lg font-bold text-foreground md:text-xl">
          Is your content competing with itself?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          The Findability Check evaluates your site structure, heading hierarchy, and the technical foundation your content sits on. Start there — then build the architecture.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/audit"
            className="guide-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Check your structure <ArrowRight className="h-4 w-4" />
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
