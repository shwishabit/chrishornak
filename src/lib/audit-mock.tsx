import {
  Search,
  Globe,
  Code2,
  BotMessageSquare,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import type { AuditResult } from './audit-scoring'

export function generateMockAudit(url: string): AuditResult {
  return {
    url,
    categories: [
      {
        name: 'Search',
        icon: <Search className="h-4 w-4" />,
        items: [
          {
            label: 'Indexability',
            status: 'pass',
            value: 'Page is indexable',
            extracted: '<meta name="robots" content="index, follow" />',
          },
          {
            label: 'Page title',
            status: 'pass',
            value: '58 characters',
            extracted: '<title>Acme Corp — Professional Widgets for Modern Teams</title>',
          },
          {
            label: 'Page description',
            status: 'warn',
            value: '178 characters — may be cut off in search results',
            extracted:
              '<meta name="description" content="Acme Corp provides industry-leading widget solutions for modern teams. We help businesses of all sizes streamline their operations with cutting-edge technology and world-class support services." />',
            recommendation:
              'This is the short summary under your link in Google. Keep it under 160 characters so it doesn\'t get cut off.',
          },
          {
            label: 'Canonical URL',
            status: 'fail',
            value: 'Missing',
            recommendation:
              'Without a canonical tag, search engines might treat different URLs as duplicate pages. Add one to tell Google which version is the main one: <link rel="canonical" href="' + url + '" />',
          },
          {
            label: 'Crawl permissions',
            status: 'pass',
            value: 'robots.txt allows crawling',
            extracted: 'User-agent: *\nAllow: /',
          },
          {
            label: 'Sitemap',
            status: 'warn',
            value: 'Sitemap exists but isn\'t referenced in robots.txt',
            recommendation:
              'Your sitemap exists but crawlers might miss it. Add this line to your robots.txt: Sitemap: ' + url + '/sitemap.xml',
          },
        ],
      },
      {
        name: 'AI',
        icon: <BotMessageSquare className="h-4 w-4" />,
        items: [
          {
            label: 'Structured data',
            status: 'fail',
            value: 'None found',
            recommendation:
              'Structured data is like a cheat sheet for Google and AI tools. It tells them exactly what your business is, what you offer, and how to display your content in rich search results. Add JSON-LD schema markup.',
          },
          {
            label: 'Answerable content',
            status: 'fail',
            value: 'No Q&A patterns or FAQ schema found',
            recommendation:
              'AI tools like ChatGPT and Google\'s AI Overview pull answers directly from web pages. Structure some of your content as clear questions and answers so AI systems know what your page answers.',
          },
          {
            label: 'Trust signals',
            status: 'warn',
            value: 'Some credibility indicators, but could be stronger',
            extracted: 'Testimonials or reviews',
            recommendation:
              'AI and search engines look for signs that real people stand behind your business. Adding testimonials, team info, an about page, credentials, and schema markup helps them — and your visitors — trust you.',
          },
          {
            label: 'Citability',
            status: 'fail',
            value: 'No unique data or quotable insights found',
            recommendation:
              'AI tools cite pages that contain original data, unique insights, or quotable statements. Add your own stats, case study results, or expert quotes to make your content worth referencing.',
          },
          {
            label: 'Entity clarity',
            status: 'warn',
            value: 'Partially defined — missing some context',
            recommendation:
              'AI needs to know exactly what you are and where you operate. Clearly state your business type, service area, and specialties in plain language — not just in metadata.',
          },
          {
            label: 'Business description',
            status: 'warn',
            value: 'Partially clear — AI may struggle to summarize what you do',
            recommendation:
              'AI tools need to quickly understand what your business does and who it serves. Make sure your headline, opening content, meta description, and schema all clearly state what you offer.',
          },
        ],
      },
      {
        name: 'Social',
        icon: <Globe className="h-4 w-4" />,
        items: [
          {
            label: 'Share title',
            status: 'pass',
            value: 'Set',
            extracted: '<meta property="og:title" content="Acme Corp — Professional Widgets" />',
          },
          {
            label: 'Share description',
            status: 'pass',
            value: 'Set',
            extracted: '<meta property="og:description" content="Industry-leading widget solutions for modern teams." />',
          },
          {
            label: 'Share image',
            status: 'fail',
            value: 'Missing',
            recommendation:
              'When someone shares your link, there\'s no image to show. Links with images get significantly more clicks. Add a 1200×630px image as your og:image.',
          },
          {
            label: 'X (Twitter) card',
            status: 'warn',
            value: 'Not configured',
            recommendation:
              'Without a Twitter card tag, your links on X show up as plain text instead of a rich preview. Add: <meta name="twitter:card" content="summary_large_image" />',
          },
          {
            label: 'Social profiles',
            status: 'warn',
            value: '2 of 5 major platforms linked',
            extracted: 'Found: Facebook, LinkedIn\nMissing: X (Twitter), Instagram, YouTube',
            recommendation:
              'Linking to your social profiles helps search engines connect your brand across the web and builds trust with visitors.',
          },
        ],
      },
      {
        name: 'Mobile',
        icon: <Smartphone className="h-4 w-4" />,
        items: [
          {
            label: 'Viewport setup',
            status: 'pass',
            value: 'Configured correctly',
            extracted: '<meta name="viewport" content="width=device-width, initial-scale=1" />',
          },
          {
            label: 'Doctype',
            status: 'pass',
            value: 'Valid HTML5 doctype',
          },
          {
            label: 'Character encoding',
            status: 'pass',
            value: 'UTF-8 declared',
            extracted: '<meta charset="utf-8" />',
          },
          {
            label: 'Tap target sizing',
            status: 'warn',
            value: '3 small interactive elements detected',
            recommendation:
              'On mobile, buttons and links should be at least 44×44px so they\'re easy to tap. Some elements on your page may be too small for comfortable mobile use.',
          },
          {
            label: 'Text readability',
            status: 'pass',
            value: 'Base font size is 16px',
          },
          {
            label: 'Image file formats',
            status: 'warn',
            value: '4 images using older formats',
            score: 8 / 12,
            extracted: 'hero-bg.png, team-photo.png, banner.png, bg-pattern.png',
            recommendation:
              'Some images use older file formats (PNG/JPG) that load slower on mobile. Converting to WebP or AVIF typically cuts file size 25–35% with no visible quality loss.',
          },
        ],
      },
      {
        name: 'Structure',
        icon: <Code2 className="h-4 w-4" />,
        items: [
          {
            label: 'Main headline (H1)',
            status: 'pass',
            value: '1 found',
            extracted: 'Professional Widgets for Modern Teams',
          },
          {
            label: 'Heading structure',
            status: 'warn',
            value: '4 H2s found, but heading levels skip',
            extracted: 'H1 → H3 → H2 (skipped a level)',
            recommendation:
              'Headings should flow like an outline — H1, then H2, then H3. Skipping levels makes it harder for search engines to understand your content structure.',
          },
          {
            label: 'Image descriptions',
            status: 'warn',
            value: '7 of 12 images have descriptions (58%)',
            score: 7 / 12,
            extracted: 'Missing alt text on: hero-bg.png, team-photo.jpg, icon-3.png, banner.png, partner-logo.svg',
            recommendation:
              'Screen readers and search engines can\'t "see" images without text descriptions (alt text). Adding them helps accessibility and can bring in traffic from image searches.',
          },
          {
            label: 'Content depth',
            status: 'warn',
            value: '~320 words — could go deeper',
            recommendation:
              'Search engines and AI prefer pages with thorough, well-organized content. Expanding your key topics with more detail makes your page more likely to rank and get cited.',
          },
          {
            label: 'Internal links',
            status: 'pass',
            value: '18 links to your own pages',
          },
          {
            label: 'Link quality',
            status: 'warn',
            value: '2 links with empty or placeholder destinations',
            recommendation:
              'Some links on your page don\'t go anywhere useful (empty href or # placeholder). These can frustrate visitors and signal low quality to search engines.',
          },
        ],
      },
      {
        name: 'Security',
        icon: <ShieldCheck className="h-4 w-4" />,
        items: [
          {
            label: 'HTTPS',
            status: 'pass',
            value: 'Secure connection',
          },
          {
            label: 'Safe external links',
            status: 'pass',
            value: '6 external links — all secure',
          },
          {
            label: 'Form security',
            status: 'warn',
            value: '1 form submitting over HTTP',
            extracted: '<form action="http://acmecorp.com/subscribe">',
            recommendation:
              'Forms submitting over HTTP send data without encryption — anything visitors type could be intercepted. Change form actions to use HTTPS.',
          },
          {
            label: 'Password field exposure',
            status: 'pass',
            value: 'No password fields on page',
          },
          {
            label: 'Content security policy',
            status: 'fail',
            value: 'No CSP found',
            recommendation:
              'A Content Security Policy tells browsers which scripts and resources are allowed to run on your page. Without one, your site is more vulnerable to code injection. This is an advanced setting — ask your developer about it.',
          },
          {
            label: 'Privacy policy',
            status: 'fail',
            value: 'No privacy policy link found',
            recommendation:
              'A privacy policy is legally required in most regions if you collect any visitor data (contact forms, analytics, cookies). It also builds trust. Add a link in your footer.',
          },
        ],
      },
    ],
  }
}
