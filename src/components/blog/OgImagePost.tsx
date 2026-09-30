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

export function OgImagePost() {
  return (
    <>
      <p>
        Put 3 things in your OG image and the tags around it: what the page is, what the reader
        gets, and who it&apos;s from. Keep all 3 true to the page. That&apos;s how the right people
        choose to click.
      </p>

      <p>
        The OG image is one of the most overlooked parts of a website I see with the businesses I
        work with. Here&apos;s what I put in one, and the check I run before any card goes live.
      </p>

      <h2 id="what-is-it">What is an OG image, and where does it show up?</h2>

      <p>
        It&apos;s the picture that appears when someone shares your link. OG stands for Open Graph,
        a set of tags hidden in your site&apos;s code. The{' '}
        <a href="https://ogp.me/" target="_blank" rel="noopener">
          Open Graph protocol
        </a>{' '}
        lists 4 required tags, and says the image &ldquo;should represent your object.&rdquo; In
        plain words, the picture should stand for what you published.
      </p>

      <p>
        The image rarely travels alone. Beside it sit the share title and the share description.
        Together they make the preview.
      </p>

      <p>
        LinkedIn and Facebook build their previews from these tags. Slack reads them alongside
        X&apos;s own tags. Apple&apos;s Messages app reads them too. So this little box is often
        the first thing anyone sees of your work. People meet it before they meet your site, and it
        tells them the subject, the tone and how much care went in.
      </p>

      <h2 id="why-it-matters">Why does the preview matter before the click?</h2>

      <p>Because it&apos;s a promise, and whatever sits behind the link has to keep it.</p>

      <p>
        Nielsen Norman Group makes this point about links on a web page, in a piece called{' '}
        <a href="https://www.nngroup.com/articles/link-promise/" target="_blank" rel="noopener">
          A Link is a Promise
        </a>
        . Its line is simple: &ldquo;Any broken promise, large or small, chips away at trust and
        credibility.&rdquo; They wrote it about link text, not share cards. I think it applies even
        more to a share card, because it&apos;s the first thing a stranger is told.
      </p>

      <p>
        A vague or mismatched card can cost you more than the click. It can bring in the wrong
        reader with the wrong expectation. They leave, and your content takes the blame for
        something the preview said.
      </p>

      <PullQuote>A clear card helps the right people choose to click.</PullQuote>

      <p>
        The people it&apos;s meant for see themselves in it. The people it isn&apos;t for scroll
        past. That&apos;s the trade-off, though. An accurate card can earn fewer clicks than a
        vague one. I&apos;ll take that, because a visit from the wrong reader only looks like
        interest.
      </p>

      <h2 id="what-to-put-in">What should you put in an OG image?</h2>

      <p>For a homepage or a service page, here&apos;s the template I use:</p>

      <ul>
        <li>Your logo, top left.</li>
        <li>One line that says what the page is.</li>
        <li>One line on what the reader gets.</li>
        <li>A short tagline and your domain along the bottom.</li>
        <li>1200 x 630 pixels, with room around the edges so nothing gets cut off.</li>
      </ul>

      <figure>
        <img
          src="/images/blog/og-image-template.png"
          alt="An unbranded OG image template, 1200 by 630 pixels. A logo box top left, the headline Say what the page is, a line reading One line on what the reader gets, then a tagline and yourdomain.com along the bottom, all inside a dashed safe margin."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          The template. The dashed line is the safe margin. Keep every word inside it.
        </figcaption>
      </figure>

      <p>
        The size isn&apos;t random. Meta asks for images of{' '}
        <a
          href="https://developers.facebook.com/docs/sharing/webmasters/images"
          target="_blank"
          rel="noopener"
        >
          at least 1200 x 630 pixels
        </a>
        , as close to a 1.91:1 ratio as possible, so the full image shows in Feed without
        cropping. LinkedIn&apos;s help pages ask for the same 1.91:1 ratio. That wide shape is the
        one to design for.
      </p>

      <p>Each part of the preview has one job. Here&apos;s how I keep each one honest.</p>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Part</th>
              <th>Its job</th>
              <th>Keep it true by</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Share title</td>
              <td>Say what the page is</td>
              <td>Echoing the headline</td>
            </tr>
            <tr>
              <td>Share description</td>
              <td>Say what the reader gets</td>
              <td>Mirroring your opening paragraph</td>
            </tr>
            <tr>
              <td>OG image</td>
              <td>Show the subject and the care</td>
              <td>Fitting the topic and design</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="words-on-it">Should an OG image have words on it?</h2>

      <p>It depends on the page.</p>

      <p>
        A homepage card has a selling job. It says who you are and who you help, and one big line
        earns its place there.
      </p>

      <p>
        A blog post is different. The share title and description already carry the words, so I
        make the card one picture of the topic. No title, no logo. The card for this post is a
        link preview inside a chat, with a cursor about to click.
      </p>

      <p>
        Apple goes further than I do. Its{' '}
        <a
          href="https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages"
          target="_blank"
          rel="noopener"
        >
          guide to rich previews in Messages
        </a>{' '}
        says: &ldquo;Avoid text in preview images.&rdquo; Previews show at different sizes on
        different devices, so small words can end up unreadable. It also asks for images at least
        900 pixels wide.
      </p>

      <p>
        That&apos;s the fair case against the template above. If you keep words on a homepage card,
        keep them few and big. Words baked into pictures cost you in other ways too, and I&apos;ve
        written about{' '}
        <Link href="/blog/text-in-images">why text in images costs more</Link>.
      </p>

      <h2 id="how-to-check">How do you check a share preview before it goes live?</h2>

      <p>
        Before I publish, I check how the link renders where it&apos;ll actually be shared. Big
        and small.
      </p>

      <ol>
        <li>Paste the link where it&apos;ll be shared: LinkedIn, X, iMessage, Slack.</li>
        <li>
          Look at the wide card at full size, then the way it shows on a phone. The main line has
          to read small.
        </li>
        <li>
          Stress-test the edges. I crop a centered square out of the wide card. If the words
          survive that, they&apos;ll survive a tighter preview.
        </li>
        <li>Read the card, then the first screen of the page. Do they say the same thing?</li>
        <li>
          If a platform shows an old version, refresh it. LinkedIn&apos;s Post Inspector and
          Facebook&apos;s Sharing Debugger both do this.
        </li>
      </ol>

      <p>
        I ran my new homepage card through that check before it went live. Two things didn&apos;t
        hold up.
      </p>

      <p>
        The wide card looked fine. The stress test didn&apos;t. On a square crop, &ldquo;Marketing
        strategist&rdquo; turned into &ldquo;keting strateg.&rdquo; The headline ran almost edge
        to edge, so the crop took letters off both ends.
      </p>

      <figure>
        <img
          src="/images/blog/og-image-square-crop.png"
          alt="My draft homepage card, 1200 by 630 pixels, with everything outside a centered 630 pixel square dimmed. Inside the square the headline reads keting strateg, usinesses, y to grow."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          My draft homepage card. Everything outside the centered square is what a square crop
          loses.
        </figcaption>
      </figure>

      <p>
        The fix isn&apos;t a second, square image. Open Graph lets a page list more than one, but
        the first one gets preference, so design for the wide card and keep the words away from
        its edges.
      </p>

      <p>
        The second problem was quieter. The card promised &ldquo;grow.&rdquo; The page opens with
        &ldquo;get found.&rdquo; Both are true about my work. But someone who clicked for growth
        would land on a page about being found, and that&apos;s a small broken promise.
      </p>

      <p>Neither problem jumps out when you look at the card on its own. It took the check to catch both.</p>

      <p>
        My free <Link href="/audit">findability grader</Link> checks the technical half. It looks
        for a share title, description and image, and tests that the image address actually loads.
        It can&apos;t tell you whether the card keeps the page&apos;s promise. That part is still a
        human read.
      </p>

      <h2 id="matters-less">When does the OG image matter less?</h2>

      <p>
        On pages that rarely get shared. A checkout or a login screen needs a sensible default,
        not a custom design.
      </p>

      <p>
        When the content is weak. A clear card brings the right reader in. It can&apos;t make the
        visit worth their time.
      </p>

      <p>
        And right after you change it. Meta&apos;s sharing guide says images are cached by their
        address and won&apos;t update unless the address changes. So I save each new card under a
        new file name.
      </p>

      <h2 id="one-question">One question</h2>

      <p>Text your homepage link to yourself. Look at the card before you tap it.</p>

      <p>Does it promise what the page delivers?</p>
    </>
  )
}
