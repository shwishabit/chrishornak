import type { BlueskyPost } from '@/lib/bluesky'

// Chris's Bluesky calendar. The daily cron (src/app/api/cron/bluesky) posts the entry
// whose date is today in New York. No entry for a date = nothing posts that day.
//
// Plan + weekly review: Projects/job-hunting/bluesky/. Rules: 300 characters per part,
// one image OR one video (both with alt text) OR one link card per part, 2-4 parts for a
// thread (Story days). Images live in public/images/bluesky/ and stay under 950 KB.
// Videos live in public/videos/bluesky/ (MP4, a few MB at most); their source pages are in
// Projects/job-hunting/bluesky/videos-src/ (skill: code-video).

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
  {
    date: '2026-11-01',
    parts: [
      {
        text: "Clocks went back last night. You got a free hour.\n\nSpend ten minutes of it on your website. Open it on your phone. Tap the contact button. Read your hours.\n\nIf it all checks out, go enjoy the other 50 minutes.",
      },
    ],
  },
  {
    date: '2026-11-02',
    parts: [
      {
        text: 'Before you change your website, write down one number.\n\nVisits. Calls. Sales. Whatever the change is meant to move.\n\nYou can redo a change any time. You can never go back and get the "before."\n\nchrishornak.com/blog/measure-website-changes',
        link: 'https://chrishornak.com/blog/measure-website-changes',
      },
    ],
  },
  {
    date: '2026-11-03',
    parts: [
      {
        text: "You get about 50 milliseconds to make a first impression online.\n\nIn a 2006 study, people's ratings of how a homepage looked after a 50 ms glimpse closely matched their ratings after a longer look.\n\nCalm and clear wins that glimpse. Clutter loses it.\n\ndoi.org/10.1080/01449290500330448",
        image: {
          src: '/images/bluesky/2026-11-03.jpg',
          width: 1800,
          height: 945,
          alt: 'A big "50 ms" next to the words "That\'s how long people take to judge how your website looks." Two bars: a short teal one for a 50 ms quick glimpse and a long one for a 500 ms longer look, with the line "Nearly the same rating both times." Source: Lindgaard and others, Behaviour and Information Technology, 2006. Ratings of visual appeal.',
        },
      },
    ],
  },
  {
    date: '2026-11-04',
    parts: [
      {
        text: "Your customers love you. Referrals keep coming.\n\nThen someone checks your website, and it tells a different story.\n\nTry this: send your site to three people who don't know you. Ask what you do.\n\nTheir answer is what your site says. Not yours.",
      },
    ],
  },
  {
    date: '2026-11-05',
    parts: [
      {
        text: "Your email list doesn't want a sales pitch in the first email.\n\nIt wants a reason to keep opening.",
        image: {
          src: '/images/bluesky/2026-11-05.jpg',
          width: 1800,
          height: 945,
          alt: 'Five steps in a row under the headline "Earn the call before you ask for it." First, something useful, free, no pitch. Then three emails: where you are now, where you could be, how to get there. Then the call, a next step.',
        },
      },
      {
        text: 'Give something useful first. A cheat sheet, a checklist, a straight answer.\n\nThen, one email at a time: where they are now, where they could be, how to get there.\n\nBy the time they book a call, the call is the next step, not a cold pitch.',
      },
    ],
  },
  {
    date: '2026-11-06',
    parts: [
      {
        text: "Set your holiday hours now. Not on December 23rd.\n\nIf Google shows you open on Thanksgiving and you're not, someone drives over to a locked door. They remember that.\n\nOn Google it takes a minute: Business Profile, Edit profile, Hours, Special hours. Then do Apple Maps and Yelp.",
        video: {
          src: '/videos/bluesky/2026-11-06.mp4',
          width: 1080,
          height: 1350,
          alt: 'Step-by-step animation: setting holiday hours on a Google Business Profile. 1, go to business.google.com. 2, choose Edit profile. 3, open Hours. 4, next to Special hours, choose Edit. 5, add a date such as Thanksgiving and keep Closed ticked. 6, save. End card: "Set them now. Not on December 23rd."',
        },
      },
    ],
  },
  {
    date: '2026-11-07',
    parts: [
      {
        text: 'Fill in this sentence before you spend another dollar on marketing:\n\n"We are [what] for [who], and we\'re different because [why]."\n\nCan\'t fill it with something specific? That\'s the real problem. Ads, content and your website all sit on top of it.\n\nchrishornak.com/signal/strategy-first',
      },
    ],
  },
  {
    date: '2026-11-08',
    parts: [
      {
        text: "Channels are easy to pick. Strategy is hard to say out loud.\n\nThat's why most people start with the channel.",
      },
    ],
  },
  {
    date: '2026-11-09',
    parts: [
      {
        text: "Most visitors read about 20% of the words on your page.\n\nNielsen Norman Group put the most people can read in an average visit at 28%. 20% is more likely.\n\nSo write for skimmers: headings that say the point, short paragraphs, the answer up top.\n\nnngroup.com/articles/how-little-do-users-read",
        image: {
          src: '/images/bluesky/2026-11-09.jpg',
          width: 1800,
          height: 945,
          alt: 'A big "20%" next to the words "of the words on a page get read." A block of ten text lines where only the first two are bright and the rest fade out. Source: Nielsen Norman Group, "How Little Do Users Read?", 2008.',
        },
      },
    ],
  },
  {
    date: '2026-11-10',
    parts: [
      {
        text: "Your homepage is trying to talk to everyone at once.\n\nBuyers. Job seekers. Partners. All staring at the same wall of text, all hunting for their door.\n\nNobody hunts for long.\n\nGive each one a path on the first screen. One line, one button each.",
        image: {
          src: '/images/bluesky/2026-11-10.jpg',
          width: 1800,
          height: 945,
          alt: 'A browser window under the headline "One homepage. A door for each visitor." The first screen has three cards: "I want to buy" with a Shop button, "I want a job" with a See jobs button, and "I want to partner" with a Talk to us button.',
        },
      },
    ],
  },
  {
    date: '2026-11-11',
    parts: [
      {
        text: 'To every veteran: thank you.\n\nFor the time you gave, and for the families who gave it alongside you.',
      },
    ],
  },
  {
    date: '2026-11-12',
    parts: [
      {
        text: 'Google tells you the exact words people typed before they found you.\n\nMost owners never look.',
        video: {
          src: '/videos/bluesky/2026-11-12.mp4',
          width: 1080,
          height: 1350,
          alt: 'Step-by-step animation in Google Search Console. 1, open Performance. 2, choose the Queries tab. 3, sort by Impressions. 4, find a search with lots of impressions but few clicks. 5, rewrite that page\'s title in the words people typed. 6, check the same search again in a month.',
        },
      },
      {
        text: "It's in Search Console, Google's free report. Open Performance, then Queries.\n\nSort by impressions. Find a search where you show up a lot but few people click.\n\nRewrite that page's title in the words they typed. Check the same search again in a month.",
      },
    ],
  },
  {
    date: '2026-11-13',
    parts: [
      {
        text: "Ten-minute fix: write alt text for the three biggest pictures on your homepage.\n\nIt's the line a screen reader says out loud in place of the picture. If your picture has words baked in, those words need to be in it too.\n\nchrishornak.com/blog/text-in-images",
        link: 'https://chrishornak.com/blog/text-in-images',
      },
    ],
  },
  {
    date: '2026-11-14',
    parts: [
      {
        text: 'Name your services the way your customers search for them.\n\nYou call it a "brand discovery session." They type "help with my logo."\n\nSearch runs on their words, not yours. So does the person skimming your menu.',
        image: {
          src: '/images/bluesky/2026-11-14.jpg',
          width: 1800,
          height: 945,
          alt: 'Headline: "Your words aren\'t their words." On the left, a services menu labelled "You call it" with "Brand discovery session" picked out. A not-equal sign. On the right, a search box labelled "They type" with "help with my logo" typed in.',
        },
      },
    ],
  },
  {
    date: '2026-11-15',
    parts: [
      {
        text: '"Approved" and "ready to publish" are not the same word.\n\nApproved means someone liked it. Ready means someone checked it.',
      },
    ],
  },
  {
    date: '2026-11-16',
    parts: [
      {
        text: "96.55% of web pages get zero traffic from Google.\n\nThat's from an Ahrefs study of about 14 billion pages.\n\nOne free way to give a new post a better shot: the day it goes live, link to it from 2 or 3 older posts. A page nothing points to is a room with no door.\n\nahrefs.com/blog/search-traffic-study",
        image: {
          src: '/images/bluesky/2026-11-16.jpg',
          width: 1800,
          height: 945,
          alt: 'A big "96.55%" next to the words "of web pages get zero traffic from Google." A grid of 100 small squares where almost all are dim and only a few glow teal. Source: Ahrefs study of about 14 billion pages, 2023.',
        },
      },
    ],
  },
  {
    date: '2026-11-17',
    parts: [
      {
        text: "Your Google Analytics may be throwing away your history.\n\nGA4 can keep the detail behind its deeper reports for just 2 months. Standard reports are fine. Digging into last year isn't.\n\nThe 30-second fix is in the video. Do it today before more drops off.\n\nchrishornak.com/blog/measure-website-changes",
        video: {
          src: '/videos/bluesky/2026-11-17.mp4',
          width: 1080,
          height: 1350,
          alt: 'Step-by-step animation in Google Analytics 4. 1, open Admin. 2, under Property, choose Data Settings, then Data Retention. 3, change Event data retention from 2 months to 14 months. 4, click Save. Note: explorations and funnel reports use this setting. Standard reports are not affected.',
        },
      },
    ],
  },
  {
    date: '2026-11-18',
    parts: [
      {
        text: "More blog posts can make your blog weaker.\n\nThree posts on the same topic don't add up. They fight each other in search, and none of them wins.\n\nOne strong page, with smaller posts linking to it, beats a pile of near-copies.\n\nchrishornak.com/signal/content-structure",
        link: 'https://chrishornak.com/signal/content-structure',
      },
    ],
  },
  {
    date: '2026-11-19',
    parts: [
      {
        text: "Does your monthly website report show how you appear in Google's AI answers?\n\nGoogle answers more searches with an AI summary at the top now. Clicks and rankings show only half of it.\n\nAsk whoever sends your report to add it. Rankings are one door. AI answers are another.",
      },
    ],
  },
  {
    date: '2026-11-20',
    parts: [
      {
        text: "Before Black Friday: does your price match everywhere it shows?\n\nProduct page. Banner. Cart. Email.\n\nTwo prices, and the shopper trusts neither. The fix that lasts: give each price one home in your store, so a change happens once.\n\nchrishornak.com/blog/shopify-theme-small-team",
        link: 'https://chrishornak.com/blog/shopify-theme-small-team',
      },
    ],
  },
  {
    date: '2026-11-21',
    parts: [
      {
        text: 'Read your homepage out loud.\n\nIf you\'d never say it to a customer\'s face, don\'t say it on your site.\n\n"Innovative solutions for your business needs" sounds fine in a meeting. Out loud, it sounds like nobody\'s home.',
        image: {
          src: '/images/bluesky/2026-11-21.jpg',
          width: 1800,
          height: 945,
          alt: 'Headline: "Read it out loud. Would you say that?" Two speech bubbles. A faded one says "Innovative solutions for your business needs," labelled "Fine in a meeting." A bright teal one says "We fix leaky roofs. Most jobs, same week," labelled "Sounds like a person."',
        },
      },
    ],
  },
  {
    date: '2026-11-22',
    parts: [
      {
        text: "Don't redesign your store the week before Black Friday.\n\nYou'll never know if the new one worked. You'll just know it was busy.",
      },
    ],
  },
  {
    date: '2026-11-23',
    parts: [
      {
        text: 'Three checks for your product page before the rush:\n\n1. Does "in stock" up top match the stock line below?\n2. Does the shipping promise still hold if it sells out?\n3. Is the guarantee the same length everywhere it\'s mentioned?\n\nchrishornak.com/blog/product-page-audit',
        link: 'https://chrishornak.com/blog/product-page-audit',
      },
    ],
  },
  {
    date: '2026-11-24',
    parts: [
      {
        text: "About 70% of online shopping carts get left before checkout.\n\nBaymard Institute averaged 50 studies to get that number. The top reason, at 40%: extra costs too high. Shipping, tax, fees.\n\nBefore Cyber Monday, show the full cost before the cart.\n\nbaymard.com/lists/cart-abandonment-rate",
        image: {
          src: '/images/bluesky/2026-11-24.jpg',
          width: 1800,
          height: 945,
          alt: 'A big "70%" next to the words "of online shopping carts get left before checkout." Ten small cart icons, seven dimmed and three teal. Below: "Top reason: extra costs too high (40%)." Source: Baymard Institute, average of 50 studies.',
        },
      },
    ],
  },
  {
    date: '2026-11-25',
    parts: [
      {
        text: "If ChatGPT can't describe your business in one sentence, your customers probably can't either.\n\nAI recommends what it can explain. So do people.\n\nWrite the sentence: what you do, who it's for, why you. Put it at the top of your homepage.\n\nchrishornak.com/signal/ai-readiness",
        link: 'https://chrishornak.com/signal/ai-readiness',
      },
    ],
  },
  {
    date: '2026-11-26',
    parts: [
      {
        text: "Happy Thanksgiving.\n\nThanks for reading along. Go eat. The internet will still be here tomorrow.",
      },
    ],
  },
  {
    date: '2026-11-27',
    parts: [
      {
        text: 'Shop owners, today\'s rule: watch the numbers. Change nothing.\n\nNo new theme. No new checkout app. No "quick tweak" at 2 PM.\n\nWrite down what you see. That\'s your baseline for next year.',
        video: {
          src: '/videos/bluesky/2026-11-27.mp4',
          width: 1080,
          height: 1350,
          alt: 'Step-by-step animation: take a Black Friday baseline in 5 minutes. 1, pick the one number that matters most, like orders. 2, write the date range. 3, screenshot your top page. 4, note the tool and its settings. 5, list anything else running, like an email or ad. 6, pick the date you will compare. End card: "Watch the numbers. Change nothing."',
        },
      },
    ],
  },
  {
    date: '2026-11-28',
    parts: [
      {
        text: "Shop small today.\n\nIf you own a small shop, make sure people can find you. Right hours on Google. Right address on Apple Maps and Yelp.\n\nThe best sale in town doesn't help if the map sends people to the wrong door.",
        image: {
          src: '/images/bluesky/2026-11-28.jpg',
          width: 1800,
          height: 945,
          alt: 'Headline: "Easy to find is half the sale." A checklist: hours right on Google, address right on Apple Maps, address right on Yelp, all ticked. The last box, holiday hours set, is still empty, with a mouse pointer on it.',
        },
      },
    ],
  },
  {
    date: '2026-11-29',
    parts: [
      {
        text: 'Rest is part of the plan.\n\nNot the reward for finishing it.',
      },
    ],
  },
  {
    date: '2026-11-30',
    parts: [
      {
        text: "Cyber Monday trick: you changed your share picture, but the old one still pops up?\n\nPlatforms remember a picture by its file name. Save the new one under a new name, then refresh the link in LinkedIn's Post Inspector.\n\nchrishornak.com/blog/og-image",
        link: 'https://chrishornak.com/blog/og-image',
      },
    ],
  },
]
