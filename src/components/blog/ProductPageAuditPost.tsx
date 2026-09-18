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

export function ProductPageAuditPost() {
  return (
    <>
      <p>
        A useful product page audit checks what the page says twice. Missing information costs you a
        sale. Two lines that disagree cost you the reader&apos;s trust in every other line, and
        that&apos;s the bigger leak.
      </p>

      <p>
        Most audits hunt for gaps. Is there a size chart, a shipping policy, a review count? Those
        checks are worth running. They just miss the finding I put first on the last product page I audited.
      </p>

      <h2 id="what-it-looks-like">What does it look like when a page argues with itself?</h2>

      <p>
        This summer I audited a one-product drink brand. On the first screen, the banner said
        &ldquo;We&apos;re sold out.&rdquo; The hero, a few inches lower, said &ldquo;Ships same
        day.&rdquo;
      </p>

      <p>
        Both lines were true once. Someone wrote the hero when the product was in stock. Someone added
        the banner when it wasn&apos;t. The hero didn&apos;t get updated.
      </p>

      <p>And every buy button on the page led to the one option that couldn&apos;t happen.</p>

      <PullQuote>
        A contradiction usually isn&apos;t a mistake anyone made. It&apos;s two correct edits, made on
        different days, by different people.
      </PullQuote>

      <h2 id="worse-than-a-gap">Why is a contradiction worse than a gap?</h2>

      <p>A gap sends the reader looking. A contradiction makes them wonder what else is wrong.</p>

      <p>
        If the shipping line is wrong, is the guarantee? Is the price? The reader can&apos;t check, so
        the careful ones leave. The rest buy with less confidence than they arrived with.
      </p>

      <p>Machines read the page too, and they&apos;re less forgiving.</p>

      <p>
        Google Merchant Center compares the availability in your product feed with what your landing
        page says. Its{' '}
        <a
          href="https://support.google.com/merchants/answer/12470049?hl=en"
          target="_blank"
          rel="noopener"
        >
          help page on mismatched availability
        </a>{' '}
        is blunt. The two &ldquo;must be the same.&rdquo; Products that don&apos;t match get
        disapproved from ads and free listings, and too many can lead to account suspension.
      </p>

      <p>
        Google Search has a matching rule for structured data.{' '}
        <a
          href="https://developers.google.com/search/docs/appearance/structured-data/sd-policies"
          target="_blank"
          rel="noopener"
        >
          Its guidelines
        </a>{' '}
        say your markup &ldquo;must be a true representation of the page content.&rdquo; If your
        schema says 4.9 stars and the page says 4.7, one of them is wrong, and Google has no way to
        know which one you meant.
      </p>

      <p>
        Then there are answer engines. When ChatGPT or Perplexity reads your page, it gets two answers
        to one question. Whatever it does next, you&apos;ve lost control of which answer reaches the
        customer.
      </p>

      <h2 id="where-they-hide">Where do contradictions usually hide?</h2>

      <p>
        Start with these 5. They&apos;re the places where edits pile up, because they change more
        often than anything else on the page.
      </p>

      <ul>
        <li>
          <strong>Stock and shipping.</strong> &ldquo;Sold out&rdquo; in one place, &ldquo;ships
          today&rdquo; in another. A preorder date that has already passed.
        </li>
        <li>
          <strong>Price.</strong> The hero says $49. The bundle card works out to a different
          per-unit price than the table below it. Subscription savings quoted as 15% in one section
          and 20% in another.
        </li>
        <li>
          <strong>Ratings and review counts.</strong> A hand-typed &ldquo;4.9 stars from 2,000
          customers&rdquo; in the hero, and a live widget from Judge.me or Okendo showing something
          else further down.
        </li>
        <li>
          <strong>Guarantees and policies.</strong> A 30-day guarantee in the hero, 60 days in the
          FAQ, and 14 days in the refund policy you actually enforce.
        </li>
        <li>
          <strong>Dates and &ldquo;new&rdquo; claims.</strong> &ldquo;New for 2025&rdquo; reads very
          differently in 2026, and the edit that removes it rarely gets scheduled.
        </li>
      </ul>

      <h2 id="how-to-run-it">How do you run a contradiction audit?</h2>

      <p>You need a phone, a blank document, and about 30 minutes for one product page.</p>

      <ol>
        <li>Open the page on your phone, logged out, the way a stranger sees it.</li>
        <li>
          Copy every factual claim into the document, one per line. Prices, numbers, dates, promises,
          stock status. Skip the adjectives. &ldquo;Delicious&rdquo; can&apos;t contradict anything.
        </li>
        <li>Sort the lines by subject. All the price lines together, all the shipping lines together.</li>
        <li>Any subject with 2 different versions is a finding.</li>
        <li>
          Now follow the buyer. Add to cart, go to checkout, open the FAQ and the footer links. Claims
          keep changing after the product page, and the cart is where a customer notices.
        </li>
      </ol>

      <figure>
        <img
          src="/images/blog/contradiction-audit-sheet.svg"
          alt="A contradiction audit worksheet. Claims from one product page are sorted by subject. Stock has two versions, sold out and ships same day, so it is flagged. Guarantee has two versions, 30 days and 60 days, so it is flagged. Price has one version, 49 dollars, so it passes."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          Sorted by subject, a contradiction stops hiding. Any subject with two versions is a
          finding.
        </figcaption>
      </figure>

      <p>
        Write each finding as the two lines side by side, not as a note. &ldquo;Banner: sold out.
        Hero: ships same day.&rdquo; That&apos;s the version a busy founder will actually fix,
        because it proves itself.
      </p>

      <h2 id="one-source">The fix is one source, not a better sentence</h2>

      <p>The tempting fix is to correct the wrong line. That works until the next edit.</p>

      <p>
        The fix that lasts is giving each fact one home. On Shopify, that usually means a metafield
        for the value and a section that reads from it. Your guarantee length lives in one place, and
        every section that mentions it pulls from there. Change it once and the page can&apos;t
        disagree with itself on that fact.
      </p>

      <p>
        Stock is easier still. Shopify&apos;s Liquid has a{' '}
        <a
          href="https://shopify.dev/docs/api/liquid/objects/product"
          target="_blank"
          rel="noopener"
        >
          <code>product.available</code> property
        </a>{' '}
        that returns true when at least one variant is in stock. Wrap the &ldquo;ships same
        day&rdquo; line in a check against it, and the line disappears the moment you sell out.
      </p>

      <p>
        It&apos;s the same point I made about{' '}
        <Link href="/blog/shopify-theme-small-team">what makes a Shopify theme easy to change</Link>.
        One source for every number is a structure decision. You make it once, and then it keeps
        paying.
      </p>

      <h2 id="wrong-tool">When is a contradiction audit the wrong tool?</h2>

      <p>
        Not every difference is a contradiction. The exception is a comparison. A sale price next to
        the regular price is doing its job. A subscription price under a one-time price is the
        same thing. Leave those alone.
      </p>

      <p>
        There&apos;s a catch, though. It won&apos;t rescue a weak offer. A page that agrees with itself perfectly can still
        sell the wrong thing to the wrong person. This audit fixes trust, not demand.
      </p>

      <p>
        And it doesn&apos;t scale by hand. Past a few dozen products, you want the product issues
        Merchant Center reports and a crawler, not a phone and a document. My free{' '}
        <Link href="/audit">findability grader</Link> checks how machines read your page. Reading for
        two lines that disagree is still a job for a person.
      </p>

      <h2 id="one-question">One question</h2>

      <p>Open your product page and find the first number on it. Now find everywhere else it appears.</p>

      <p>Do they all agree?</p>
    </>
  )
}
