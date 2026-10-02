/* ── Authority Check: the example shown at rest ───────────────────────────
 * Made-up domains only (never real businesses), labelled "Example" on the
 * page. Same sites as the approved mock (drafts/authority-check-results-
 * v4-comp.html), which showed 79 · 48 · 24 · 9; on today's Authority curve
 * they score 79 · 50 · 25 · 11. The phrases behind the ✓ marks are invented
 * to show what a real check returns, and each one passes today's rule for its
 * check (re-written 2026-10-02 for the stricter rules). Renders through the same code
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
      address: 'Found “412-555-0142”: Call or text 412-555-0142 any day…',
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
        people: 'Found “Dana”: Meet Dana, owner and head baker…',
        https: 'Loads over “https://”',
        about: 'A link to “/about-us”',
        address: 'Found “12 Main Street”: Our address is 12 Main Street…',
        schema: 'Code that says this is a “Bakery” named “Rival A Bakery”',
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
        people: 'Found “Sam Ortiz”: Sam Ortiz, our founder, started…',
        credentials: 'Found “since 2009”: Serving the valley since 2009…',
        https: 'Loads over “https://”',
        about: 'A link to “/our-story”',
        address: 'Found “412-555-0177”: Call 412-555-0177 to order…',
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
