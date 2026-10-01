/* ── Authority Check: the example shown at rest ───────────────────────────
 * Made-up domains only (never real businesses). Values from the approved
 * comp: links 14 / 10 / 8 / 4, proof 6 / 5 / 2 / 1. Renders through the same
 * code as a real check, so ties, gaps and moves come out of the real rules.
 * ─────────────────────────────────────────────────────────────────────── */

import type { AuthorityResult } from './authority-check'

export const AUTHORITY_CHECK_EXAMPLE: AuthorityResult = {
  checkedAt: '2026-10-01T12:00:00.000Z',
  asOf: '2026-09-01',
  linksStatus: 'ok',
  you: { domain: 'yourshop.com', links: 10, proof: ['about', 'address'] },
  rivals: [
    { domain: 'rival-a.com', links: 14, proof: ['about', 'reviews', 'people', 'schema', 'address', 'trade'] },
    { domain: 'rival-b.com', links: 8, proof: ['about', 'reviews', 'people', 'credentials', 'address'] },
    { domain: 'rival-c.com', links: 4, proof: ['about'] },
  ],
}
