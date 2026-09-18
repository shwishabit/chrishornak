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

export function TextInImagesPost() {
  return (
    <>
      <p>
        Text in images looks finished on launch day. After that, every change to the words costs a
        designer, an export and an upload, and the words can&apos;t be read aloud, translated,
        tested or zoomed. That&apos;s the tax, and you pay it every time the copy moves.
      </p>

      <p>Real text costs one field edit. That&apos;s the whole argument. The rest is the bill.</p>

      <h2 id="what-counts">What counts as text in images?</h2>

      <p>
        Any word that lives inside the pixels instead of the page. A headline set in Canva or Figma
        and exported as a JPG. A &ldquo;20% off&rdquo; badge painted onto a product photo. A price,
        a star rating, a bestseller ribbon, a comparison chart saved as a PNG.
      </p>

      <p>
        The quick test is your cursor. Try to highlight the words. If you can&apos;t select them,
        they&apos;re pixels.
      </p>

      <h2 id="what-it-costs">What does the tax actually cost?</h2>

      <p>6 line items. Each one is small, and none of them expires.</p>

      <ul>
        <li>
          <strong>Every edit is a design job.</strong> Changing one word takes the source file,
          someone who can open it, an export, an upload and a fresh alt text. That&apos;s 5 steps
          for one word.
        </li>
        <li>
          <strong>Phones shrink it.</strong> Type scales with the picture. A 24px headline inside a
          1,200px-wide image renders at 7.8px on a 390px-wide phone screen. It was designed to be
          read at 24px.
        </li>
        <li>
          <strong>Screen readers only get the alt text.</strong> So the words exist twice, once in
          the pixels and once in the alt, and the two drift apart. That&apos;s the kind of
          contradiction a <Link href="/blog/product-page-audit">product page audit</Link> should
          catch.
        </li>
        <li>
          <strong>Translation skips it.</strong> Translation tools translate text. An image needs a
          new export for every language, or it stays in English on your French storefront.
        </li>
        <li>
          <strong>Tests get expensive.</strong> Testing two headlines in an image means making two
          images. Testing live text means typing a second headline.
        </li>
        <li>
          <strong>Machines read the page, not the picture.</strong> Some search tools can pull text
          out of an image. Relying on that means hoping a machine reads your price correctly, when
          you could just tell it.
        </li>
      </ul>

      <figure>
        <img
          src="/images/blog/text-in-images-shrink.svg"
          alt="The same headline at two sizes. On a 1,200 pixel wide desktop image it is set at 24 pixels. Shown on a 390 pixel wide phone screen, the whole image scales down and the headline renders at 7.8 pixels."
          width={1200}
          height={630}
          loading="lazy"
          className="w-full rounded-2xl shadow-xl shadow-black/20"
        />
        <figcaption>
          Live text reflows to fit the screen. Text in an image shrinks with the picture.
        </figcaption>
      </figure>

      <h2 id="when-numbers-change">What happens when the numbers change?</h2>

      <p>
        Recently I wrote a rebuild brief for a direct-to-consumer store. Its hero photo had 2 claims
        inside the picture, a per-day price and a &ldquo;value&rdquo; figure for the bundle.
      </p>

      <p>
        The bundle had changed since the photo was made. So the value figure was out of date, and
        it was out of date in two places, a text badge and the photo.
      </p>

      <p>
        The badge was a one-pass fix. The photo wasn&apos;t. The brief&apos;s answer was a re-export
        with no text, and if that couldn&apos;t arrive in time, a crop with the claims set in live
        type.
      </p>

      <PullQuote>
        Neither fix is hard. Both cost more than editing a field, and both only exist because the
        words went into the picture in the first place.
      </PullQuote>

      <p>
        It was unreadable on a phone as well. The tax usually arrives in more than one line at a
        time.
      </p>

      <h2 id="how-to-find-it">How do you find text in images on your site?</h2>

      <p>Four checks. You can run all of them on your homepage in about 10 minutes.</p>

      <ol>
        <li>Try to highlight every headline, price and badge with your cursor.</li>
        <li>Zoom your browser to 200%. Real text stays sharp. Pixels go soft.</li>
        <li>Open the page on your phone and read each image without pinching to zoom.</li>
        <li>
          Read the alt text on each hero image. If it repeats a sentence word for word, that
          sentence is probably baked in.
        </li>
      </ol>

      <p>
        Anything that fails goes on a list. Start with the images that carry a price or a promise,
        because those are the words that change.
      </p>

      <h2 id="what-instead">What should you use instead?</h2>

      <p>Put the words on top of the picture, not inside it.</p>

      <p>
        On Shopify, the Image banner section in Dawn already has{' '}
        <a
          href="https://github.com/Shopify/dawn/blob/main/sections/image-banner.liquid"
          target="_blank"
          rel="noopener"
        >
          heading, text and button blocks
        </a>{' '}
        that sit over the image. If your theme is built on Dawn, the section is already there. If
        it isn&apos;t, it&apos;s one of the first sections worth asking a developer for, and it
        ties back to{' '}
        <Link href="/blog/shopify-theme-small-team">what makes a Shopify theme easy to change</Link>.
      </p>

      <p>
        Badges and ribbons belong in a theme setting or in CSS, not in a new PNG every time the
        offer moves.
      </p>

      <p>
        Charts and diagrams can be drawn as SVG with real text inside, which is how the graphics on
        this blog are made. There&apos;s a trade-off, though. An SVG loaded as an image isn&apos;t
        part of the page&apos;s text, so I still write full alt text for each one.
      </p>

      <h2 id="when-its-fine">When is text in images fine?</h2>

      <p>
        More often than the rule makes it sound. The W3C&apos;s{' '}
        <a
          href="https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html"
          target="_blank"
          rel="noopener"
        >
          WCAG 2.2 success criterion 1.4.5
        </a>
        , Images of Text, asks for real text wherever the technology can do the job. It carves out
        an exception when a particular presentation is essential, and it says plainly that
        &ldquo;logotypes&rdquo; count as essential.
      </p>

      <ul>
        <li>
          <strong>Your logo.</strong> The shape of the words is the point.
        </li>
        <li>
          <strong>Product photos with words on the packaging.</strong> The label is the product.
        </li>
        <li>
          <strong>Share cards.</strong> A social preview is an image by definition. The card for
          this post is text in an image, and that&apos;s fine.
        </li>
        <li>
          <strong>Screenshots used as evidence.</strong> A picture of a real dashboard proves
          something that retyped numbers can&apos;t.
        </li>
      </ul>

      <p>
        The test for everything else: is the picture of the words the point, or just the words? If
        it&apos;s just the words, set them as text. My free{' '}
        <Link href="/audit">findability grader</Link> checks whether your images carry alt text.
        It can&apos;t tell you whether the words belonged in the picture at all. That call is still
        yours.
      </p>

      <h2 id="one-question">One question</h2>

      <p>Look at the image at the top of your homepage. How many words are inside it?</p>

      <p>And when did anyone last change them?</p>
    </>
  )
}
