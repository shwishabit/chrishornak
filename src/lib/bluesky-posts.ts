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
        text: "Before you share your homepage, paste the link into a LinkedIn or Bluesky post. Don't hit Post yet.\n\nLook at the card that shows up. Is the image cut off? Does the title match the page?\n\nPeople see that card first. Check it before they do.\n\nFree check: chrishornak.com/og-image-checker",
        link: 'https://chrishornak.com/og-image-checker',
      },
    ],
  },
]
