// src/lib/guides.ts — The Signal guide metadata

export interface GuideFaq {
  question: string
  answer: string
}

export interface Guide {
  number: string
  headline: string
  teaser: string
  slug: string
  role: string
  metaTitle: string
  metaDescription: string
  keywords: string[]
  published: boolean
  datePublished: string
  dateModified: string
  faq: GuideFaq[]
}

export const guides: Guide[] = [
  {
    number: '01',
    headline: 'Google Isn\'t the Only Place Your Customers Are Looking',
    teaser: 'You\'ve been optimizing for one search engine. Your customers are searching on six platforms. This guide opens the aperture on what findability actually means.',
    slug: 'findability',
    role: 'Opens the aperture',
    metaTitle: 'Google Isn\'t the Only Place Your Customers Are Looking',
    metaDescription: 'Your customers search on 6+ platforms — not just Google. This guide reframes findability and shows where your business is invisible.',
    keywords: ['findability', 'online visibility', 'local SEO', 'AI search', 'get found online', 'digital presence'],
    published: true,
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    faq: [
      {
        question: 'What is findability?',
        answer: 'Findability is whether a potential customer — at any moment, on any platform, through any kind of search — can discover that your business exists and is worth their time. It combines six technical signals (search visibility, AI readiness, social sharing, mobile experience, site structure, and security) with the strategic clarity that turns visibility into customers.',
      },
      {
        question: 'What are the six signals the Findability Check measures?',
        answer: 'The Findability Check scores six technical signals: Search Visibility (can search engines find and rank you), AI Readiness (can AI assistants cite and recommend you), Social Sharing (do your links look credible when shared), Mobile Experience (does your site work on phones), Site Structure (can machines and humans navigate your site), and Security (does your site signal trust at a technical level).',
      },
      {
        question: 'Why is ranking on Google not enough anymore?',
        answer: 'Customers now search across multiple platforms — ChatGPT, YouTube, Instagram, Google Maps, Reddit, and traditional search engines. A business that only ranks on Google is invisible everywhere else. Strong findability means your signal is consistent across every platform where customers are looking.',
      },
      {
        question: 'What is the difference between the technical signals and the strategic guides?',
        answer: 'The six technical signals are the foundation — they tell you whether search engines, AI, and visitors can access your site. The six strategic guides explain why those signals are weak and what to do about it. A perfect technical score with weak strategy still means no customers. Both layers matter.',
      },
      {
        question: 'Where should I start if I don\'t know how findable my business is?',
        answer: 'Start with the Findability Check — it scores all six technical signals in under a minute, free, no signup. Look at the red items first. Then read the guide that matches your biggest gap. If you\'d rather have someone evaluate the full picture, that\'s what the conversation is for.',
      },
    ],
  },
  {
    number: '02',
    headline: 'You Built a Website. Now It\'s Sitting in the Dark.',
    teaser: 'Your site exists. But search engines can\'t read it, AI can\'t cite it, and visitors can\'t find it. Here\'s what your agency never set up — and why it matters.',
    slug: 'search-visibility',
    role: 'Diagnoses the problem',
    metaTitle: 'You Built a Website. Now It\'s Sitting in the Dark.',
    metaDescription: 'Your website exists but search engines can\'t read it and AI can\'t cite it. Here\'s what your agency never set up.',
    keywords: ['search visibility', 'website SEO', 'technical SEO', 'site indexing', 'search engine optimization'],
    published: true,
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    faq: [
      {
        question: 'What does it mean for a website to be "sitting in the dark"?',
        answer: 'It means your website exists on the internet but the infrastructure that makes it visible to search engines, AI assistants, and social platforms was never set up. The site works for visitors who already have your URL, but it\'s invisible to anyone searching for what you offer. It\'s not broken — it was never turned on.',
      },
      {
        question: 'What are the most common things web agencies don\'t set up?',
        answer: 'The six most common gaps are: unique title tags and meta descriptions for every page, a sitemap submitted to Google Search Console, a properly configured robots.txt file, structured data (schema markup) that tells search engines what your business is, a clean heading hierarchy (H1, H2, H3), and basic page speed optimizations like image compression and lazy loading.',
      },
      {
        question: 'How do I know if search engines can find my website?',
        answer: 'Run the Findability Check — it tests for title tags, sitemap, structured data, page speed, and more in under a minute. You can also search "site:yourdomain.com" on Google. If your pages don\'t appear, search engines either haven\'t found them or can\'t index them.',
      },
      {
        question: 'What is structured data and why does it matter?',
        answer: 'Structured data is code added to your site that tells search engines and AI exactly what your business is — your name, location, services, reviews, and more. Without it, search engines see your site as generic text. With it, you can appear in rich search results and AI recommendations. Most small business websites have zero structured data.',
      },
      {
        question: 'Can I fix search visibility issues myself?',
        answer: 'Some fixes are straightforward if you\'re comfortable editing your website — adding meta descriptions, submitting a sitemap, compressing images. Others, like adding structured data or fixing robots.txt issues, are more technical. The Findability Check will show you exactly what\'s missing, so you can decide what to tackle yourself and what needs a professional.',
      },
    ],
  },
  {
    number: '03',
    headline: 'AI Is Already Recommending Your Competitors.',
    teaser: 'When someone asks ChatGPT for a recommendation in your space, what comes back? If it isn\'t you, there are specific signals your site is missing.',
    slug: 'ai-readiness',
    role: 'Creates urgency',
    metaTitle: 'AI Is Already Recommending Your Competitors.',
    metaDescription: 'ChatGPT and AI assistants are recommending businesses in your space. If they\'re not recommending you, here\'s what to fix.',
    keywords: ['AI readiness', 'ChatGPT recommendations', 'AI search optimization', 'AI visibility', 'generative engine optimization'],
    published: true,
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    faq: [
      {
        question: 'How do AI assistants like ChatGPT decide which businesses to recommend?',
        answer: 'AI assistants synthesize information from structured data, reviews, content clarity, entity recognition, and cross-platform consistency. They recommend businesses they can clearly identify and describe — not necessarily the best business, but the most clearly communicated one. If your website doesn\'t give AI structured, specific information to work with, it skips you.',
      },
      {
        question: 'What is AI readiness for a business website?',
        answer: 'AI readiness means your website communicates clearly enough — in both human-readable and machine-readable formats — for AI assistants to understand what your business does, who it serves, and why someone should choose you. This includes structured data (schema markup), clear copy, consistent entity presence across platforms, and content that directly answers the questions people ask AI.',
      },
      {
        question: 'What is the most important thing I can do to show up in AI recommendations?',
        answer: 'Add structured data (schema markup) to your website — specifically LocalBusiness or Organization schema with your name, address, services, and review information. This is the single highest-impact change because it gives AI explicit, machine-readable facts about your business instead of forcing it to guess from unstructured text.',
      },
      {
        question: 'Is AI search optimization the same as SEO?',
        answer: 'Not exactly. Traditional SEO focuses on ranking pages in search results. AI optimization focuses on making your business clearly understandable as an entity that AI can confidently recommend. There\'s significant overlap — structured data, clear content, fast sites — but AI readiness also requires consistent entity presence across multiple platforms and content that directly answers conversational questions.',
      },
      {
        question: 'How can I check if AI is recommending my business?',
        answer: 'Start by asking ChatGPT, Perplexity, and Google\'s AI Overview to recommend a business in your category and city. See if you appear. Then run the Findability Check to score your AI readiness signals — structured data, content clarity, and entity recognition. The gap between your current state and your competitors tells you how much ground you need to cover.',
      },
    ],
  },
  {
    number: '04',
    headline: 'Your Reputation Is Strong. Your Website Doesn\'t Show It.',
    teaser: 'Customers love you. Referrals keep coming. But your website tells a different story. The gap between your reputation and your online presence is costing you.',
    slug: 'website-trust',
    role: 'Shows the gap',
    metaTitle: 'Your Reputation Is Strong. Your Website Doesn\'t Show It.',
    metaDescription: 'Great reputation, weak website. The gap between what customers say and what your site shows is costing you business.',
    keywords: ['website credibility', 'online trust', 'website trust signals', 'reputation management', 'business website'],
    published: true,
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    faq: [
      {
        question: 'What is the trust gap?',
        answer: 'The trust gap is the distance between what customers say about your business and what your website communicates. If customers rave about you but your site looks dated, has vague copy, and no testimonials — that disconnect is costing you customers who were already sold on hiring you.',
      },
      {
        question: 'How quickly do visitors judge a website\'s credibility?',
        answer: 'Research shows visitors form a judgment about a website\'s credibility within 50 milliseconds — before they read a single word. Design, layout, and visual quality are the first trust signals. If your site looks dated or unprofessional, visitors leave regardless of how good your services are.',
      },
      {
        question: 'What are the most important trust signals on a business website?',
        answer: 'The most important trust signals are: specific testimonials with real names and outcomes, professional visual design, clear positioning (what you do, who for, why you), proof of work (case studies, client logos, metrics), technical trust (HTTPS, fast loading, no security warnings), and consistent identity across all platforms.',
      },
      {
        question: 'What is the referral test for a website?',
        answer: 'Send your website URL to three people who don\'t know your business. Ask them what you do, who you serve, and whether they\'d hire you based on the site alone. Their answers reveal your trust gap — the difference between what you think your site says and what strangers actually experience.',
      },
      {
        question: 'Do I need a full redesign to fix my trust gap?',
        answer: 'Not always. The highest-leverage fixes are often targeted: add 3-5 real testimonials with names and specific results, sharpen your homepage headline to pass the five-second test, add client logos or proof of work, and fix technical trust issues like HTTPS and page speed. A full redesign helps, but these changes close most of the gap.',
      },
    ],
  },
  {
    number: '05',
    headline: 'Every Post You Publish Is Competing With Itself.',
    teaser: 'You\'re creating content consistently — and it\'s all fighting for the same keywords, the same attention, the same rankings. More isn\'t better. Structure is.',
    slug: 'content-structure',
    role: 'Reframes the effort',
    metaTitle: 'Every Post You Publish Is Competing With Itself.',
    metaDescription: 'Your blog posts are fighting each other for rankings. More content isn\'t the answer — better structure is.',
    keywords: ['content strategy', 'content cannibalization', 'blog structure', 'content architecture', 'SEO content'],
    published: true,
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    faq: [
      {
        question: 'What is content cannibalization?',
        answer: 'Content cannibalization happens when multiple pages on your site target the same topic or keyword. Instead of one strong page ranking well, they split the signal and compete with each other — resulting in all of them ranking poorly or not at all. It\'s one of the most common and invisible problems on business blogs.',
      },
      {
        question: 'How do I know if my content is cannibalizing itself?',
        answer: 'Do a content audit: export every blog URL, map each to its target keyword, and sort by keyword. If you find multiple posts targeting the same term — even with slightly different angles — that\'s cannibalization. You can also search "site:yourdomain.com [keyword]" on Google to see how many of your pages compete for the same query.',
      },
      {
        question: 'What is hub-and-spoke content architecture?',
        answer: 'Hub-and-spoke is a content structure where one comprehensive pillar page covers a core topic broadly, and multiple spoke articles go deep on specific subtopics. The spokes link to the pillar, the pillar links to the spokes, and related spokes link to each other. This tells search engines you have thorough expertise on the topic, which builds topical authority.',
      },
      {
        question: 'Should I delete old blog posts that aren\'t getting traffic?',
        answer: 'It depends. If a post targets the same keyword as another post, consolidate them — merge the best insights into one page and redirect the old URL. If a post has no strategic value and no traffic, deleting or redirecting it can actually improve your domain authority by removing dilutive content. Dead content isn\'t neutral — it drags down your overall authority.',
      },
      {
        question: 'How many blog posts does a small business actually need?',
        answer: 'There\'s no magic number, but structure matters more than volume. A site with 40 well-organized posts in a clear hub-and-spoke structure will outperform a site with 200 disconnected posts competing with each other. Focus on covering your 3-5 core topics thoroughly rather than publishing as much as possible.',
      },
    ],
  },
  {
    number: '06',
    headline: 'You\'re Doing All the Right Things in the Wrong Order.',
    teaser: 'Ads before strategy. Content before positioning. A new website before knowing what it should say. This guide names the root cause — and gives you the sequence.',
    slug: 'strategy-first',
    role: 'Names the root cause',
    metaTitle: 'You\'re Doing All the Right Things in the Wrong Order.',
    metaDescription: 'Ads before strategy. Content before positioning. This guide names the root cause most businesses miss — and gives you the right sequence.',
    keywords: ['marketing strategy', 'marketing order of operations', 'strategy before tactics', 'marketing prioritization'],
    published: true,
    datePublished: '2026-04-06',
    dateModified: '2026-04-06',
    faq: [
      {
        question: 'What is the right order for marketing?',
        answer: 'The right sequence is: Positioning (who you\'re for and why), Messaging (the story your brand tells), Foundation (website, technical infrastructure, analytics), Content (proving expertise and earning attention), Distribution (ads, social, email, partnerships), and Optimization (measure, learn, tighten). Each step depends on the one before it.',
      },
      {
        question: 'Why do most businesses do marketing in the wrong order?',
        answer: 'Because tactics are visible and strategy is invisible. Running ads, posting on social media, and publishing blog posts feel like progress. Defining positioning and writing a messaging framework feels like stalling. But tactics without strategy underneath them burn budget without compounding — and most businesses default to what feels productive.',
      },
      {
        question: 'How do I know if my marketing is out of order?',
        answer: 'Common symptoms: your website was built before your positioning was clear, you\'re running ads but can\'t explain your conversion rate, you have a content calendar but no content strategy, you\'ve hired multiple agencies that don\'t coordinate, and everything feels busy but nothing compounds. If three or more of these sound familiar, you have a sequence problem.',
      },
      {
        question: 'Do I need to start over if I\'ve been doing things in the wrong order?',
        answer: 'No. You can retrofit the sequence without scrapping everything. Define your positioning now, rewrite your messaging to match, update your website to express it, restructure your content around it, then check whether your ads and distribution align. Most of what you\'ve already built is usable — it just needs to be realigned around a clear strategic center.',
      },
      {
        question: 'What is the most important first step in marketing strategy?',
        answer: 'Positioning. One sentence: "We are [what] for [who], and we\'re different because [why]." If you can\'t fill those blanks with something specific, that\'s your first problem. Everything else — messaging, website, content, ads — is built on this foundation. Vague positioning creates vague everything.',
      },
    ],
  },
]

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug)
}

export function getAdjacentGuides(slug: string): { prev: Guide | null; next: Guide | null } {
  const index = guides.findIndex((g) => g.slug === slug)
  return {
    prev: index > 0 ? guides[index - 1] : null,
    next: index < guides.length - 1 ? guides[index + 1] : null,
  }
}

export function getPublishedGuides(): Guide[] {
  return guides.filter((g) => g.published)
}
