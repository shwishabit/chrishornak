/* Plain helpers shared by the dashboard's server and client components.
 * Kept out of DashParts.tsx ('use client'), because a server component
 * cannot call a function exported from a client module. */

export const CONTRA_JOBS = 'https://contra.com/jobs?preset=ALL'

export function ago(iso: string | undefined | null): string {
  if (!iso) return 'never'
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)} days ago`
}

/* Brand label inks (Nostromo, 2026-10-15): Swift Growth = orange, Blog Hands = blue,
 * Chris Hornak = pale mint. Everything else is a neutral grey. A square outlined label in
 * small mono caps, ink on the dark ground (all above 7:1). */
const BRAND_CHIP: Record<string, string> = {
  'Swift Growth': 'border-[#e8955f] text-[#e8955f]',
  'Blog Hands': 'border-[#8fb2e8] text-[#8fb2e8]',
  'Chris Hornak': 'border-[#c9f5dc] text-[#c9f5dc]',
}
const NEUTRAL_CHIP = 'border-[#a6aab2] text-[#a6aab2]'

/** Classes for a brand label: shape + that brand's color. */
export function brandChip(brand: string): string {
  return `shrink-0 border px-1.5 py-px text-[11px] uppercase tracking-[0.14em] ${BRAND_CHIP[brand] ?? NEUTRAL_CHIP}`
}
