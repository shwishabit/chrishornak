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

/* Brand label colors (Chris, 2026-10-15): Swift Growth = orange, Blog Hands = blue,
 * chrishornak.com = green (the site's own primary). Everything else stays neutral.
 * Dark is the default theme; light: overrides keep the text readable on white. */
const BRAND_CHIP: Record<string, string> = {
  'Swift Growth': 'border-orange-400/45 bg-orange-400/10 text-orange-300 light:border-orange-600/40 light:bg-orange-600/10 light:text-orange-700',
  'Blog Hands': 'border-blue-400/45 bg-blue-400/10 text-blue-300 light:border-blue-600/40 light:bg-blue-600/10 light:text-blue-700',
  'Chris Hornak': 'border-primary-line bg-primary-deep text-primary',
}
const NEUTRAL_CHIP = 'border-border text-foreground/85'

/** Classes for a brand label: shape + that brand's color. */
export function brandChip(brand: string): string {
  return `shrink-0 rounded border px-1.5 py-px text-[10.5px] font-medium ${BRAND_CHIP[brand] ?? NEUTRAL_CHIP}`
}
