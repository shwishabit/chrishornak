/* ── Authority Check: the example shown at rest ───────────────────────────
 * Made-up domains only (never real businesses). Values from the approved
 * comp: authority 14 / 10 / 8 / 4; proof keeps the comp's order (rival-a,
 * rival-b, you, rival-c) with HTTPS + privacy added. Linking-site counts are
 * scaled like real small sites (chrishornak.com: authority 7, 5 sites).
 * Renders through the same code as a real check, so ties, gaps and moves
 * come out of the real rules.
 * ─────────────────────────────────────────────────────────────────────── */

import type { AuthorityResult } from './authority-check'

export const AUTHORITY_CHECK_EXAMPLE: AuthorityResult = {
  checkedAt: '2026-10-01T12:00:00.000Z',
  asOf: '2026-09-01',
  linksStatus: 'ok',
  you: { domain: 'yourshop.com', links: 10, linkingSites: 8, proof: ['https', 'about', 'address'] },
  rivals: [
    {
      domain: 'rival-a.com',
      links: 14,
      linkingSites: 12,
      proof: ['https', 'about', 'reviews', 'people', 'schema', 'address', 'trade', 'privacy'],
    },
    {
      domain: 'rival-b.com',
      links: 8,
      linkingSites: 6,
      proof: ['https', 'about', 'reviews', 'people', 'credentials', 'address', 'privacy'],
    },
    { domain: 'rival-c.com', links: 4, linkingSites: 2, proof: ['about'] },
  ],
}
