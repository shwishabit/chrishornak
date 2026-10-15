import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from 'next/font/google'

/* Nostromo look (2026-10-15): IBM Plex Mono is the dashboard's one font; Plex Sans Condensed is only
 * the small grey detail line on each Feed item. Loaded here, applied on the dashboard wrapper only,
 * so the rest of the site keeps Sora + Inter. */
export const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-plex-mono', display: 'swap' })
export const plexCond = IBM_Plex_Sans_Condensed({ subsets: ['latin'], weight: ['400'], variable: '--font-plex-cond', display: 'swap' })
