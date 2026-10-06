/* ── Authority Check: the example shown at rest ───────────────────────────
 * Made-up domains only (never real businesses), labelled "Example" on the
 * page. The same four sites as the approved mock (drafts/authority-check-
 * results-v4-comp.html), re-written 2026-10-02 for the 11 checks of the SEO
 * panel's final spec, and 2026-10-05 for Recently updated (HTTPS 2, reach 11):
 * they score 84 · 62 · 25 · 8. The phrases behind the ✓
 * marks are invented to show what a real check returns, and each one passes
 * today's rule for its check. Renders through the same code as a real check,
 * so places, colours, gaps and moves come out of the rules.
 * ─────────────────────────────────────────────────────────────────────── */

import type { AuthorityResult } from './authority-check'

export const AUTHORITY_CHECK_EXAMPLE: AuthorityResult = {
  checkedAt: '2026-10-02T12:00:00.000Z',
  asOf: '2026-09-01',
  linksStatus: 'ok',
  drStatus: 'ok',
  you: {
    domain: 'yourshop.com',
    links: 10,
    opr: 1.02,
    linkingSites: 8,
    dr: 10,
    proof: ['address', 'about', 'https', 'age'],
    evidence: {
      age: 'First registered in 2019',
      address: 'Found “412-555-0142”: Call or text 412-555-0142 any day…',
      about: 'A link to “/about”',
      https: 'Loads over “https://”',
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
      freshLevel: 2,
      reviewSiteCount: 2,
      seenCount: 1,
      proof: ['work', 'track', 'people', 'focus', 'reviewSites', 'seen', 'reviews', 'address', 'about', 'https', 'updated', 'schema', 'trade', 'area', 'name', 'age'],
      evidence: {
        work: 'A link to “Our work” (/our-work)',
        track: 'Strong: “since 2004” (22 years) · “Over 300 weddings”',
        people: 'Found “Dana”: Meet Dana, owner and head baker…',
        focus: '5 offer pages: /cakes, /breads, /catering, /wholesale …',
        reviewSites: 'Links to your Google listing and Yelp page',
        seen: 'A link to LinkedIn',
        reviews: 'Found “4.9 stars”: Rated 4.9 stars by our regulars…',
        address: 'Found “12 Main Street”: Our address is 12 Main Street…',
        about: 'A link to “/about-us”',
        https: 'Loads over “https://”',
        schema: 'Code that says this is a “Bakery” named “Rival A Bakery”',
        trade: 'Found “bakery”: A small-batch bakery in town…',
        area: 'Found “Serving Allegheny County”: Serving Allegheny County since 2004…',
        name: 'Same name in the schema, share name, © line: “Rival A Bakery”',
        updated: 'Newest post in your blog feed: Sep 24, 2026 (/blog/fall-menu)',
        age: 'First registered in 2004; your site says 2004',
      },
    },
    {
      domain: 'rival-b.com',
      links: 8,
      opr: 0.83,
      linkingSites: 6,
      dr: 8,
      trackLevel: 1,
      freshLevel: 1,
      proof: ['track', 'people', 'credentials', 'reviews', 'address', 'about', 'https', 'updated'],
      evidence: {
        track: '“since 2009” (17 years)',
        updated: 'Your sitemap and the page agree: updated Jun 3, 2026 (/our-story)',
        people: 'Found “Sam Ortiz”: Sam Ortiz, our founder, started…',
        credentials: 'Found “licensed”: Licensed and insured, serving the valley since 2009…',
        reviews: 'Found “Testimonials”: Testimonials from our customers…',
        address: 'Found “412-555-0177”: Call 412-555-0177 to order…',
        about: 'A link to “/our-story”',
        https: 'Loads over “https://”',
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
