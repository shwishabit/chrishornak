'use client'

import Link from 'next/link'
import { WebsiteTrustDiagram } from './WebsiteTrustDiagram'
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

export function WebsiteTrustGuide() {
  return (
    <>
      <p>
        A friend referred you. They said you were the best they&apos;ve ever worked with. The potential customer is already sold — all they need to do is look you up and reach out.
      </p>

      <p>
        So they Google your name. They find your website. And in about four seconds, something shifts. The site looks dated. The copy is vague. There&apos;s a stock photo of people shaking hands. No testimonials. No clear explanation of what you actually do. The &ldquo;About&rdquo; page reads like it was written in 2017.
      </p>

      <p>
        They don&apos;t call.
      </p>

      <p>
        Not because the referral was wrong. Not because you&apos;re bad at what you do. But because your website told a different story than your reputation — and the website won.
      </p>

      <figure className="my-10">
        <WebsiteTrustDiagram />
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          The trust gap: a 4.9-star reputation above, a missing signal below.
        </figcaption>
      </figure>

      <PullQuote>
        Your website isn&apos;t just a brochure. It&apos;s the place where every referral, every Google search, and every AI recommendation goes to decide whether to trust you. If it doesn&apos;t match your reputation, you lose customers you&apos;ll never know about.
      </PullQuote>

      <h2 id="the-trust-gap">The gap nobody talks about</h2>

      <p>
        I call this the trust gap: the distance between what customers say about you and what your website communicates. Every business has a reputation — built through years of good work, word of mouth, repeat customers, five-star reviews. And almost every small business I work with has a website that dramatically undersells that reputation.
      </p>

      <p>
        The trust gap is invisible to you because you live inside your reputation. You know the quality of your work. You know what clients say. You don&apos;t look at your own website the way a stranger does — with no context, no history, no relationship. Just a first impression.
      </p>

      <p>
        And first impressions on the web are brutal. Research consistently shows that visitors form a judgment about a website&apos;s credibility within 50 milliseconds. Not seconds — <em>milliseconds</em>. Before they read a word of copy, they&apos;ve already decided whether your business looks legitimate.
      </p>

      <StatRow
        stats={[
          { value: '75%', label: 'of users judge credibility based on website design' },
          { value: '50ms', label: 'to form a first impression of a website' },
          { value: '88%', label: 'of visitors won\'t return after a bad experience' },
        ]}
      />

      <h2 id="what-trust-actually-looks-like">What trust actually looks like on a website</h2>

      <p>
        Trust isn&apos;t one thing. It&apos;s a stack of signals — some visual, some technical, some psychological — that together tell a visitor: &ldquo;This business is real, competent, and worth my time.&rdquo; When the stack is strong, visitors convert. When pieces are missing, they leave. Usually without knowing exactly why.
      </p>

      <p>
        Here are the trust signals that matter most — and the ones I see missing on almost every small business site I audit:
      </p>

      <div className="my-10 space-y-5">
        {[
          {
            title: 'Social proof that\'s specific',
            body: '"Great service!" means nothing. "Chris helped us increase our leads by 40% in three months" means everything. Testimonials need names, titles, companies, and specific results. A quote without attribution looks fabricated — even when it\'s real.',
          },
          {
            title: 'Visual credibility',
            body: 'Design is a trust signal whether you like it or not. A site that looks like it was built in 2015 signals a business that hasn\'t invested in itself. You don\'t need to win design awards. You need clean typography, professional imagery, and a layout that doesn\'t feel cramped or dated.',
          },
          {
            title: 'Clear positioning',
            body: 'A visitor should know within five seconds what you do, who you do it for, and why you\'re different. "We provide innovative solutions for your business needs" fails all three tests. "We\'re a Denver accounting firm for restaurants and food service businesses" passes all three.',
          },
          {
            title: 'Proof of work',
            body: 'Case studies, client logos, portfolio pieces, metrics — anything that shows you\'ve actually done the thing you claim to do. A services page without proof is a claim. A services page with proof is credibility.',
          },
          {
            title: 'Technical trust signals',
            body: 'HTTPS, fast load times, no broken links, no security warnings. These are table stakes. A site with "Not Secure" in the address bar tells visitors your business doesn\'t pay attention to details — even if you do.',
          },
          {
            title: 'Consistent identity',
            body: 'Your website, your Google Business Profile, your social media, your directory listings — they should all tell the same story. Inconsistent business names, different phone numbers, mismatched descriptions. These gaps erode trust with both humans and machines.',
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
              Does your website match your reputation?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The Findability Check scores your technical trust signals — HTTPS, security headers, page speed, structured data. It won&apos;t judge your design, but it&apos;ll tell you whether the foundation is solid.
            </p>
            <Link
              href="/audit"
              className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your trust signals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 id="the-referral-test">The referral test</h2>

      <p>
        Here&apos;s the simplest way to understand whether your website has a trust gap: think about the last time someone referred a customer to you. That referral came with built-in trust — &ldquo;You should call Sarah, she&apos;s amazing.&rdquo; The customer was already 80% of the way to hiring you.
      </p>

      <p>
        Now imagine that customer Googles your name before calling. They find your website. Does it reinforce the referral — &ldquo;Oh, this looks great, exactly what I expected&rdquo; — or does it create doubt?
      </p>

      <p>
        That&apos;s the referral test. And most small business websites fail it. Not dramatically — not with broken pages or error messages. They fail it quietly, with dated design, vague copy, missing testimonials, and a general feeling of &ldquo;this doesn&apos;t quite match what I was told.&rdquo;
      </p>

      <PullQuote>
        You don&apos;t need your website to generate leads from scratch. You need it to not kill the leads that are already coming to you. That&apos;s a lower bar — and most businesses still don&apos;t clear it.
      </PullQuote>

      <h2 id="why-good-businesses-have-bad-sites">Why good businesses have bad websites</h2>

      <p>
        It&apos;s not laziness. It&apos;s priorities.
      </p>

      <p>
        When you&apos;re running a business and serving clients, the website is never the most urgent thing. There&apos;s always a more pressing project, a bigger client need, a more immediate fire. The site was &ldquo;good enough&rdquo; when it launched, and now it&apos;s three years old and nobody&apos;s touched it.
      </p>

      <p>
        But &ldquo;good enough three years ago&rdquo; is &ldquo;dated&rdquo; today. Web design conventions move fast. Visitor expectations move faster. A site that felt modern in 2022 can feel neglected in 2026 — not because anything broke, but because the standards shifted.
      </p>

      <p>
        The other reason: most business owners don&apos;t look at their own website through a stranger&apos;s eyes. They see their own context — their years of experience, their client relationships, their reputation. A visitor sees none of that. They see what the site shows them. And if the site shows them generic stock photos, a wall of text about &ldquo;our commitment to excellence,&rdquo; and no evidence of real work — they leave.
      </p>

      <hr />

      <h2 id="closing-the-gap">How to close the trust gap</h2>

      <p>
        The fix isn&apos;t always a redesign. Sometimes it&apos;s targeted improvements that bring your site in line with the reputation you&apos;ve already earned. Here&apos;s what to prioritize:
      </p>

      <div className="my-10 overflow-hidden rounded-xl border border-border/20 bg-muted/10">
        <div className="border-b border-border/10 px-6 py-4">
          <p className="font-heading text-sm font-bold tracking-wide text-primary/80">
            TRUST GAP VS. TRUST MATCH
          </p>
        </div>
        <div className="divide-y divide-border/10">
          {[
            { gap: 'Testimonials with no names or context', match: 'Full quotes with name, title, company, and specific results' },
            { gap: 'Stock photos of handshakes and skylines', match: 'Real photos of your team, your work, your space' },
            { gap: '"We help businesses grow" on your homepage', match: 'Specific positioning: who you serve, what you do, where' },
            { gap: 'Services page with a bullet list', match: 'Services page with proof — case studies, metrics, client logos' },
            { gap: '"Not Secure" in the browser bar', match: 'HTTPS, security headers, fast load, no warnings' },
            { gap: 'Different name/phone on Google vs. your site', match: 'Consistent NAP across every platform and directory' },
          ].map((row) => (
            <div key={row.gap} className="flex flex-col gap-2 px-6 py-4 md:flex-row md:items-start md:gap-6">
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-red-400/60">Gap</span>
                <p className="mt-1 text-sm text-muted-foreground">{row.gap}</p>
              </div>
              <ArrowRight className="hidden h-4 w-4 mt-5 text-primary/40 md:block" />
              <div className="flex-1">
                <span className="text-xs font-medium uppercase tracking-wide text-primary/60">Match</span>
                <p className="mt-1 text-sm text-foreground/90">{row.match}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 id="where-to-start">Where to start</h2>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Take the referral test',
            body: 'Send your website URL to three people who don\'t know your business. Ask them: "Based on this site, would you hire this company? What do they do? Who are they for?" Their answers will reveal your trust gap faster than any audit.',
          },
          {
            step: '02',
            title: 'Fix your social proof first',
            body: 'This is the highest-leverage change. Get 3-5 testimonials with real names, titles, and specific outcomes. Put them on your homepage, not buried on a testimonials page nobody visits. If you have client logos, show them.',
          },
          {
            step: '03',
            title: 'Sharpen your positioning',
            body: 'Rewrite your homepage headline to pass the five-second test: What do you do? Who is it for? Why should someone choose you? Kill the generic language. Be specific enough that the wrong customer self-selects out.',
          },
          {
            step: '04',
            title: 'Run the Findability Check',
            body: 'It scores your technical trust signals — HTTPS, security, speed, structured data. These are the trust signals visitors don\'t consciously notice but absolutely feel. A "Not Secure" warning in the address bar erases everything else.',
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
        This guide was about the gap between reputation and website — and how that gap silently costs you customers who were already sold. Close the gap, and every referral, every search result, every AI recommendation converts better.
      </p>

      <p>
        But even with strong trust, most businesses undermine their own efforts with content that fights itself. Blog posts competing for the same keywords. Pages cannibalizing each other. More content, less results.
      </p>

      <p>
        Next up: <strong>Guide 05 — Every Post You Publish Is Competing With Itself.</strong> More isn&apos;t better. Structure is.
      </p>

      {/* Closing CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
        <p className="font-heading text-lg font-bold text-foreground md:text-xl">
          How strong are your trust signals?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          The Findability Check scores the technical side of trust — HTTPS, security headers, speed, structured data. Your reputation handles the rest. Make sure the foundation matches.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/audit"
            className="guide-cta inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            Check your trust signals <ArrowRight className="h-4 w-4" />
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
