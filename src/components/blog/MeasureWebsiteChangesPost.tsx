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

export function MeasureWebsiteChangesPost() {
  return (
    <>
      <p>
        To measure website changes, write the number down before you touch anything. Without a
        before, &ldquo;it&apos;s better now&rdquo; is an opinion. It might be a correct opinion. You
        just can&apos;t prove it, to your team or to yourself.
      </p>

      <p>
        It&apos;s an easy step to skip. Not out of laziness. The change feels obviously good, so
        measuring it feels like paperwork.
      </p>

      <h2 id="why-baseline">Why does the baseline matter more than the change?</h2>

      <p>Because you can make the change again. You can&apos;t go back and take the before.</p>

      <p>
        Memory is a poor record. Ask three people for the conversion rate before last
        month&apos;s redesign and you may get three answers. And some of the tools you&apos;d check only hold a window of
        history.
      </p>

      <ul>
        <li>
          <strong>PageSpeed Insights.</strong> Its field data reports real users over{' '}
          <a
            href="https://developers.google.com/speed/docs/insights/v5/about"
            target="_blank"
            rel="noopener"
          >
            the previous 28-day collection period
          </a>
          . After a fix, the old number rolls out of view. If you didn&apos;t save it, it&apos;s gone.
        </li>
        <li>
          <strong>Google Search Console.</strong> Performance data goes back 16 months, which is why
          Google&apos;s own{' '}
          <a
            href="https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops"
            target="_blank"
            rel="noopener"
          >
            guide to debugging traffic drops
          </a>{' '}
          tells you to pick &ldquo;Last 16 months&rdquo; to rule out a seasonal dip. Anything older
          has to have been exported.
        </li>
        <li>
          <strong>Google Analytics 4.</strong> Standard reports aren&apos;t affected, but{' '}
          <a
            href="https://support.google.com/analytics/answer/7667196?hl=en"
            target="_blank"
            rel="noopener"
          >
            explorations and funnel reports
          </a>{' '}
          only reach back as far as your retention setting, which is 2 months or 14 months on a
          standard property.
        </li>
      </ul>

      <PullQuote>
        The before is the only part of the measurement with a deadline. The after will wait for
        you.
      </PullQuote>

      <h2 id="what-to-record">What should you record before you change a page?</h2>

      <p>5 things. It takes about 10 minutes, and it fits in one note.</p>

      <ol>
        <li>
          <strong>The one number the change is meant to move</strong>, with the date range you
          read it over. One number, not a dashboard.
        </li>
        <li>
          <strong>A screenshot of the page as it is.</strong> You&apos;ll want to see what you
          changed, not just the result.
        </li>
        <li>
          <strong>The tool and its settings.</strong> Mobile or desktop, which date range, which
          filter. A number with no settings can&apos;t be compared with anything.
        </li>
        <li>
          <strong>What else is happening that week.</strong> An email send, an ad push, a holiday, a
          price change. These move numbers too.
        </li>
        <li>
          <strong>The date you&apos;ll check again.</strong> Pick it now, so you don&apos;t check
          on the first good day.
        </li>
      </ol>

      <figure>
        <img
          src="/images/blog/measure-website-changes-note.svg"
          alt="A before note for one website change, with five fields. The metric, Blog Grader score for one post. The before value, 97 out of 100. The tool and settings, the grader run on the live URL. Other changes, none between the two readings. The check-again date, after the deploy settles. The after value, 100 out of 100."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          The whole baseline fits in one note. Fill it in before the change, not after.
        </figcaption>
      </figure>

      <h2 id="real-example">What does this look like on a real page?</h2>

      <p>
        Small, usually. This week I added posts to this blog and reworked an earlier one, and I
        graded each one with the{' '}
        <a href="https://bloghands.com/blog-grader" target="_blank" rel="noopener">
          Blog Grader
        </a>{' '}
        I built for Blog Hands, before and after every change.
      </p>

      <p>
        The first post scored 97 out of 100. The grader read the short line under the title as the
        opening paragraph, and that line didn&apos;t contain the post&apos;s topic. I rewrote it and
        graded again. 100. The{' '}
        <Link href="/blog/product-page-audit">product page audit</Link> post went from 96 to 100
        the same way. Each lost point came with the grader&apos;s reason attached.
      </p>

      <p>
        Then one reading came back at 26 out of 100. The grader had fetched the homepage, because
        the new deploy hadn&apos;t finished settling. I graded again shortly after and got 100.
      </p>

      <p>
        The 26 was a real number. It just wasn&apos;t a number about my page. That&apos;s the other
        half of measuring: check that you measured the thing you changed before you believe the
        result, whichever way it points.
      </p>

      <h2 id="how-long-to-wait">How long should you wait before you measure again?</h2>

      <p>It depends on where the number comes from.</p>

      <ul>
        <li>
          <strong>Lab tools</strong> like Lighthouse, or a grader, re-run in seconds. Measure right
          after the change goes live.
        </li>
        <li>
          <strong>Field data</strong> like the Chrome UX Report behind PageSpeed Insights needs its
          28-day window to fill with the new version.
        </li>
        <li>
          <strong>Search performance</strong> moves slowly. Compare matching date ranges, and use a
          long enough range that one odd week can&apos;t decide it.
        </li>
        <li>
          <strong>Sales and sign-ups</strong> need enough visits that a single good day can&apos;t
          swing the result. On a small store that can take weeks.
        </li>
      </ul>

      <p>
        If you want a quick before for how machines read a page, my free{' '}
        <Link href="/audit">findability grader</Link> gives you a score you can save. Save it, make
        the change, then run it again.
      </p>

      <h2 id="when-not-to">When is measuring not worth it?</h2>

      <p>
        Fixing a typo, a broken link or a wrong phone number is correct on its face. Just fix it.
        The exception is anything you&apos;re changing because you think it will perform better.
        That&apos;s a prediction, and a prediction needs a before.
      </p>

      <p>
        There&apos;s a harder limit, though. A number that goes up after a change doesn&apos;t
        prove the change caused it. The season, an email, or a competitor running out of stock can
        all move it. The baseline doesn&apos;t remove that doubt. It makes it visible, which is
        more honest than a confident guess.
      </p>

      <p>
        And on a low-traffic page, the numbers may not settle for months. In that case, measure something
        closer to the change, like whether people can find the thing you moved, rather than
        waiting on sales.
      </p>

      <h2 id="one-question">One question</h2>

      <p>Think of the last change you made to your site that you&apos;d call an improvement.</p>

      <p>What was the number before?</p>
    </>
  )
}
