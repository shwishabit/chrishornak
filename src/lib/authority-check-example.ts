/* ── Authority Check: the example shown at rest ───────────────────────────
 * Made-up domains only (never real businesses), labelled "Example" on the
 * page. Same numbers as the approved mock (drafts/authority-check-results-
 * v4-comp.html): 79 · 48 · 24 · 9. The phrases behind the ✓ marks are
 * invented to show what a real check returns. Renders through the same code
 * as a real check, so places, colours, gaps and moves come out of the rules.
 * ─────────────────────────────────────────────────────────────────────── */

import type { AuthorityResult } from './authority-check'

export const AUTHORITY_CHECK_EXAMPLE: AuthorityResult = {
  checkedAt: '2026-10-01T12:00:00.000Z',
  asOf: '2026-09-01',
  linksStatus: 'ok',
  drStatus: 'ok',
  you: {
    domain: 'yourshop.com',
    links: 10,
    opr: 1.02,
    linkingSites: 8,
    dr: 10,
    proof: ['https', 'about', 'address'],
    evidence: {
      https: 'Loads over “https://”',
      about: 'A link to “/about”',
      address: 'Found “phone”: Call or text our phone line any day…',
    },
  },
  rivals: [
    {
      domain: 'rival-a.com',
      links: 14,
      opr: 1.41,
      linkingSites: 12,
      dr: 14,
      trackLevel: 2,
      proof: ['work', 'track', 'people', 'https', 'about', 'address', 'schema', 'trade', 'reviews', 'reviewSites'],
      evidence: {
        work: 'A link to “Our work” (/our-work)',
        track: 'Strong: “Serving the valley since 2004” (22 years) · 6 testimonials',
        people: 'Found “owner”: Meet Dana, owner and head baker…',
        https: 'Loads over “https://”',
        about: 'A link to “/about-us”',
        address: 'Found “address”: Our address is 12 Main Street…',
        schema: 'Code that says this is a “LocalBusiness”',
        trade: 'Found “bakery”: A small-batch bakery in town…',
        reviews: 'Found “4.9 stars”: Rated 4.9 stars by our regulars…',
        reviewSites: 'Links to your Google listing and Yelp page',
      },
    },
    {
      domain: 'rival-b.com',
      links: 8,
      opr: 0.83,
      linkingSites: 6,
      dr: 8,
      proof: ['people', 'credentials', 'https', 'about', 'address', 'reviews'],
      evidence: {
        people: 'Found “founder”: Sam, our founder, started…',
        credentials: 'Found “since 2009”: Serving the valley since 2009…',
        https: 'Loads over “https://”',
        about: 'A link to “/our-story”',
        address: 'Found “serving”: Serving the valley…',
        reviews: 'Found “Testimonials”: Testimonials from our customers…',
      },
    },
    {
      domain: 'rival-c.com',
      links: 4,
      opr: 0.41,
      linkingSites: 2,
      dr: 4,
      proof: ['about'],
      evidence: { about: 'A link to “/about”' },
    },
  ],
}
