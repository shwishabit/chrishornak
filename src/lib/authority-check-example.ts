/* ── Authority Check: the example shown at rest ───────────────────────────
 * Made-up domains only (never real businesses), labelled "Example" on the
 * page. Authority 14 / 10 / 8 / 4 from the approved comp; linking-site counts
 * scaled like real small sites (chrishornak.com: authority 7, 5 sites). The
 * phrases behind the ✓ marks are invented to show what a real check returns.
 * Renders through the same code as a real check, so ties, gaps and moves
 * come out of the real rules.
 * ─────────────────────────────────────────────────────────────────────── */

import type { AuthorityResult } from './authority-check'

export const AUTHORITY_CHECK_EXAMPLE: AuthorityResult = {
  checkedAt: '2026-10-01T12:00:00.000Z',
  asOf: '2026-09-01',
  linksStatus: 'ok',
  you: {
    domain: 'yourshop.com',
    links: 10,
    linkingSites: 8,
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
      linkingSites: 12,
      proof: ['https', 'about', 'people', 'schema', 'address', 'trade', 'reviews'],
      evidence: {
        https: 'Loads over “https://”',
        about: 'A link to “/about-us”',
        people: 'Found “owner”: Meet Dana, owner and head baker…',
        schema: 'Code that says this is a “LocalBusiness”',
        address: 'Found “address”: Our address is 12 Main Street…',
        trade: 'Found “bakery”: A small-batch bakery in town…',
        reviews: 'Found “review”: Read a review from a regular…',
      },
    },
    {
      domain: 'rival-b.com',
      links: 8,
      linkingSites: 6,
      proof: ['https', 'about', 'people', 'credentials', 'address', 'reviews'],
      evidence: {
        https: 'Loads over “https://”',
        about: 'A link to “/our-story”',
        people: 'Found “founder”: Sam, our founder, started…',
        credentials: 'Found “since 2009”: Serving the valley since 2009…',
        address: 'Found “serving”: Serving the valley…',
        reviews: 'Found “testimonial”: Testimonials from our customers…',
      },
    },
    {
      domain: 'rival-c.com',
      links: 4,
      linkingSites: 2,
      proof: ['about'],
      evidence: { about: 'A link to “/about”' },
    },
  ],
}
