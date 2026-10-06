/**
 * Authority Check · one sourced "Why:" line per scored check, shown on the fix cards.
 *
 * Approved by Chris 2026-10-06 from the evidence sheet (drafts/authority-check-evidence.html).
 * Full research, with the other sources and what couldn't be found:
 * Projects/chrishornak/research/authority-check-evidence/*.md
 *
 * Every line says what builds trust, never "this ranks you higher" (Google: "E-E-A-T itself
 * isn't a specific ranking factor"). Quotes are exact; BrightLocal and Google 2014 were
 * re-checked against the live pages on 2026-10-06.
 */
import type { ProofId } from './authority-check'

export interface Why {
  text: string
  /** Source name and year, as shown. */
  source: string
  href: string
}

const QRG = 'https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf'
const QRG_NAME = 'Google Search Quality Rater Guidelines, 2025'

/** The scored checks and link strength. "Good to know" rows are never scored, so they have no fix card and no line. */
export const WHY: Partial<Record<ProofId | 'links', Why>> = {
  // Experience
  work: {
    text: 'Google’s raters rate original photos made by the site itself as high originality.',
    source: QRG_NAME,
    href: QRG,
  },
  track: {
    text: 'Google’s raters count years of hands-on experience as a sign of expertise.',
    source: QRG_NAME,
    href: QRG,
  },
  // Expertise
  people: {
    text: 'Google’s raters are told every website should make clear who is responsible for it.',
    source: QRG_NAME,
    href: QRG,
  },
  credentials: {
    text: 'Google’s raters look for “verifiable credentials”, not just claims of “I’m an expert!”',
    source: QRG_NAME,
    href: QRG,
  },
  focus: {
    text: 'Google says a logical site structure helps people and search engines understand how your pages relate.',
    source: 'Google SEO Starter Guide, 2025',
    href: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
  },
  // Authority
  links: {
    text: 'Google says one sign of quality is whether other well-known websites link to or mention the content.',
    source: 'Google, How Search Works',
    href: 'https://www.google.com/intl/en_us/search/howsearchworks/how-search-works/ranking-results/',
  },
  reviewSites: {
    text: 'The average consumer uses six review sites when choosing a business.',
    source: 'BrightLocal Local Consumer Review Survey, 2026',
    href: 'https://www.brightlocal.com/research/local-consumer-review-survey/',
  },
  seen: {
    text: 'Google’s raters look for news articles, expert recommendations and independent ratings about a business.',
    source: QRG_NAME,
    href: QRG,
  },
  // Trust
  reviews: {
    text: 'Reviews from trusted peers are one of the most important things people use to judge a company.',
    source: 'Nielsen Norman Group, 2019',
    href: 'https://www.nngroup.com/articles/about-us-information-on-websites/',
  },
  address: {
    text: 'Google’s raters call contact information “extremely important” for sites that handle money.',
    source: QRG_NAME,
    href: QRG,
  },
  about: {
    text: 'Google tells its raters to start at the “About us” page when judging a site.',
    source: QRG_NAME,
    href: QRG,
  },
  https: {
    text: 'Google asks every site to use HTTPS “to keep everyone safe on the web.”',
    source: 'Google Search Central blog, 2014',
    href: 'https://developers.google.com/search/blog/2014/08/https-as-ranking-signal',
  },
  updated: {
    text: 'Google’s raters are told an abandoned website that nobody maintains is a reason for a low quality rating.',
    source: QRG_NAME,
    href: QRG,
  },
}

/** Why Trust is 40 of the 100 points (QRG 2025, p.27). Shown at the top of How we score. */
export const TRUST_WEIGHT: Why = {
  text: '“Trust is the most important member of the E-E-A-T family.”',
  source: `${QRG_NAME}, p.27`,
  href: QRG,
}

/**
 * What the sources don't set, said plainly on How we score (evidence sheet, "What the research
 * changes", approved 2026-10-06). Each line was a NOT FOUND or a caveat in the research.
 */
export const OWN_CHOICES: string[] = [
  'The points for each check are our own weighting. Trust gets the most, because Google calls it the most important part.',
  'The 2-month and 6-month windows for “Recently updated” are our own. No study sets them, and Google’s raters are told freshness is “generally less of a concern” when they rate page quality.',
  'Review spread and Seen elsewhere check the links on your site. Google’s raters look at the review profiles and the coverage themselves, so these two checks stand in for that.',
  'Domain Rating is Ahrefs’ estimate of your links, and Open PageRank is built from public crawl data. Neither is a Google score.',
  'Google’s raters are told many small local businesses have little press or reputation online, and that this is not a sign of low quality.',
  // Chris, 2026-10-06: Wikidata stays "Good to know", not a bonus.
  'Known entity (Wikidata) is shown but not scored. Anyone can add a Wikidata entry, including the owner, so having one proves little, and most small businesses don’t have one.',
]
