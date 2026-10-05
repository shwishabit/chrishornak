/* ── Authority Check: the questions at the end of the page ────────────────
 * One list for both the open/close answers on the page (AuthorityCheck.tsx)
 * and the FAQPage schema (authority-check/page.tsx), so the two can't drift.
 * Merges the old "What this can't see" box and "Based on Google's public
 * guidance" (Chris, 2026-10-05: "a lot of copy plopped at the bottom").
 * Wording kept from those two blocks; it stays legal-safe: our own score,
 * Google quoted, never "Google's score" (backlog.md, 2026-10-01). The
 * points come from the scoring constants, so they can't go stale.
 * ─────────────────────────────────────────────────────────────────────── */

import { LINK_BANDS, LINK_POINTS, OVERALL_TIE, PROOF_CHECKS, TIE_GAP } from './authority-check'

export interface FaqItem {
  id: string
  q: string
  /** Plain-text paragraphs: shown as written and used as the schema answer. */
  a: string[]
  links?: { href: string; label: string }[]
}

export const GOOGLE_HELPFUL = 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content'

/** Shown above the questions, never folded away (SEO panel: the score isn't a ranking). */
export const FAQ_LEAD = 'This is our score, not Google’s, and it doesn’t predict rankings.'

const pts = (id: string) => PROOF_CHECKS.find((c) => c.id === id)!.points
const bands = [...LINK_BANDS]
  .reverse()
  .filter((b) => b.points > 0)
  .map((b) => `Domain Rating ${b.from} gets ${b.points}`)
  .join(', ')

export const AUTHORITY_FAQ: FaqItem[] = [
  {
    id: 'based-on',
    q: 'What is this score based on?',
    a: [
      'Google calls it E-E-A-T: “experience, expertise, authoritativeness, and trustworthiness.” Google also says “E-E-A-T itself isn’t a specific ranking factor.” So this is our own score, built from the parts a website can show.',
      'Trust counts double, because Google says: “Of these aspects, trust is most important. The others contribute to trust.”',
      'Not made, checked or endorsed by Google. Google does not give sites an E-E-A-T score.',
    ],
    links: [{ href: GOOGLE_HELPFUL, label: 'Quotes: Google Search Central, “Creating helpful, reliable, people-first content”' }],
  },
  {
    id: 'cant-see',
    q: 'What can’t this check see?',
    a: [
      'It checks what your website shows. It can’t see your Google Business Profile, how close you are to the person searching, your Google rating, how many reviews you have and how recent they are, or whether visitors stay on your site.',
      'Those drive Google Maps more than anything here, so a rival can beat you in Maps with a weaker website.',
    ],
  },
  {
    id: 'ai',
    q: 'Will it tell me if ChatGPT or Google’s AI answers mention me?',
    a: [
      'No. No AI tool publishes how it picks the businesses it mentions, and its answers change from one ask to the next. So no score, ours included, can tell you whether ChatGPT, Gemini or Google’s AI answers will name you.',
    ],
  },
  {
    id: 'points',
    q: 'How are the points worked out?',
    a: [
      `Experience 20, Expertise 20, Authority 20, Trust 40, from ${PROOF_CHECKS.length} checks.`,
      `Experience: your work shown ${pts('work')}, a track record 6, or ${pts('track')} when it is strong (20+ years, or years plus a client count). A track record means 5 or more years in practice, or a count of 20 or more clients or jobs.`,
      `Expertise: real people ${pts('people')}, credentials ${pts('credentials')}, a page for each offer ${pts('focus')}.`,
      `Authority: link strength up to ${LINK_POINTS} (${bands}), links to your review profiles up to ${pts('reviewSites')} (1 review site 2, 2 sites 4, 3 or more ${pts('reviewSites')}), and places that feature you up to ${pts('seen')}.`,
      `Trust: reviews on your site ${pts('reviews')}, how to reach you ${pts('address')}, About page ${pts('about')}, secure site ${pts('https')}. Testimonials and review counts count once, under Reviews on your site.`,
      `70 and up overall is strong, 40 to 69 is fair, under 40 needs work. Totals less than ${OVERALL_TIE} points apart read as about the same, and Domain Ratings less than ${TIE_GAP} apart count as a tie. A site checked alone gets each part coloured as a share of that part’s points. “Good to know” rows are shown, never scored.`,
    ],
  },
  {
    id: 'data',
    q: 'Where does the data come from?',
    a: [
      'We read each homepage once. When the homepage doesn’t show enough, we also read its About page, reviews page and contact page, and look in its sitemap for one team page. For “Recently updated” (shown, not scored) we read the blog feed and the sitemap named in robots.txt; a sitemap date counts only when the page itself shows the same date. Expertise and most Trust checks use the same rules as the Findability Check.',
      'Link strength is the Domain Rating by Ahrefs. When Ahrefs is busy, we use Open PageRank instead, built from Common Crawl’s map of the web.',
    ],
    links: [
      { href: 'https://ahrefs.com/', label: 'Ahrefs' },
      { href: '/audit', label: 'The Findability Check' },
    ],
  },
]
