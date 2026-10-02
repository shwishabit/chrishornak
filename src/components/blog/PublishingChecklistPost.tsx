import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CopyablePrompt } from '@/components/sections/CopyablePrompt'

/** Same box as the OG image post's CheckerCta. */
function CheckerCta({ title, body }: { title: string; body: string }) {
  return (
    <div className="my-14 rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-8 md:px-8 md:py-10">
      {/* div, not p: .guide-prose p would grey it out */}
      <div className="font-heading text-lg font-bold text-foreground md:text-xl">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
      <Link
        href="/og-image-checker"
        className="guide-cta mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground no-underline shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
      >
        Check your link <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

const CHECKLIST = `PUBLISHING CHECKLIST

Before any check: Is this the most current version? Does it have everything I'm expecting?

1. On-page basics: title, meta description, headings, author, and a next step that matches the brief.
2. Formatting and images: spacing, headers, bullet points, styling. Every image loads, sits where the writer placed it, and has alt text.
3. Internal links: the new post links to 2 or 3 related posts, and 2 or 3 older posts link back to it. Same day.
4. CMS setup: a short, clean URL (usually the target keyword), category, tags, publish date.
5. Previews: paste the link into LinkedIn, X, iMessage, Slack and Google, and look at it on your phone, before the first share.

7 QUESTIONS FOR THE TEAM THAT PUBLISHES YOUR BLOG

1. What format do you want posts in?
2. How long does a post take from approved to live?
3. What do you check before you publish, and what would make you stop a post?
4. Who picks the author and the reader's next step?
5. When a post goes live, which older posts get a link to it, and who adds them?
6. Do we count what we drafted, or only what went live?
7. What do you need from me at approval so you never have to guess?`

export function PublishingChecklistPost() {
  return (
    <>
      <p>Have you ever had a post go live and look wrong?</p>

      <p>
        A client of mine published a post on their WordPress blog. I caught it after it was live. A
        table with none of the brand&apos;s style. It looked poor and unprofessional and
        inconsistent with the rest of the post.
      </p>

      <p>Nothing was wrong with the writing.</p>

      <p>
        It went wrong at the publishing step. That&apos;s the step most content workflows never
        write down.
      </p>

      <h2 id="what-is-it">What is a publishing checklist?</h2>

      <p>
        A publishing checklist is the written standard every post meets before anyone clicks
        Publish. It covers everything around the words: the title, the description, the images,
        the links and the settings in your CMS.
      </p>

      <p>
        As{' '}
        <a
          href="https://www.tenspeed.io/blog/content-strategy-framework"
          target="_blank"
          rel="noopener"
        >
          one content strategy framework
        </a>{' '}
        puts it, the checklist holds &ldquo;Quality standards every piece must meet before going
        live, including on-page SEO, internal linking, and content management system setup.&rdquo;
      </p>

      <p>You write it down once. After that, nobody has to argue about it on every post.</p>

      <p>
        I&apos;ve been involved with blogging since its birth. It has evolved over time, and
        keeping up with that has kept it interesting. The biggest change I&apos;ve seen is in the
        writing itself&hellip; covering the topic in depth and satisfying the intent of the reader.
      </p>

      <p>My checklist assumes that part is done. It covers what happens next.</p>

      <h2 id="approved-vs-ready">Why doesn&apos;t approved mean ready to publish?</h2>

      <p>
        Approval checks the words. Publishing is where the title, the links, the images and the
        CMS settings get set. That&apos;s where work slows down or slips.
      </p>

      <p>
        If that&apos;s happening on your team, you&apos;re not alone. In Search Engine
        Journal&apos;s{' '}
        <a
          href="https://www.searchenginejournal.com/the-state-of-seo-2026-how-to-survive/555368/"
          target="_blank"
          rel="noopener"
        >
          State of SEO 2026 survey
        </a>{' '}
        of 371 SEO professionals, content workflow problems came second, at 32%.
      </p>

      <p>
        Here&apos;s some advice you&apos;ve probably heard. Every post has to be perfectly on
        brand, in exactly the right voice.
      </p>

      <p>That sounds like the safe call, right? It isn&apos;t. Perfection slows down production.</p>

      <p>
        If you&apos;re on your third round of revisions to get the voice perfect before
        publishing, you&apos;ve gone too far. It should be close enough. Do you look for perfection
        when you&apos;re speaking at an event?
      </p>

      <p>
        Consistency still matters. I just don&apos;t fight for it in review rounds. After that
        client&apos;s table went live, I fixed it by building custom styled boxes they could use to
        stay consistent moving forward. Info boxes, tip boxes, notes, definitions, stat highlights
        and a styled table. They can drop one into any post and it matches the brand.
      </p>

      <p>
        A checklist can grow into its own bottleneck, though. Keep yours short enough that one
        person can run it on every post.
      </p>

      <h2 id="the-5-checks">The 5 checks every post should pass before it goes live</h2>

      <p>
        Before I run a single check, I ask two questions. Is this the most current version? Does it
        have everything I&apos;m expecting?
      </p>

      <p>I ask those first on every post I publish.</p>

      <p>Then come the 5 checks. Here they are at a glance.</p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>What to look for</th>
              <th>If you skip it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. On-page basics</td>
              <td>Title, description, headings, author, the next step</td>
              <td>The Google result and the ending say the wrong thing</td>
            </tr>
            <tr>
              <td>2. Formatting and images</td>
              <td>Spacing, headers, bullet points, styling, alt text</td>
              <td>It looks off brand, like my client&apos;s table</td>
            </tr>
            <tr>
              <td>3. Internal links</td>
              <td>2 or 3 links out, and older posts linking back</td>
              <td>Readers hit a dead end</td>
            </tr>
            <tr>
              <td>4. CMS setup</td>
              <td>A short URL, category, tags, publish date</td>
              <td>Posts drift apart</td>
            </tr>
            <tr>
              <td>5. Previews</td>
              <td>LinkedIn, Slack, Google, your phone</td>
              <td>The first share shows the wrong card</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>1. On-page basics</h3>

      <p>
        Start with what Google shows. Read your title and meta description as if they were a search
        result. Would you click it?
      </p>

      <p>
        Then look at the headings, the author and the call to action at the end. The next step
        should match what the brief wanted the reader to do.
      </p>

      <p>
        Give the description a real sentence.{' '}
        <a
          href="https://developers.google.com/search/docs/appearance/snippet"
          target="_blank"
          rel="noopener"
        >
          Google&apos;s snippet guide
        </a>{' '}
        says it may use the meta description &ldquo;when it describes the page better than other
        parts of the content.&rdquo;
      </p>

      <p>
        Will Google always use yours? No. A{' '}
        <a
          href="https://portent.com/blog/seo/how-often-google-ignores-our-meta-descriptions.htm"
          target="_blank"
          rel="noopener"
        >
          Portent study of 30,000 keywords
        </a>{' '}
        found Google rewrote 68% of first-page descriptions on desktop and 71% on mobile.
      </p>

      <p>Write it anyway. It&apos;s the one version you control.</p>

      <h3>2. Formatting and images</h3>

      <p>
        I make sure the content is properly formatted. Spacing, proper headers, bullet points,
        styling.
      </p>

      <p>
        This is the check that would have caught my client&apos;s table. A post can paste into a
        CMS with its structure fine and its brand styling gone.
      </p>

      <p>
        Then the images. Every one should load and sit where the writer placed it. The alt text
        should say what the image shows. If an image holds words people need, put those words in
        the page. I wrote about{' '}
        <Link href="/blog/text-in-images">why text in images costs you</Link>.
      </p>

      <h3>3. Internal links</h3>

      <p>
        This is the step I see teams skip most. Many aren&apos;t aware of its importance. Others
        are so focused on the content itself that the links and the proper tags get missed.
      </p>

      <p>
        Links run both ways. Your new post links to 2 or 3 related posts. Then 2 or 3 older posts
        on the same topic get a link back to the new one.
      </p>

      <p>Do it on publish day&hellip; while everyone still remembers the post exists.</p>

      <h3>4. CMS setup</h3>

      <p>
        WordPress, Webflow and HubSpot all keep these fields in different places. Your standard
        stays the same in each.
      </p>

      <p>
        I prefer clean, short URLs rather than the entire headline. In most cases that&apos;s the
        target keyword. This post lives at /blog/publishing-checklist, for example.
      </p>

      <p>
        Then set the category, the tags and the publish date to your written standard. Leave them
        to whoever uploads that day, and posts drift apart and get harder to find on your own site.
      </p>

      <h3>5. How it looks where people share it</h3>

      <p>
        Before I publish, I check how the link looks where it&apos;ll actually be shared.
        LinkedIn, X, iMessage, Slack. Then my phone.
      </p>

      <p>
        Do it before the first share. LinkedIn stores the preview of a link it has already seen,
        and its{' '}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a6233775"
          target="_blank"
          rel="noopener"
        >
          help page on refreshing previews
        </a>{' '}
        says a fix will &ldquo;only affect the URL&apos;s preview image and information for new
        posts that include it.&rdquo; The posts that already went out keep the old card.
      </p>

      <CheckerCta
        title="See the card before the first share"
        body="My free Open Graph Checker shows the card and the Google result side by side."
      />

      <h2 id="questions-for-your-team">What should you ask the team that publishes your blog?</h2>

      <p>
        If someone else publishes for you, these 7 questions tell you fast whether a checklist
        exists and who owns it.
      </p>

      <ol>
        <li>What format do you want posts in?</li>
        <li>How long does a post take from approved to live?</li>
        <li>What do you check before you publish, and what would make you stop a post?</li>
        <li>Who picks the author and the reader&apos;s next step?</li>
        <li>When a post goes live, which older posts get a link to it, and who adds them?</li>
        <li>Do we count what we drafted, or only what went live?</li>
        <li>What do you need from me at approval so you never have to guess?</li>
      </ol>

      <p>If you only ask one, ask the first.</p>

      <p>
        My own answer is a Google Doc with proper use of headers, lists and tables. The images
        should be in the document as well for placement, but also provided as individual files
        alongside the post.
      </p>

      <CopyablePrompt
        kind="terminal"
        label="The checklist and the 7 questions, ready to paste"
        text={CHECKLIST}
      />

      <h2 id="after-it-goes-live">What happens after the post goes live?</h2>

      <p>Two more checks happen a little later.</p>

      <p>
        About a week after publishing, search Google for the post&apos;s title. Not there? Ask
        why. Indexing times vary, so treat it as a prompt to ask, not a deadline.
      </p>

      <p>
        Then give each post a review date. Not every post needs one. A short news post can simply
        age out.
      </p>

      <h2 id="one-question">One question</h2>

      <p>
        Question for you. Which of the 5 checks does your team skip most? Start there on your next
        post.
      </p>
    </>
  )
}
