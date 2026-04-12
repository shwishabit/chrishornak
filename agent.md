# Chris Hornak — Personal Brand Redesign

## Project Summary
Redesigning chrishornak.com from a generic freelancer services page into a personal brand hub for a marketing strategist. Dark-first, content-forward, influenced by Seth Godin, GaryVee, and Chris Do. The site should feel like a platform — someone who gives so much value that hiring becomes obvious.

## Creative Director's Note
**Nail:** The site itself must be proof that Chris is a strategist, not a claim that he is one. Content and point-of-view front and center.
**Trap:** Falling back into a services brochure with a dark coat of paint. This is not "SEO + Content + Design" anymore.

## Brand Signature
Lowercase confidence with a single teal accent — a wordmark that trusts the work to explain itself. No tagline, no descriptor, no explanation. The brand lives in the content, not the logo.

## Opinionated Stance
Most marketing consultants sell tactics — SEO audits, content calendars, ad spend. That's commodity work. Real growth comes from strategy that compounds: building permission, earning attention, creating remarkable things people talk about. This stance changes the site structure: no services grid, no deliverables list. Instead, ideas and outcomes.

## Value Calibration
**High** — this is Chris's own brand, the thing everything else connects to. Worth getting right.

## Brand Identity

### Logo
- **Wordmark:** "chris hornak" in Sora 700, lowercase, teal dot on the i
- **Icon:** "ch" + teal dot — avatars, favicons, social
- **Reference:** `chrishornak/brand/logo-final-v2.html`

### Colors
- **Background (dark):** #0a0a0a
- **Text (dark):** #f0f0f0
- **Background (light):** #ffffff
- **Text (light):** #0a0a0a
- **Accent:** #2dd4a8 (teal)

### Typography
- **Headlines:** Sora 700
- **Body:** Inter 400
- **Accent/UI:** Inter 500

### Visual Direction
- Dark-first, editorial layout
- Generous whitespace (80px+)
- Asymmetric layouts, not centered-everything
- Minimal, content-forward
- Inspired by: Behance dark portfolio references, VaynerMedia, seths.blog

## Market Context
- Current site positions Chris as "freelancer who does SEO + content + design" — forgettable
- Competitors: every solo marketing consultant with the same three services
- White space: strategist-who-teaches positioning, content-first brand hub
- Chris runs Blog Hands and Swift Growth Marketing — multi-venture credibility
- Audience: business owners who need growth, not deliverables
- Three testimonials with real names from current site are reusable

## Redesign Belief Shift
**Old site:** "Chris is a capable freelancer who can do SEO and content."
**New site:** "Chris thinks differently about growth — and I want to learn how he'd think about my business."

## Influences & How They Shaped This Project

Chris named Seth Godin, Gary Vaynerchuk, and Chris Do as the thinkers he most aligns with. This drove every major decision:

- **Seth Godin:** Permission marketing, remarkability, generosity-first, smallest viable audience. This is why the site has an Ideas section front and center — it gives before it asks. No services grid. The site earns attention through content, not a pitch.
- **GaryVee:** Authenticity, no-BS directness, document don't create. This is why the copy voice is first-person, short, opinionated. No corporate padding. And why we dropped the tagline from the logo — like VaynerMedia, just the name. Let the work speak.
- **Chris Do:** Value-based positioning, design thinking, teach through content. This is why the positioning is "marketing strategist" not "freelancer who does SEO." Sell the thinking, not the deliverables. The site structure mirrors The Futur's approach — platform, not brochure.

**The throughline:** Strategist who teaches, not a freelancer who pitches. The site itself should be proof of strategic thinking — not a claim that Chris does strategic thinking.

**Copy voice rules:** Direct address ("you"), contractions mandatory, first-person, opinionated, short sentences. No hedges, no filler, no AI blacklist words. Say what others in marketing won't say.

**Key positioning decision:** Chris works with non-tech-savvy clients too (mom-and-pop businesses), so nothing should feel exclusionary or jargon-heavy. "Marketing strategist" was chosen because it's clear to everyone. We explicitly rejected "Growth Strategist" for this reason.

**What we decided NOT to do:**
- No services page — the Opinionated Stance rejects selling tactics
- No tagline on the logo — Seth, Gary, and Chris Do don't use them
- No trail dots on the logo — we explored 60+ concepts and simplified
- No descriptor text — "let my content speak for itself" (Chris's words)
- No light theme toggle in v1
- No blog archive in v1 — Ideas section with featured content only

## Site Structure

Single page: Navigation → Hero → Ideas → About → Work → Connect → Footer

This is a personal brand hub, NOT a services brochure or landing page. Content-forward.

## Copy

### Hero
**H1:** Most marketing is noise. I help businesses grow with strategy that compounds.
**Sub:** I'm Chris Hornak — marketing strategist helping businesses at every stage figure out what actually moves the needle. Whether you're getting online for the first time or rethinking everything, I bring the strategy.
**CTA:** Let's talk
**Secondary:** See the work → #work

### Ideas Section
**Header:** What I'm thinking about
*(Featured posts / content previews — the site gives before it asks)*

### About
**Header:** Strategy first. Everything else follows.
**Body:** Most businesses hire marketers to check boxes — run some ads, write some blogs, fix the SEO. And most of it doesn't work because nobody asked the hard question first: what's actually going to move this business forward?

That's what I do. I've built content companies, launched growth agencies, and helped businesses at every stage — from their first website to full-scale marketing operations. The principle is always the same: strategy before tactics.

For smaller projects, I work hands-on. For larger ones, I bring in the right people. Either way, you get someone who's thinking about your business — not just executing a checklist.

### Work Section
**Header:** What growth looks like
*(Metrics bar + testimonials — visual proof of track record)*

### Connect
**Header:** Let's figure out what's next.
**Body:** Whether you need a strategy for growth, a partner to get you online, or just someone to think through a challenge with — I'm up for the conversation.
**Primary CTA:** Schedule a call → Cal.com
**Secondary CTA:** Contact form (name, email, message)

## Build Brief
- **Pages:** Single page (hero → ideas → about → work → connect)
- **Key interaction:** The teal dot as a recurring motif — appears in the logo, in section accents, in hover states
- **Dependencies:** Google Fonts (Sora, Inter), Cal.com embed for CTA
- **Not building:** Services page, pricing, blog archive (v1), light theme toggle
- **Win condition:** Someone lands on this site and thinks "this person thinks differently" — not "this person does SEO"
- **Value-first:** The Ideas section gives genuine insight before any CTA appears
- **Testimonials:** Jeff Woodard (Executive Director), Meredith Smith (Marketing Manager), Kerry Veith (Director of Operations), David Horell (Benefits and Payroll Coordinator, SCI)

## Act 2 Progress
- [x] Configure `globals.css` with brand tokens (#0a0a0a, #f0f0f0, #2dd4a8, Sora, Inter)
- [x] Rewrite `lib/data.ts` with real copy
- [x] Replace template sections with personal brand hub structure
- [x] Build the logo component as SVG (dotless-ı + teal circle overlay)
- [x] Build all sections: Hero, About, Services, Work (logos + testimonials), Connect (Cal.com + contact form), Ventures, Footer
- [x] Wire up Cal.com link (cal.com/chris-hornak/30min)
- [x] Wire up contact form via Resend (server action in actions.ts)
- [x] Social sharing image template (`brand/og-image.html`) — needs Chris to screenshot at 1200x630 and save as `public/og-image.png`
- [x] Netlify preview build prepared (`out/` folder ready for drag-and-drop)
- [x] Logo rendering — switched from SVG text to PNG wordmark for consistent rendering
- [x] OG image: `public/images/og-image.png` — wired to openGraph + Twitter card metadata
- [x] Revert static export config after preview (restore server action, useActionState, remove `output: 'export'`)
- [x] Visual polish pass — Logo icon variant fixed, agent.md scheduler refs corrected, cursor/responsive verified
- [x] Favicon / app icons — teal dot (#2dd4a8) circle (favicon.ico, icon.png, apple-icon.png in src/app/)
- [x] Logo files replaced with Canva exports (PNG + SVG, dark + light variants)
- [x] Homepage ↔ audit tool copy alignment — unified "be found" thread across both pages
- [x] Audit tool categories reorganized: Search, AI, Social, Mobile, Structure, Security (6 checks each)
- [x] Audit tool scoring: percentage-based score overrides, mock data removed, real parsing only
- [x] Audit parser: 11 fairness fixes for SMB audience (robots.txt, image filtering, citability, etc.)
- [x] Methodology modal updated with new categories and "What this doesn't cover" lead-gen section
- [x] UX review pass: Services reframed to narrative, Findability Check CTA elevated, Ventures simplified, testimonials reattributed and trimmed to 4, headshot enlarged, Connect process steps reordered
- [x] Audit page: hero matches homepage scale, full-viewport layout, below-fold content spaced, category cards with hover, editorial pull quote, dual CTA at bottom
- [x] Category summaries bug fixed, "Run Audit" → "Check findability", input placeholder updated
- [x] Mobile: tab scroll affordance (fade gradient), category descriptions always visible
- [x] Created audit.php for InfinityFree production proxy
- [x] Created scripts/build-check.mjs (prevents build/dev cache corruption)

## Contact Form (working)
- **From:** `Chris Hornak <chris@chrishornak.com>` via Resend
- **To:** `chris@bloghands.com`
- **Anti-spam:** honeypot field + 2-second timing check
- **DNS:** SPF, DKIM (Resend auto-configured via GoDaddy), DMARC added manually
- **Static export reverted:** `output: 'export'` removed, server action restored, `force-static` removed from robots/sitemap

## Decisions Made (Act 2)
- **No Jumpkit references** — never launched, don't mention
- **No name-dropping** Seth Godin / Gary Vee / Chris Do — express the philosophy naturally, some visitors won't know them
- **"Strategy first" not "I don't sell deliverables"** — original phrasing risks alienating corporate/executive visitors
- **Broader positioning** — "Let's figure out what's next" not "Got a growth problem?" — Chris works with first-website clients too, not just growth-stage
- **Solo + team** — Chris works hands-on for small projects, brings in the right people for larger ones
- **Cal.com** is the scheduler — primary CTA. Contact form is secondary
- **Work section** — client logos (greyscaled, teal on hover) + 4 testimonials in 2-col grid (trimmed from 6 — Woodard, Smith, Veith, Horell)
- **Ideas section scrapped** — component and data deleted
- **About section** — two-column layout: left (headshot + copy + teal-dot timeline), right (4 stats stacked vertically with border)
- **Services reframed** — "How strategy plays out" narrative with teal dot markers, not a deliverables grid. Nav label: "Approach" (section id still `#services`)
- **Ventures simplified** — single paragraph with Blog Hands/Swift Growth as inline links, not 3 competing cards
- **Testimonials reattributed** — Swift-branded quotes rewritten to reference Chris directly
- **Custom cursor** is a deliberate design choice — keep it
- **Stats order** — largest to smallest: 500+ businesses, 20+ years, 12 web apps, 3 companies established
