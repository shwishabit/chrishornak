'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StrategyFirstDiagram } from './StrategyFirstDiagram'

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-10 border-l-2 border-primary/40 pl-6 md:pl-8">
      <p className="font-heading text-xl font-bold leading-snug text-foreground md:text-2xl">
        {children}
      </p>
    </div>
  )
}

export function StrategyFirstGuide() {
  return (
    <>
      <p>
        I had coffee last year with a business owner who was genuinely confused. She&apos;d done everything. New website. SEO agency. Google Ads. Social media manager. Email newsletter. Content calendar. Branded video series. She&apos;d been spending $8K a month on marketing for two years.
      </p>

      <p>
        She could not tell me what was working.
      </p>

      <p>
        Not because she wasn&apos;t measuring — she had dashboards. But because every tactic had been launched in isolation, at different times, by different vendors, with no shared strategy underneath. The website was built before the positioning was clear. The ads were running before the landing pages converted. The content was publishing before anyone defined what the content was <em>for</em>.
      </p>

      <p>
        Every piece was a reasonable investment on its own. Together, they were $192K spent doing the right things in the wrong order.
      </p>

      <figure className="my-10">
        <StrategyFirstDiagram />
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          Right things, wrong sequence — the order is the strategy.
        </figcaption>
      </figure>

      <PullQuote>
        The most expensive mistake in marketing isn&apos;t choosing the wrong tactic. It&apos;s executing the right tactics before the strategy underneath them is clear. Everything works harder than it should — and nothing compounds.
      </PullQuote>

      <h2 id="the-sequence-problem">The sequence problem</h2>

      <p>
        Marketing has an order of operations. Most businesses ignore it — not because they&apos;re careless, but because nobody told them it exists.
      </p>

      <p>
        The standard path looks like this: business opens, someone says &ldquo;you need a website,&rdquo; website gets built, someone says &ldquo;you need SEO,&rdquo; agency gets hired, someone says &ldquo;you need to be on social media,&rdquo; another vendor comes aboard. Each decision makes sense in the moment. But the sequence is backwards.
      </p>

      <p>
        You built a website before you knew what it should say. You started running ads before the landing page could convert. You hired an SEO agency before your site structure could support rankings. You launched a content calendar before defining what topics would actually move the business forward.
      </p>

      <p>
        It&apos;s like furnishing a house before pouring the foundation. Every individual purchase is fine. The house still falls down.
      </p>

      <h2 id="what-the-right-order-looks-like">What the right order actually looks like</h2>

      <p>
        There&apos;s a sequence that works. It&apos;s not complicated, but it requires discipline because every step depends on the one before it. Skip a step and the rest wobbles.
      </p>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Positioning',
            subtitle: 'Who are you for, and why should they choose you?',
            body: 'Before you build anything, you need to answer two questions with ruthless clarity: who is your specific customer, and what makes you different from every other option they have? "We serve small businesses" is not positioning. "We\'re an accounting firm for restaurants in the Denver metro" is. Everything downstream depends on this.',
          },
          {
            step: '02',
            title: 'Messaging',
            subtitle: 'What story does your brand tell?',
            body: 'Once you know who you serve and why, the words follow. Your headline, your value proposition, your differentiators, your proof points. This isn\'t copywriting yet — it\'s the strategic framework that all copy will be built on. If your messaging is "we help businesses grow," your website, ads, and content will all be vague. Fix the messaging, and everything sharpens.',
          },
          {
            step: '03',
            title: 'Foundation',
            subtitle: 'Website, technical infrastructure, analytics.',
            body: 'Now you build. The website expresses the positioning and messaging. The technical foundation makes you findable — the stuff from Guides 02 and 03. Analytics gets set up so you can measure what matters. This is where most businesses start, which is why they end up with a beautiful site that says nothing specific.',
          },
          {
            step: '04',
            title: 'Content',
            subtitle: 'Prove your expertise. Earn attention.',
            body: 'Content comes after foundation because it needs somewhere to live and a strategy to follow. Not "let\'s blog twice a week." Instead: "Here are our 3-5 pillar topics, here\'s our hub-and-spoke structure, here\'s how each piece moves a reader toward trust." This is Guide 05 in action.',
          },
          {
            step: '05',
            title: 'Distribution',
            subtitle: 'Get it in front of people. Ads, social, email, partnerships.',
            body: 'This is where most businesses want to start — and it\'s step five. Ads amplify whatever your foundation communicates. If your positioning is vague and your site doesn\'t convert, ads just drive paid traffic to a leaky bucket. Fix the bucket first. Then turn on the faucet.',
          },
          {
            step: '06',
            title: 'Optimization',
            subtitle: 'Measure, learn, tighten.',
            body: 'Only after everything else is running do you start optimizing. A/B tests, conversion rate improvements, keyword refinements, ad creative iterations. This is the compound phase — small improvements that multiply because the foundation is solid. Without the foundation, optimization is rearranging deck chairs.',
          },
        ].map((item) => (
          <div key={item.step} className="flex gap-5">
            <span className="font-heading text-2xl font-bold text-primary/30">{item.step}</span>
            <div>
              <p className="font-heading text-base font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-primary/70">{item.subtitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <PullQuote>
        Positioning → Messaging → Foundation → Content → Distribution → Optimization. That&apos;s the sequence. Every step depends on the one before it. Skip one and the rest wobbles.
      </PullQuote>

      {/* Mid-Guide CTA */}
      <div className="my-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10">
        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-foreground md:text-xl">
              How solid is your foundation?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              The Findability Check scores step three — your technical foundation. It&apos;s the fastest way to see whether you&apos;re ready for steps four, five, and six, or whether you&apos;re building on sand.
            </p>
            <Link
              href="/audit"
              className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your foundation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <h2 id="why-the-wrong-order-feels-right">Why the wrong order feels right</h2>

      <p>
        Tactics are visible. Strategy is invisible. That&apos;s why businesses default to the wrong order.
      </p>

      <p>
        Running ads feels like progress. Posting on social media feels productive. Publishing blog posts feels like momentum. These are tangible things you can point to and say &ldquo;we&apos;re marketing.&rdquo;
      </p>

      <p>
        Sitting in a room defining your positioning doesn&apos;t feel like progress. It feels like stalling. Writing a messaging framework instead of launching a campaign feels like overhead. But that &ldquo;overhead&rdquo; is the difference between a marketing operation that compounds and one that churns through budget.
      </p>

      <p>
        I&apos;ve watched businesses spend $50K on ads driving traffic to a site that didn&apos;t convert — because nobody spent the first $5K figuring out what the site should say. The ads worked. The targeting was right. The traffic arrived. And then it left, because the foundation wasn&apos;t there.
      </p>

      <h2 id="diagnosing-your-order">How to tell if you&apos;re out of order</h2>

      <p>
        Here are the symptoms. If three or more sound familiar, you have a sequence problem:
      </p>

      <div className="my-10 space-y-3">
        {[
          'Your website was built before your positioning was defined.',
          'You\'re running ads but can\'t explain your conversion rate.',
          'You have a content calendar but no content strategy.',
          'Your social media is active but doesn\'t connect to business outcomes.',
          'You\'ve hired multiple agencies but they don\'t talk to each other.',
          'You\'re measuring vanity metrics (followers, impressions) instead of outcomes (leads, revenue).',
          'You can\'t explain — in one sentence — why a customer should choose you over the next option.',
          'Everything feels busy but nothing feels like it\'s compounding.',
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
        If that list made you uncomfortable — good. That&apos;s the point. The discomfort is the gap between what you&apos;re doing and the order it should be done in. And the fix isn&apos;t starting over. It&apos;s reorganizing.
      </p>

      <hr />

      <h2 id="you-dont-need-to-start-over">You don&apos;t need to start over</h2>

      <p>
        If you&apos;re reading this thinking &ldquo;we&apos;ve already built the house, it&apos;s too late to pour the foundation&rdquo; — it&apos;s not. You can retrofit the sequence without scrapping everything.
      </p>

      <p>
        Define your positioning now. Rewrite your messaging to match. Update your website to express it. Restructure your content around it. Then — and only then — see whether your ads and distribution are aligned.
      </p>

      <p>
        Most of the time, you&apos;ll find that 80% of what you&apos;ve already built is usable. It just needs to be realigned around a clear strategic center instead of operating as disconnected pieces.
      </p>

      <PullQuote>
        Strategy isn&apos;t what you do. It&apos;s the order you do it in and the reason behind each step. Most businesses have the pieces. They&apos;re just assembled wrong.
      </PullQuote>

      <h2 id="where-to-start">Where to start</h2>

      <div className="my-10 space-y-6">
        {[
          {
            step: '01',
            title: 'Write your positioning statement',
            body: 'One sentence: "We are [what] for [who], and we\'re different because [why]." If you can\'t fill those blanks with something specific, that\'s your first problem. Don\'t move forward until this is crisp.',
          },
          {
            step: '02',
            title: 'Audit your homepage against it',
            body: 'Does your homepage clearly express your positioning? Can a stranger tell what you do, who it\'s for, and why in five seconds? If not, that\'s your next fix — before any new content, ads, or campaigns.',
          },
          {
            step: '03',
            title: 'Check your foundation',
            body: 'Run the Findability Check. It scores the technical infrastructure that makes everything else work — search visibility, AI readiness, site structure, security. If the foundation is broken, nothing you stack on top will perform as well as it should.',
          },
          {
            step: '04',
            title: 'Align everything else to the strategy',
            body: 'Look at your content, ads, social, and email through the lens of your positioning. Does each one reinforce the same message? Is anything running that contradicts or dilutes it? Pause what doesn\'t align. Double down on what does.',
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

      <h2 id="the-signal-complete">The full picture</h2>

      <p>
        This is the last guide in the series, and it&apos;s here for a reason. Everything in the previous five guides — findability, search visibility, AI readiness, website trust, content structure — only works when it&apos;s assembled in the right order with clear strategy underneath.
      </p>

      <p>
        The Findability Check measures your technical signals. These guides explain the strategic reality behind them. Together, they give you the complete picture: where your signal is strong, where it&apos;s weak, and what to do about it — in the right sequence.
      </p>

      <p>
        If you&apos;ve read all six, you know more about what actually makes businesses findable than most marketing agencies will ever tell you. The question isn&apos;t whether you know enough. It&apos;s whether you&apos;ll do it in the right order.
      </p>

      {/* Closing CTA */}
      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10 text-center">
        <p className="font-heading text-lg font-bold text-foreground md:text-xl">
          Ready to get it in order?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          Start with the Findability Check — it scores your technical foundation in under a minute. Then work through the guides that match your gaps. Or skip the self-serve path entirely.
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
            Let&apos;s figure out the right order together&nbsp;&rarr;
          </Link>
        </div>
      </div>
    </>
  )
}
