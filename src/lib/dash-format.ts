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
