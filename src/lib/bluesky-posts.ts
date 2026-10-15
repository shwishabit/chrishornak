import type { BlueskyPost } from '@/lib/bluesky'

// Chris's Bluesky calendar. The daily cron (src/app/api/cron/bluesky) posts the entry
// whose date is today in New York. No entry for a date = nothing posts that day.
//
// Plan + weekly review: Projects/job-hunting/bluesky/. Rules: 300 characters per part,
// one image (with alt text) OR one link card per part, 2-4 parts for a thread (Story days).
// Images live in public/images/bluesky/ and stay under 950 KB.

export const blueskyPosts: BlueskyPost[] = [
  {
    date: '2026-10-16',
    parts: [
      {
        text: 'When you share your website on Bluesky, LinkedIn, or even by text, a picture and title pop up.\n\nThat card is your first impression. Ever checked it?\n\nLots of sites show no picture at all. Others show a random one. Nobody tells you. They just scroll.\n\nCheck yours: chrishornak.com/og-image-checker',
        link: 'https://chrishornak.com/og-image-checker',
      },
    ],
  },
]
