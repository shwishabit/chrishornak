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
]

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getPublishedPosts(): Post[] {
  return posts
    .filter((p) => p.published)
    // Same-day posts: the one added later to `posts` is the newer one.
    .sort(
      (a, b) =>
        b.datePublished.localeCompare(a.datePublished) || posts.indexOf(b) - posts.indexOf(a)
    )
}
