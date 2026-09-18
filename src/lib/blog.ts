// src/lib/blog.ts — /blog post metadata
//
// Distinct from lib/guides.ts on purpose. The Signal guides are a closed,
// numbered curriculum. This is an open series of standalone pieces, so the
// shape drops `number` and `role` and adds the fields the blog-quality gate
// checks: an explicit target keyword, a counted meta description, and a slug
// that IS the keyword.

export interface PostFaq {
  question: string
  answer: string
}

export interface Post {
  slug: string
  /** H1 and <title>. Gate: 60 characters or fewer. */
  title: string
  /** Deck under the H1. Not the meta description. */
  teaser: string
  /** Gate: the focus keyword the Grader should infer. */
  targetKeyword: string
  /** Gate: 140-165 characters, keyword in the first half. */
  metaDescription: string
  keywords: string[]
  published: boolean
  datePublished: string
  dateModified: string
  /** Body words, counted from the rendered post. Feeds BlogPosting.wordCount. */
  wordCount: number
  /** Rounded up from word count at 225 wpm. */
  readingMinutes: number
  faq: PostFaq[]
}

export const posts: Post[] = [
  {
    slug: 'shopify-theme-small-team',
    title: 'A small team moves fast if the Shopify theme allows it',
    teaser:
      'Shopify is rebuilding its theme layer so machines can read it. A readable Shopify theme is worth more to a two-person store than a large one, but only under one condition.',
    targetKeyword: 'Shopify theme',
    metaDescription:
      'Your Shopify theme decides how fast a small team can change the store. Four traits make a theme easy to edit, and one test tells you where you stand.',
    keywords: [
      'Shopify theme',
      'Shopify sections',
      'Shopify Liquid',
      'theme architecture',
      'DTC operations',
      'Shopify for small teams',
    ],
    published: true,
    datePublished: '2026-09-17',
    dateModified: '2026-09-17',
    wordCount: 1003,
    readingMinutes: 5,
    faq: [
      {
        question: 'What makes a Shopify theme easy to change?',
        answer:
          'Four traits. Sections named for what they do, so anyone can find the right one. Values that live in theme settings rather than in code, so an edit is not a developer ticket. Content in fields rather than baked into images, so it can be updated, translated and tested. And one source for every number, so changing a price or a rating is one job rather than four.',
      },
      {
        question: 'How do I tell whether my Shopify theme is holding me back?',
        answer:
          'Open your theme editor and try to make one small, real change you actually want this month, like swapping a guarantee line or reordering two sections. Either it takes a minute, or the thing turns out not to be editable, or you cannot work out where it lives. That result is your ceiling, and it tells you more than any theme feature list.',
      },
      {
        question: 'Can AI tools edit a Shopify theme for me?',
        answer:
          'Partly, and the limit is structural rather than technical. In December 2025 Shopify opened AI block generation to every Theme Store theme, and in July 2026 it previewed new Liquid block and partial tags so that, in Shopify’s own words, developers and coding agents can read and edit everything in one place. An agent can only change what it can understand, so a well structured theme gets far more out of those tools than a messy one.',
      },
      {
        question: 'Do I need a bigger team or a better Shopify theme?',
        answer:
          'Often the theme. If small changes need a developer every time, the constraint is structural rather than a staffing gap. When you do hire, brief for editability as well as for a finished page, and say who has to be able to change it afterwards without calling you.',
      },
    ],
  },
  {
    slug: 'product-page-audit',
    title: 'Product page audit: is your page arguing with itself?',
    teaser:
      'A product page audit usually hunts for what is missing. The costlier problem is two lines on the same page that disagree, and it is usually two correct edits made on different days.',
    targetKeyword: 'product page audit',
    metaDescription:
      "A product page audit usually hunts for gaps. The costlier problem is two lines that disagree. Here's how to find those contradictions in about 30 minutes.",
    keywords: [
      'product page audit',
      'contradiction audit',
      'product page consistency',
      'Google Merchant Center mismatched availability',
      'Shopify metafields',
      'ecommerce conversion',
    ],
    published: true,
    datePublished: '2026-09-17',
    dateModified: '2026-09-17',
    wordCount: 985,
    readingMinutes: 5,
    faq: [
      {
        question: 'What is a contradiction audit on a product page?',
        answer:
          'It is a product page audit that looks for claims made twice in different versions, rather than for missing information. You copy every factual claim on the page into one list, sort the list by subject, and flag any subject with two versions. Stock and shipping, price, ratings, guarantees and dates are where contradictions usually hide.',
      },
      {
        question: 'Why is a contradiction worse than missing information?',
        answer:
          'A gap sends the reader looking for the answer. A contradiction makes them doubt every other claim on the page, because they cannot tell which version is true. Machines are stricter still. Google Merchant Center disapproves products whose landing page availability does not match the product feed, and Google Search requires structured data to be a true representation of the page content.',
      },
      {
        question: 'How long does a contradiction audit take?',
        answer:
          'About 30 minutes for a single product page, with a phone and a blank document. Past a few dozen products it stops scaling by hand, and you want the product issues Merchant Center reports plus a crawler instead.',
      },
      {
        question: 'How do I stop a Shopify product page contradicting itself?',
        answer:
          'Give each fact one home. Store values like a guarantee length in a metafield that every section reads from, so a change happens once. For stock, wrap shipping promises in a check against the Liquid product.available property, which returns true when at least one variant is in stock, so the line disappears when you sell out.',
      },
    ],
  },
  {
    slug: 'text-in-images',
    title: 'Text in images is a tax you pay forever',
    teaser:
      'Text in images looks finished on launch day. After that, every change to the words is a design job, and the words cannot be read aloud, translated, tested or zoomed.',
    targetKeyword: 'text in images',
    metaDescription:
      "Text in images looks fine on launch day. Then every price change, translation, test and phone screen bills you again. Here's what to use instead.",
    keywords: [
      'text in images',
      'images of text',
      'WCAG 1.4.5',
      'Shopify image banner',
      'alt text',
      'ecommerce accessibility',
    ],
    published: true,
    datePublished: '2026-09-17',
    dateModified: '2026-09-17',
    wordCount: 947,
    readingMinutes: 5,
    faq: [
      {
        question: 'What counts as text in images?',
        answer:
          'Any word that lives inside the pixels instead of the page. A headline designed in Canva or Figma and exported as a JPG, a discount badge painted onto a product photo, a price, a star rating, or a chart saved as a PNG. The quick test is to try to highlight the words with your cursor. If you cannot select them, they are part of the image.',
      },
      {
        question: 'Why is text in images bad for a website?',
        answer:
          'Every change to the words becomes a design job, with a source file, an export, an upload and new alt text. The words shrink with the image on a phone, so a 24px headline in a 1,200px image renders at 7.8px on a 390px screen. Screen readers only get the alt text, translation tools skip it, and testing a new headline means making a new image.',
      },
      {
        question: 'When is it fine to put text in an image?',
        answer:
          'When the look of the words is the point. WCAG 2.2 success criterion 1.4.5 asks for real text where the technology allows it, with an exception for presentations that are essential, and it counts logotypes as essential. Product photos with words on the packaging, social share cards and screenshots used as evidence are also reasonable uses.',
      },
      {
        question: 'How do I put text over an image in Shopify?',
        answer:
          'Use a section that places live text on top of the image rather than inside it. The Image banner section in Shopify’s Dawn theme has heading, text and button blocks for this, so the words stay editable in the theme editor. If your theme has no equivalent, it is one of the first sections worth asking a developer for.',
      },
    ],
  },
  {
    slug: 'measure-website-changes',
    title: "Measure website changes, or you didn't improve them",
    teaser:
      'To measure website changes, you need the number from before the change. That is the only part of the measurement with a deadline, and it is the easiest part to skip.',
    targetKeyword: 'measure website changes',
    metaDescription:
      "To measure website changes, record the number before you touch anything. Here's what to write down, how long to wait, and when it isn't worth it.",
    keywords: [
      'measure website changes',
      'website baseline',
      'before and after metrics',
      'PageSpeed Insights field data',
      'Google Search Console',
      'conversion rate',
    ],
    published: true,
    datePublished: '2026-09-17',
    dateModified: '2026-09-17',
    wordCount: 836,
    readingMinutes: 4,
    faq: [
      {
        question: 'How do you measure website changes?',
        answer:
          'Record a baseline before you change anything. Write down the one number the change is meant to move and the date range, take a screenshot of the page, note the tool and its settings, list anything else happening that week, and pick the date you will check again. Then compare the same number, with the same settings, after the change.',
      },
      {
        question: 'Why do I need a baseline before changing my website?',
        answer:
          'Because you can repeat a change but you cannot go back and take the before. Some tools only hold a window of history. PageSpeed Insights field data covers the previous 28 days, Search Console performance data goes back 16 months, and GA4 explorations only reach back as far as the retention setting of 2 or 14 months on a standard property.',
      },
      {
        question: 'How long should I wait before measuring a website change?',
        answer:
          'It depends on the source. Lab tools like Lighthouse can be re-run as soon as the change is live. PageSpeed Insights field data needs its 28-day window to fill with the new version. Search performance and sales need long enough date ranges that one unusual week or one good day cannot decide the result.',
      },
      {
        question: 'Does a better number prove my change worked?',
        answer:
          'Not on its own. The season, an email send, an ad campaign or a competitor running out of stock can all move the same number. A baseline does not remove that doubt, but it makes it visible, and it lets you check that you measured the page you actually changed.',
      },
    ],
  },
]

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getPublishedPosts(): Post[] {
  return posts
    .filter((p) => p.published)
    // Same-day posts keep their order in `posts`, so the lead piece stays on top.
    .sort(
      (a, b) =>
        b.datePublished.localeCompare(a.datePublished) || posts.indexOf(a) - posts.indexOf(b)
    )
}
