/* ── Plain-language descriptions for each findability check ────────────────
 * Keyed by the check's label (as emitted by audit-parser.ts). Used on the
 * benchmarks page so a reader understands what each issue means and why it
 * matters. One short line each. Missing label → no description rendered.
 * ─────────────────────────────────────────────────────────────────────── */

export const ISSUE_DESCRIPTIONS: Record<string, string> = {
  // Search
  'Indexability': 'Whether search engines are even allowed to list the page. If this is blocked, nothing else matters.',
  'Page title': 'The clickable headline shown in search results and browser tabs — the single most important on-page tag.',
  'Page description': "The summary under the title in search results. It doesn't rank you, but it wins or loses the click.",
  'Canonical URL': "Tells search engines which version of a page is the 'official' one, preventing duplicate-content confusion.",
  'Crawl permissions': 'Whether robots.txt accidentally blocks search engines from reading the page.',
  'Sitemap': 'A map of all pages that helps search engines find and index everything the site publishes.',
  'URL redirects': 'Whether the address forwards cleanly to one canonical version (http→https, www→non-www).',
  'Response time': 'How quickly the server returns the page. Slow responses frustrate visitors and dampen rankings.',
  'Meta refresh redirect': 'An outdated redirect method that hurts SEO and accessibility. Modern sites use server redirects.',
  'Page rendering': "Whether the page's content is in the HTML, versus requiring JavaScript that some crawlers won't run.",

  // AI
  'Structured data': 'Schema markup that tells search engines and AI exactly what the business is, where, and what it offers.',
  'Answerable content': 'FAQ or Q&A-style content that AI tools can lift and cite when someone asks a related question.',
  'Trust signals': "About pages, testimonials, credentials — the proof that this is a real, credible business.",
  'Citability': 'Original data, stats, or unique insight that gives AI a concrete reason to reference this site specifically.',
  'Entity clarity': 'Clear, consistent signals about who the business is, so AI can connect the name, brand, and offerings.',
  'Business description': 'A plain statement of what the business does and who it serves, near the top of the page.',
  'AI crawler access': 'Whether AI crawlers (GPTBot, ClaudeBot, etc.) are allowed to read the site so they can recommend it.',
  'AI site summary (llms.txt)': 'An emerging, optional /llms.txt file that briefs AI crawlers on the site — a README for AI.',

  // Social
  'Share title': 'The headline shown when the link is shared on Facebook, LinkedIn, or in a text message.',
  'Share description': 'The blurb under the title in a social or link preview.',
  'Share image': 'The preview image shown when the link is shared. Links with images get far more clicks.',
  'Share image reachability': 'Whether that preview image actually loads for social scrapers — redirects or errors can break it.',
  'Open Graph type': 'A tag declaring what kind of content the page is (website, article) for richer link previews.',
  'X (Twitter) card': 'Twitter/X-specific tags that control how the link looks when posted there.',
  'Social profiles': "Links to the brand's social accounts, which help search engines connect the brand across the web.",

  // Mobile
  'Viewport setup': 'The tag that makes a site scale correctly on phones. Without it, mobile users get a zoomed-out desktop layout.',
  'Doctype': 'A one-line declaration that tells browsers to render in modern standards mode.',
  'Character encoding': 'Declares the text encoding (UTF-8) so symbols and accented characters display correctly.',
  'Tap target sizing': 'Whether buttons and links are big enough, and spaced enough, to tap accurately on a phone.',
  'Text readability': 'Whether body text is large enough to read on a phone without zooming.',
  'Image file formats': 'Whether images use modern formats (WebP/AVIF) that load faster than older JPG/PNG.',

  // Structure
  'Main headline (H1)': 'The single top-level headline that tells visitors and search engines what the page is about.',
  'Heading structure': 'A logical heading hierarchy (H1 → H2 → H3) that organizes content for readers and crawlers.',
  'Image descriptions': 'Alt text on images — required for screen readers and a ranking signal for image search.',
  'Content depth': 'Whether the page has enough substantive text for search engines and AI to understand and rank it.',
  'Internal links': 'Links between the site’s own pages, which spread ranking power and help visitors navigate.',
  'Internal link nofollow': "Whether internal links are wrongly marked 'nofollow,' which blocks ranking power from flowing.",
  'Hidden text': 'Text hidden from users but shown to crawlers — an outdated tactic that can trigger penalties.',

  // Accessibility
  'Language attribute': 'The lang tag that tells screen readers and search engines what language the page is in.',
  'Page landmarks': 'Semantic regions (header, nav, main, footer) that let screen-reader users jump around the page.',
  'Form labels': 'Labels tied to form fields so screen-reader users know what each input is for.',
  'Focus indicators': 'Visible outlines showing keyboard users where they are on the page.',
  'Skip navigation': "A 'skip to content' link that lets keyboard users bypass the menu.",
  'Link purpose': "Whether links make sense out of context, avoiding bare 'click here' or 'read more.'",

  // Security
  'HTTPS': "Whether the site uses a secure (https) connection. Browsers flag non-secure sites as 'Not Secure.'",
  'Mixed content': 'Secure pages loading insecure (http) resources, which browsers block and flag as unsafe.',
  'Safe external links': "Whether links opening new tabs include rel='noopener' (modern browsers now apply this automatically).",
  'Form security': "Whether forms submit over a secure connection so visitors' data isn't exposed.",
  'Password field exposure': 'Whether any password field submits insecurely — a serious data-exposure risk.',
  'Content security policy': 'An optional HTTP header that limits what can run on the page, reducing cross-site-scripting risk.',
  'Privacy policy': 'A linked privacy policy — expected by visitors, app stores, and some regulations.',
  'Link quality': 'Whether links are valid and not pointing to broken or suspicious destinations.',
}
