// src/lib/writing.ts — /writing post metadata
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
  /** Rounded up from word count at 225 wpm. */
  readingMinutes: number
  faq: PostFaq[]
}

export const posts: Post[] = [
  {
    slug: 'shopify-theme-small-team',
    title: 'A small team moves fast if the Shopify theme allows it',
    teaser:
      'Shopify is rebuilding its theme layer so machines can read it. That is worth more to a two-person store than a large one, but only under one condition.',
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
]

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getPublishedPosts(): Post[] {
  return posts
    .filter((p) => p.published)
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))
}
