'use client'

import Link from 'next/link'

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-10 border-l-2 border-primary/40 pl-6 md:pl-8">
      <p className="font-heading text-xl font-bold leading-snug text-foreground md:text-2xl">
        {children}
      </p>
    </div>
  )
}

export function ShopifyThemePost() {
  return (
    <>
      <p>
        Your Shopify theme decides how fast your team can change the store. Two people can ship a
        change this afternoon that used to take a sprint, but only if the theme was built to be read.
      </p>

      <p>Some two-person stores can do that. Many can&apos;t.</p>

      <p>The difference isn&apos;t budget and it isn&apos;t talent. It&apos;s structural.</p>

      <h2 id="what-actually-changed">What actually changed</h2>

      <p>Two changes landed in the last year and both are easy to miss.</p>

      <p>
        In December 2025, Shopify{' '}
        <a
          href="https://changelog.shopify.com/posts/ai-block-generation-for-all-theme-store-themes"
          target="_blank"
          rel="noopener"
        >
          opened AI block generation to every theme in the Theme Store
        </a>
        . You describe a block in plain language and it gets written.
      </p>

      <p>
        Then on 21 July 2026, Shopify announced a{' '}
        <a
          href="https://shopify.dev/changelog/developer-preview-liquid-block-and-partial-tags"
          target="_blank"
          rel="noopener"
        >
          developer preview of 2 new Liquid tags
        </a>
        , <code>{'{% block %}'}</code> and <code>{'{% partial %}'}</code>. The reason they gave is the
        part worth reading twice. The change is there, in their words, so that &ldquo;developers and
        coding agents can read and edit everything in one place.&rdquo;
      </p>

      <p>Shopify is restructuring its templating language so machines can follow it.</p>

      <p>
        That matters more to a small store than a large one. A large team already has people who can
        read the theme. You don&apos;t, and now you might not need to.
      </p>

      <h2 id="the-condition">The condition nobody mentions</h2>

      <p>A machine can only change what it can understand.</p>

      <p>
        So can a contractor you&apos;ve never met. So can whoever replaces your marketing hire next
        year.
      </p>

      <p>
        That reads as obvious written down. It isn&apos;t obvious when you&apos;re picking a theme, or
        telling a developer to just make it look like the mockup.
      </p>

      <PullQuote>
        So here&apos;s the condition that rarely gets attached to the good news. A theme your team
        can&apos;t read gets you very little of this.
      </PullQuote>

      <h2 id="what-makes-a-theme-easy-to-change">What makes a Shopify theme easy to change?</h2>

      <p>4 traits. You can check all 4 this afternoon, and none of them need you to read code.</p>

      <ul>
        <li>
          <strong>Sections named for what they do.</strong> A section called <code>product-hero</code>{' '}
          tells you where the buy box lives. One called <code>section-7</code> tells you to go ask
          someone. Names are the index.
        </li>
        <li>
          <strong>Values that live in settings.</strong> Your price, your badge text, your guarantee
          copy. If those sit in the theme editor, anyone can change them. If they&apos;re written into
          the code, every edit is a ticket.
        </li>
        <li>
          <strong>Content in fields, not baked into pictures.</strong> A price burned into a hero JPG
          can&apos;t be updated, translated or tested, and can&apos;t be read by anything. It goes
          stale the day you change your pricing, and it goes stale silently.
        </li>
        <li>
          <strong>One source for every number.</strong> Your star rating, your bundle value, your
          per-serving price. When each lives in one place, changing it is 1 job. Typed into 4 sections
          by hand, it&apos;s 4 jobs and you&apos;ll miss one.
        </li>
      </ul>

      <p>
        That last one is also the fastest thing to check from the outside, which is part of why I
        built the <Link href="/audit">free findability grader</Link> the way I did.
      </p>

      <p>
        None of this is advanced. It&apos;s the difference between a store you can steer and a store
        you can only file requests against.
      </p>

      <h2 id="the-test">The test worth running today</h2>

      <p>
        Open your theme editor. Pick one real change you&apos;d want to make this month. Not a
        redesign. Something small and specific, like swapping a guarantee line or reordering two
        sections.
      </p>

      <p>Try to do it yourself.</p>

      <p>
        What happens next is your actual ceiling. Either you change it in a minute, or you find the
        thing isn&apos;t editable, or you can&apos;t work out where it lives at all.
      </p>

      <figure>
        <img
          src="/images/blog/shopify-theme-ceiling-test.svg"
          alt="Three outcomes of trying to change one thing in a Shopify theme. One, it takes a minute and the theme is working for you. Two, you find it but it will not edit because the value was written into the code. Three, you cannot find it at all because nothing is named."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          Three outcomes, three different problems. Only one of them is a theme working for you.
        </figcaption>
      </figure>

      <p>
        That result tells you more about what your store can do next year than any theme feature list
        will.
      </p>

      <h2 id="how-i-ended-up-here">What this looks like on a real store</h2>

      <p>
        I&apos;ve been doing this work for a long time, across a lot of stores. One recent engagement
        shows the pattern cleanly.
      </p>

      <p>
        At gammalighttherapy.com I came in for content and SEO. I ended up in the theme, because the
        things I was asked to fix kept turning out to be theme problems wearing content clothes. A
        page that couldn&apos;t rank because the structure was wrong. Copy nobody could change without
        a developer. A layout making the argument in the wrong order.
      </p>

      <p>You can&apos;t fix any of that from the outside.</p>

      <p>
        So I pulled the theme into a local repo, connected Claude Code to it so it could read the
        whole thing at once, and started making the changes properly.{' '}
        <code>shopify theme check</code> runs before anything ships.
      </p>

      <p>
        That engagement moved from content strategy into fractional UX engineering. Custom sections,
        template work, product pages, with the content and search side still mine. It isn&apos;t the
        first time a project has gone that way, and it usually goes that way for the same reason.
      </p>

      <figure>
        <img
          src="/images/blog/gamma-organic-traffic.svg"
          alt="Bar chart of Gamma Light Therapy organic traffic indexed to the starting month. Month 0 sits at 100 and month 6 sits at 600, a 500 percent increase."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          Organic traffic over the same period. The search work is what moved the number, but it
          could only move it because the pages underneath could be changed.
        </figcaption>
      </figure>

      <p>
        That is the part worth taking from it. Content strategy hits a ceiling the moment the page
        stops being editable, and most of the time nobody names the ceiling. They just conclude the
        content didn&apos;t work.
      </p>

      <p>Here&apos;s the part that matters to you rather than to me.</p>

      <p>
        The agent is only as useful as the theme is readable. On a cleanly sectioned theme it finds
        what you&apos;re describing, because the section is named for what it does and the values sit
        in settings. On a theme where the layout is assembled somewhere you can&apos;t see, it
        can&apos;t help you. Neither can the next person you hire.
      </p>

      <PullQuote>
        The tooling didn&apos;t make the theme workable. The theme being workable is what let one
        person cover that much ground.
      </PullQuote>

      <h2 id="bigger-team-or-better-theme">Do you need a bigger team, or a better theme?</h2>

      <p>The instinct, when your store moves too slowly, is that you need more people.</p>

      <p>
        Sometimes that&apos;s right. Often what you actually need is a store that lets two people
        move.
      </p>

      <p>
        And when you do bring someone in, the brief is different from the one most people write. Most
        briefs describe a finished page. A better brief describes a finished page <strong>and</strong>{' '}
        who has to be able to change it afterwards without calling you.
      </p>

      <p>
        That single sentence changes what gets built. It&apos;s the difference between paying once and
        paying every time.
      </p>

      <p>
        Sure, some of this is work you can&apos;t do yourself, and there&apos;s rarely a version where
        you never need a developer. But the gap between &ldquo;I need help with this&rdquo; and
        &ldquo;I need help with everything&rdquo; is mostly a structural decision somebody made before
        you got here.
      </p>

      <h2 id="one-question">One question</h2>

      <p>Go and try to change one thing on your product page this week.</p>

      <p>What did you find, and how long did it take you?</p>
    </>
  )
}
