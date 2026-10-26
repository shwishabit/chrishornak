// src/lib/data.ts — Chris Hornak personal brand hub

import type { NavLink, Project, SiteConfig, Testimonial } from './types'

export const siteConfig: SiteConfig = {
  brandName: 'Chris Hornak',
  supportEmail: 'chris@chrishornak.com',
  copyrightYear: new Date().getFullYear(),
  defaultTitle: 'Marketing Strategist for Growing Businesses | Chris Hornak',
  defaultDescription: 'Marketing strategist helping businesses get found, stay found, and turn visibility into results. Strategy that makes everything else work.',
  domain: 'https://chrishornak.com',
}

export const navLinks: NavLink[] = [
  { label: 'About', href: '/#about' },
  { label: 'Approach', href: '/#services' },
  { label: 'Work', href: '/work' },
  { label: 'Blog', href: '/blog' },
  { label: 'Be The Signal', href: '/signal' },
]

/**
 * The free tools, in order, as the owner's three questions: Found → Seen →
 * Chosen (Chris, 2026-10-01; /signal's "find you, trust you, and choose you").
 * Then the 4th step is a call ("What should you fix first?"). One list for the
 * "Free tools" menu, the footer, /tools and the strip at the end of each tool.
 */
export const toolLinks = [
  {
    step: 'Found',
    label: 'Findability Check',
    question: 'Can your website be found?',
    href: '/audit',
    summary: 'Whether search engines and AI can read your site and list it.',
  },
  {
    step: 'Seen',
    label: 'Open Graph Checker',
    question: 'What do people see when they find you?',
    href: '/og-image-checker',
    summary: 'How your link looks in Google and when it is shared, and what to fix.',
  },
  {
    step: 'Chosen',
    label: 'Authority Check',
    question: 'How do you stack up?',
    href: '/authority-check',
    summary: 'Your site’s score out of 100, alone or next to up to 3 rivals.',
  },
] as const

/** The shared ending on every tool: the 4th step is a person. */
export const toolEnding = {
  heading: 'What should you fix first?',
} as const

export const heroContent = {
  headline: 'Your next customer is looking for you.',
  headlineAccent: 'Let\'s make sure you get found.',
  subheadline: 'I\'m Chris Hornak — marketing strategist for businesses that need to get found, stay found, and turn that visibility into results. I bring the strategy that makes everything else work.',
  // Main CTA = Hire me, Findability secondary (Chris, 2026-10-14)
  ctaText: 'Hire me',
  ctaLink: '/hire',
}

/**
 * /hire: the page every contract / freelance pitch links to (Chris, 2026-10-14).
 * Builds first, strategy behind it. No prices. `available` is the one switch:
 * false swaps the "Taking new contract work" line for a booked-up line, the
 * form stays open.
 */
export const hireContent = {
  available: true,
  availableText: 'Taking new contract work',
  bookedText: 'Booked up right now. Ask about later dates.',
  // Hirers' own asks (job-hunting/applications, Aug–Oct 2026): "designed and built", work on the
  // site they already have, mobile-first, SEO, design plus copy together. Chris: design, write,
  // build and find. Accent line in teal, like the homepage hero.
  headline: 'I design, write and build your site.',
  headlineAccent: 'Then I make sure people find it.',
  subheadline:
    'Freelance and contract websites, fully remote. A new site on my own system with Sanity as your editor, or fixes to the one you already have. Mobile-first, ready for search and AI, and I do the work myself.',
  ctaText: 'Tell me about the role',
  builds: [
    { slug: 'custom-craft', caption: 'Custom Craft', detail: 'Home builder' },
    { slug: 'tommie-whitener', caption: 'Tommie W. Whitener', detail: 'Author' },
    { slug: 'pontiva', caption: 'Pontiva Advisory', detail: 'Energy advisory' },
  ],
} as const

/** Choices on the /hire role form. The server action only accepts these. */
export const ROLE_TIMELINES = ['As soon as possible', 'Within a month', 'In 1–3 months', 'Not sure yet'] as const
export const ROLE_BUDGETS = [
  'Under $1,000',
  '$1,000–$3,000',
  '$3,000–$10,000',
  '$10,000+',
  'Hourly',
  'Not set yet',
] as const

export const aboutContent = {
  headline: 'Strategy first. Everything else follows.',
  body: [
    'You don\'t have a marketing problem. You have a strategy problem. Most businesses hire marketers to check boxes — run some ads, write some blogs, fix the SEO. And most of it doesn\'t work because nobody asked the hard question first: what\'s actually going to move this business forward?',
    'That\'s what I do. I\'ve built content companies, launched growth agencies, and helped businesses at every stage — from their first website to full-scale marketing operations. The principle is always the same: strategy before tactics.',
    'I do the work myself, hands-on, from the first call to the launch. You get someone who\'s thinking about your business — not just executing a checklist.',
  ],
}

export const testimonials: Testimonial[] = [
  {
    quote: 'Before working with Chris, we had no online presence. He built our website from scratch, helping us define and communicate our brand to investors, partners, and stakeholders. The result supports our future growth.',
    name: 'David Horell',
    title: 'Benefits and Payroll Coordinator',
    company: 'Speranza Consulting and Investments',
    initials: 'DH',
    image: '/images/testimonials/david-horell.jpg',
  },
  {
    quote: 'Working with Chris is like having a strategist on staff! We collaborate to develop topic lists and then his team takes it from there. I am impressed with their ability to research almost any topic and make suggestions. Perfect complement to our in-house capabilities.',
    name: 'Meredith Smith',
    title: 'Marketing Manager',
    company: 'StrucSure Home Warranty',
    initials: 'MS',
    image: '/images/testimonials/meredith-smith.jpg',
  },
  {
    quote: 'Chris has been an invaluable partner. He\'s a hands-on problem solver who jumps right in when we face technical challenges. His work is consistently reliable, and the communication is always direct and collaborative.',
    name: 'Cheryl Cassidy',
    title: 'Marketing Executive',
    company: 'Rehab Essentials',
    initials: 'CC',
    image: '/images/testimonials/cheryl-cassidy.jpg',
  },
  {
    quote: 'Chris grasped our strategic objectives quickly and delivered a comprehensive digital strategy that aligned seamlessly with our goals. His approach is professional, responsive, and results-driven.',
    name: 'John Kleist III',
    title: 'Chief Growth and Alliance Officer',
    company: 'SkillsTX',
    initials: 'JK',
    image: '/images/testimonials/john-kleist.jpg',
  },
]

export const workContent = {
  eyebrow: 'Selected work',
  headline: 'Strategy, made real.',
  intro:
    'I don\'t just advise on this stuff. I build it. Brands and sites for the businesses I work with, plus companies and products of my own. Here\'s a few, with the thinking behind each one.',
  clientLabel: 'For the businesses I work with',
  creativeLabel: 'Concepts, motion and social',
  ownedLabel: 'And a few of my own',
}

export const projects: Project[] = [
  // ── Client work (leads the page) ──
  {
    slug: 'pontiva',
    name: 'Pontiva Advisory',
    kind: 'client',
    url: 'https://pontivaadvisory.com',
    category: 'Energy advisory · Client',
    role: 'Positioning · Brand · Build',
    outcome:
      'A veteran energy advisor with a Goldman-and-bp résumé, and no website to match it. We built a presence with institutional weight, so a solo practice reads like the firm it competes against.',
    image: '/images/work/pontiva.webp',
  },
  {
    slug: 'pa-pardon',
    name: 'PA Pardon',
    kind: 'client',
    url: 'https://www.papardon.com/',
    category: 'Law firm · Client',
    role: 'Strategy · Brand · Build',
    outcome:
      'A Pittsburgh expungement attorney whose old site buried 30 years of work. We rebuilt it around one promise, your record can be cleared, with the city\'s own bridges carrying the weight. A clear path from a worried search to a free evaluation.',
    image: '/images/work/pa-pardon.webp',
  },
  {
    slug: 'tommie-whitener',
    name: 'Tommie W. Whitener',
    kind: 'client',
    url: 'https://tommiewhitener.com',
    category: 'Author · Client',
    role: 'Brand · Build',
    outcome:
      'Seven novels and a life spent watching people closely. The site needed to read like his prose, so we built it editorial and unhurried, with the writing out front instead of the design.',
    image: '/images/work/tommie-whitener.webp',
  },
  {
    slug: 'speranza',
    name: 'Speranza Consulting',
    kind: 'client',
    url: 'https://www.speranzaconsulting.com/',
    category: 'Consulting · Client',
    role: 'Positioning · Brand · Build',
    outcome:
      'A consulting and investments firm that had no online presence at all. We built the whole thing from scratch, positioning, brand, and site, so a multi-industry practice finally had a home that matched its ambition.',
    image: '/images/work/speranza-v2.webp',
  },
  {
    slug: 'custom-craft',
    name: 'Custom Craft Construction',
    kind: 'client',
    url: 'https://www.customcraftwv.com/',
    category: 'Home construction · Client',
    role: 'Brand · Build',
    outcome:
      'A custom builder in the Ohio Valley whose best sales tool was the work itself. The site leads with finished spaces, kitchens and baths front and center, so the craft does the selling before a word does.',
    image: '/images/work/custom-craft.webp',
  },
  // ── Concepts, motion and social ──
  {
    slug: 'landforce',
    name: 'Landforce',
    kind: 'creative',
    url: '/media/work/landforce-scroll.mp4',
    category: 'Nonprofit · Website redesign concept',
    role: 'Strategy · UX · Design · Build',
    outcome:
      'A Pittsburgh nonprofit that pays people to train on real work: caring for the city\'s land and milling its fallen trees into lumber. I directed a full redesign concept that gives four visitors their own path from the first screen: join the crew, hire a crew, buy wood or support the mission. Behind it sit a lumber catalog with holds and a staff app for yard stock.',
    image: '/images/work/landforce.webp',
    video: '/media/work/landforce-preview.mp4',
    frameLabel: 'Landforce · redesign concept',
    cta: 'Watch the walkthrough',
  },
  {
    slug: 'site-audit-explainer',
    name: 'Swift Site Audit explainer',
    kind: 'creative',
    url: 'https://www.youtube.com/watch?v=LNBpq1pU8Kw',
    category: 'Motion · Explainer video',
    role: 'Script · Design · Motion',
    outcome:
      'A site audit is a hard thing to explain in a feed. This 100-second video walks through a buyer\'s visit in five steps, from the first search to the decision, then shows an example score and fix plan. Every frame is drawn in code, so a script change is an edit, not a reshoot.',
    image: '/images/work/site-audit-explainer.webp',
    video: '/media/work/site-audit-preview.mp4',
    frameLabel: 'youtube.com · 1:40',
    cta: 'Watch on YouTube',
  },
  {
    slug: 'social-creative',
    name: 'Social creative',
    kind: 'creative',
    url: '/media/work/juicery-case-study.pdf',
    category: 'Paid + organic social · Clients',
    role: 'Concept · Design · Copy · Reporting',
    outcome:
      'Facebook and Instagram ads for a local juice bar: one offer across the whole product line, with a new product shot in each ad. 153 leads at $9.80 each, in a quarter when net sales rose 92%. Plus monthly posts for Speranza Consulting, 12 to 15 a month, written, designed and scheduled.',
    image: '/images/work/social-creative.webp',
    frameLabel: 'Juicery case study · PDF',
    cta: 'Read the case study',
  },
  // ── Built & owned (closes the page) ──
  {
    slug: 'swift-growth',
    name: 'Swift Growth Marketing',
    kind: 'owned',
    url: 'https://swiftgrowth.marketing',
    category: 'Agency · Co-founded',
    role: 'Positioning · Brand · Build',
    outcome:
      'My agency, and the team behind a lot of the work on this page. Built on a simple bet: buyers start with questions, not ads, and the brands that answer them best become the ones people trust.',
    image: '/images/work/swift-growth-v2.webp',
  },
  {
    slug: 'blog-hands',
    name: 'Blog Hands',
    kind: 'owned',
    url: 'https://bloghands.com',
    category: 'SaaS · Built & owned',
    role: 'Strategy · Brand · Full-stack build',
    outcome:
      'A content service I\'d run since 2012, rebuilt as software. Drop in a URL and get a blog post in your brand voice, AI by default with a human on demand. The service became the product.',
    image: '/images/work/bloghands.webp',
  },
  {
    slug: 'f0rmless',
    name: 'f0rmless',
    kind: 'owned',
    url: 'https://f0rmless.com',
    category: 'Product · Built & owned',
    role: 'Concept · Brand · Build',
    outcome:
      'Competitive gaming\'s schedule lives scattered across a dozen sites. f0rmless pulls every match into one broadcast-style guide, 12 games and one live signal. The esports TV guide that didn\'t exist yet.',
    image: '/images/work/f0rmless.webp',
  },
  {
    slug: 'findability-check',
    name: 'Findability Check',
    kind: 'owned',
    url: '/audit',
    category: 'Tool · Built & owned',
    role: 'Product · Build · Research',
    outcome:
      'The first thing I check on any website, turned into a free tool anyone can run. It scores the seven signals that decide whether people and AI can find you, benchmarked against 190+ real businesses. Try it on this site right now.',
    image: '/images/work/findability.webp',
  },
]

export const homeFaqs = [
  {
    question: 'What kind of businesses do you work with?',
    answer: 'Everything from local shops getting online for the first time to established companies rethinking their marketing. I work with founders, CEOs, and marketing leaders who want a strategy — not just someone to run ads or write blogs.',
  },
  {
    question: 'How is this different from hiring an agency?',
    answer: 'Agencies sell deliverables. I start with the question most skip: what\'s actually going to move your business forward? You get a strategist thinking about your business, not a team executing a checklist.',
  },
  {
    question: 'What does working together look like?',
    answer: 'It starts with a conversation. I diagnose what\'s working and what isn\'t, build a strategy, then do the work hands-on. I stay involved until it\'s working.',
  },
  {
    question: 'Do you do the work yourself or outsource it?',
    answer: 'I do it myself. The strategy, the build, the writing and the SEO are all hands-on, and you work with me directly from start to finish.',
  },
  {
    question: 'What if I just need a website?',
    answer: 'I can do that. But I\'ll also ask why — because a website without strategy behind it is just a brochure. Even a simple build benefits from thinking through who you\'re trying to reach and what you want them to do. I\'m a Shopify Partner and a Squarespace Circle partner, so I can build or fix a site on either.',
  },
  {
    question: 'How do I know if I need a strategist or just a doer?',
    answer: 'If you know exactly what needs to happen and just need someone to execute, you need a doer. If things aren\'t working and you\'re not sure why — or you\'re growing and don\'t know what to prioritize — that\'s where strategy makes the difference.',
  },
  {
    question: 'My site gets traffic but nobody calls. Is that a marketing problem?',
    answer: 'Usually it\'s a CTA problem. If visitors can find you but don\'t know what to do next — or the next step isn\'t clear, compelling, and trackable — you\'re leaking the value your marketing already earned. Every site I build has one primary call to action that\'s measurable, so we know exactly what\'s working.',
  },
  {
    question: 'We used to rank well. What changed?',
    answer: 'Usually one of three things: Google updated its algorithm, a competitor invested in the same keywords, or AI started answering the question instead of linking to your page. The fix depends on which one it is. Run the Findability Check to see where your signals stand now — that\'s the fastest way to diagnose it.',
  },
]

export const auditFaqs = [
  {
    question: 'What does the Findability Check measure?',
    answer: 'It measures the strength of your signal — the 7 areas that determine whether people, search engines, and AI can find your business online: Search visibility, AI readiness, Social sharing, Mobile experience, Site structure, Accessibility, and Security. These are what I look at first when evaluating any business.',
  },
  {
    question: 'Is this really free?',
    answer: 'Yes. No signup, no email required, no catch. I built this because it\'s the first thing I do when someone asks me to look at their site — and I wanted to make that step available to everyone.',
  },
  {
    question: 'How is this different from other website audit tools?',
    answer: 'Most tools spit out a list of technical errors. This checks what a strategist actually looks at first — whether your site can be found, trusted, and shared by the people and platforms that matter to your business.',
  },
  {
    question: 'How is the findability score calculated?',
    answer: 'Your findability score is a weighted average across the 7 categories — Search visibility, AI readiness (AEO/GEO), Social sharing, Mobile experience, Site structure, Accessibility, and Security. Each category is graded on the signals inside it, then weighted by how much it actually affects whether you get found, so a high-weight category moves your score more than a minor one. You get the number instantly, along with the specific items to fix.',
  },
  {
    question: 'What should I do after I get my score?',
    answer: 'Start with the red items — those are the things actively hurting your findability. If you want help prioritizing or need a deeper look at what\'s behind the numbers, that\'s what the conversation is for.',
  },
  {
    question: 'Does a high score mean my marketing is working?',
    answer: 'It means the foundation is solid. Findability is one piece — it tells you whether people can find you. Strategy, content, and positioning are what make them stay. This check gives you the starting point. It\'s the same starting point I set for every project I take on.',
  },
  {
    question: 'How often should I run this check?',
    answer: 'After any major site update — new pages, a redesign, switching hosts. Otherwise, once a quarter is enough to make sure nothing has slipped.',
  },
]

export const connectContent = {
  headline: 'Let\'s figure out what\'s next.',
  body: 'Whether you need a strategy for growth, a partner to sharpen what you already have, or just someone to think through a challenge with — I\'m up for the conversation.',
  ctaText: 'Schedule a call',
  ctaLink: 'https://cal.com/chris-hornak/30min',
}
