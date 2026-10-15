import type { BlueskyPost } from '@/lib/bluesky'

// Chris's Bluesky calendar. The daily cron (src/app/api/cron/bluesky) posts the entry
// whose date is today in New York. No entry for a date = nothing posts that day.
//
// Plan + weekly review: Projects/job-hunting/bluesky/. Rules: 300 characters per part,
// one image (with alt text) OR one link card per part, 2-4 parts for a thread (Story days).
// Images live in public/images/bluesky/ and stay under 950 KB.

export const blueskyPosts: BlueskyPost[] = [
  {
    date: '2026-10-15',
    parts: [
      {
        text: 'When you share your website on Bluesky, LinkedIn, or even by text, a picture and title pop up.\n\nThat card is your first impression. Ever checked it?\n\nLots of sites show no picture at all. Others show a random one. Nobody tells you. They just scroll.\n\nCheck yours: chrishornak.com/og-image-checker',
        link: 'https://chrishornak.com/og-image-checker',
      },
    ],
  },
  {
    date: '2026-10-16',
    parts: [
      {
        text: 'Your contact form might be the quietest problem on your website.\n\nIt looks fine. The button works. The message goes nowhere.\n\nNobody calls to say "I tried to reach you." They just call someone else.\n\nFix for today: send yourself a message through your own form. Did it land?',
      },
    ],
  },
  {
    date: '2026-10-17',
    parts: [
      {
        text: "I'm not a software company. I built three free website tools with AI anyway.\n\nCan Google and AI find you? Do people like what they see when your link gets shared? How do you stack up against rivals?\n\nOne tool for each question. Found, seen, chosen.\n\nchrishornak.com/tools",
        link: 'https://chrishornak.com/tools',
      },
    ],
  },
  {
    date: '2026-10-18',
    parts: [
      {
        text: "Your buyers decide before they ever call you.\n\nThey search your name. They see your link shared. They open your site. They check who else vouches for you.\n\nBy the time your phone rings, the hard part is done.\n\nOr it never rings.",
      },
    ],
  },
  {
    date: '2026-10-19',
    parts: [
      {
        text: "That banner with the sale price baked into the picture? It's a tax.\n\nEvery price change is a design job. On a phone the words shrink to a squint. Screen readers only hear the alt text.\n\nPut the words on the page, not in the picture.\n\nchrishornak.com/blog/text-in-images",
        link: 'https://chrishornak.com/blog/text-in-images',
      },
    ],
  },
  {
    date: '2026-10-20',
    parts: [
      {
        text: 'A website can look great to people and still be invisible to Google and AI.\n\nThe Findability Check reads your site the way they do, then shows you what to fix.\n\nFree: chrishornak.com/audit',
        link: 'https://chrishornak.com/audit',
      },
    ],
  },
  {
    date: '2026-10-21',
    parts: [
      {
        text: "Most businesses run ads before they can say who they're for.\n\nIt feels like progress. It's just spending.\n\nPositioning. Then the message. Then the website. Then content. Then ads.\n\nSame effort in the wrong order, and nothing compounds.",
      },
    ],
  },
  {
    date: '2026-10-22',
    parts: [
      {
        text: 'The ads I ran for a local juice bar had one job: get real people to raise their hand.\n\nFacebook and Instagram. 153 leads. $9.80 each.',
      },
      {
        text: "Those leads came in a quarter when net sales rose 92%.\n\nI won't hand the ads all the credit. Local search, the website and email were all working that quarter too.\n\nThat's the point. One channel rarely wins alone. A plan does.",
      },
    ],
  },
  {
    date: '2026-10-23',
    parts: [
      {
        text: 'Google your business name. Right now.\n\nRead page one like a stranger would. Is your site at the top? Are your hours right? Is a three-year-old review the first thing they see?\n\nFor a lot of people, that page is your real homepage.',
      },
    ],
  },
  {
    date: '2026-10-24',
    parts: [
      {
        text: "You don't need to be a developer to build software anymore. You need to know what you want.\n\nI put my whole setup for building with AI on one free page. Two tracks: all free, or the tools I'd pick.\n\nchrishornak.com/learn/vibe-coding",
        link: 'https://chrishornak.com/learn/vibe-coding',
      },
    ],
  },
  {
    date: '2026-10-25',
    parts: [
      {
        text: "90 out of 100 feels good. In school it's an A.\n\nOn a website, 90 means something is still broken and you've gotten used to it.\n\nI build to 100.",
      },
    ],
  },
  {
    date: '2026-10-26',
    parts: [
      {
        text: 'Your product page might be arguing with itself.\n\n"Ships today" up top. "Out of stock" further down. Both were true the day someone typed them.\n\nShoppers can\'t tell which is right, so they doubt everything.\n\nchrishornak.com/blog/product-page-audit',
        link: 'https://chrishornak.com/blog/product-page-audit',
      },
    ],
  },
  {
    date: '2026-10-27',
    parts: [
      {
        text: "Who else says you're good?\n\nGoogle weighs that. So do your buyers.\n\nThe Authority Check scores your site out of 100, on its own or next to up to three competitors.\n\nFree: chrishornak.com/authority-check",
        link: 'https://chrishornak.com/authority-check',
      },
    ],
  },
  {
    date: '2026-10-28',
    parts: [
      {
        text: "Ask ChatGPT to recommend a business like yours in your town.\n\nDid it name you? Or your competitor?\n\nAI doesn't pick the best business. It picks the one it can describe clearly. That's a website problem, and it's fixable.",
      },
    ],
  },
  {
    date: '2026-10-29',
    parts: [
      {
        text: "Six months of work on a light-therapy store's Shopify site.\n\nOrganic traffic: up 500%.",
      },
      {
        text: "No tricks. Theme work, custom sections and better product pages, with SEO alongside it.\n\nThey're still on my Site Care Plan today. Good work compounds when someone keeps tending it.",
      },
    ],
  },
  {
    date: '2026-10-30',
    parts: [
      {
        text: "Open your website on your phone. Turn off the Wi-Fi first.\n\nThat's how a lot of your customers see it. Slow? Tiny text? A menu you can't tap?\n\nThey won't wait for it. Fix the phone version first.",
      },
    ],
  },
  {
    date: '2026-10-31',
    parts: [
      {
        text: 'Scary things hiding on small-business websites:\n\nA contact form that sends nothing.\nA © 2019 in the footer.\nA "coming soon" page from last spring.\nLinks that lead nowhere.\n\nHappy Halloween. Go check yours. 🎃',
      },
    ],
  },
]
