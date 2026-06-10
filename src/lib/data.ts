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
  { label: 'Be The Signal', href: '/signal' },
  { label: 'Findability Check', href: '/audit' },
]

export const heroContent = {
  headline: 'Your next customer is looking for you.',
  headlineAccent: 'Let\'s make sure you get found.',
  subheadline: 'I\'m Chris Hornak — marketing strategist for businesses that need to get found, stay found, and turn that visibility into results. I bring the strategy that makes everything else work.',
  ctaText: 'Let\'s talk',
  ctaLink: 'https://cal.com/chris-hornak/30min',
}

export const aboutContent = {
  headline: 'Strategy first. Everything else follows.',
  body: [
    'You don\'t have a marketing problem. You have a strategy problem. Most businesses hire marketers to check boxes — run some ads, write some blogs, fix the SEO. And most of it doesn\'t work because nobody asked the hard question first: what\'s actually going to move this business forward?',
    'That\'s what I do. I\'ve built content companies, launched growth agencies, and helped businesses at every stage — from their first website to full-scale marketing operations. The principle is always the same: strategy before tactics.',
    'For smaller projects, I work hands-on. For larger ones, I bring in the right people. Either way, you get someone who\'s thinking about your business — not just executing a checklist.',
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
    image: '/images/work/speranza.webp',
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
    image: '/images/work/swift-growth.webp',
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
    answer: 'It starts with a conversation. I diagnose what\'s working and what isn\'t, build a strategy, then either execute hands-on or bring in the right team. I stay involved either way.',
  },
  {
    question: 'Do you do the work yourself or outsource it?',
    answer: 'Both. For smaller projects I work hands-on. For larger ones I bring in specialists through Blog Hands and Swift Growth Marketing — companies I built specifically for this. You always work with me directly on strategy.',
  },
  {
    question: 'What if I just need a website?',
    answer: 'I can do that. But I\'ll also ask why — because a website without strategy behind it is just a brochure. Even a simple build benefits from thinking through who you\'re trying to reach and what you want them to do.',
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
