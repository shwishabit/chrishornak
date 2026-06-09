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

---

## 📍 Session State (updated 2026-06-08 cont. · audit "couldn't reach" false-positive — fast-fail retry on the page fetch, site `aa54d56` / parent `f74abc7`)

**Last worked on (2026-06-08 cont.):**
The audit reported "We couldn't reach f0rmless.com" for a site that was actually online (apex `308 → www`, www `200` in <1s, even with the exact `SiteCheck/1.0` UA). Traced it to `safeFetch` returning null on the main page fetch — a transient Vercel-edge blip (datacenter-IP request challenged/reset while browsers are served cleanly). The live audit reproduced clean, so it had self-healed. Added a scoped retry: `fetchPageWithRetry()` retries the page fetch **once, only on a fast failure** (`<2s` = transient throw, not the 8s timeout — no budget to retry a real timeout, and it wouldn't help). Retry uses a shorter 4s timeout + 250ms backoff so worst case stays under Vercel's ~10s function limit. Aux fetches (robots/sitemap/llms) stay single-shot.

**Files touched:**
- `site/src/app/api/audit/route.ts` — `safeFetch` gains an optional `timeoutMs` param; new `fetchPageWithRetry()` helper (fast-fail-guarded single retry); page fetch at the `Promise.all` switched to use it. Aux fetches unchanged.

**Where we are:** 🟢 Shipped. tsc 0 / build 0 (16 routes) / live audit re-verified clean post-deploy. Site submodule pushed to `shwishabit/chrishornak` (`aa54d56`); parent pointer bumped (`f74abc7`, no remote — local hygiene).

**Next action:**
None required. Optional: if "couldn't reach" false-positives recur on sites that ARE up, consider a 2nd-opinion fetch from a non-Vercel egress, or surface a softer "temporarily unreachable, retry" state distinct from the hard-down copy.

**Unsaved decisions:** none — committed + pushed + verified.

**Gotchas / Errors encountered:**
- Parent repo `Projects/chrishornak` has **no git remote** — Vercel deploys from the `site/` submodule's own GitHub repo. The parent pointer bump is local-only bookkeeping. (Also: parent tree carries pre-existing uncommitted `agent.md`/`CHANGELOG.md`/`backlog.md` + untracked `clarity-cover.*` from a prior session — left untouched, not mine.)

**SWOT (session retrospective):**
- **Strengths** — assessed before touching code (DNS + HTTP + exact-UA + live-audit reproduction proved the site was up and the tool's fetch was the variable); the retry was designed around the real failure mode (fast transient vs slow timeout) instead of a naive doubling that would blow the 10s budget; verified tsc+build before push.
- **Weaknesses** — the retry's benefit can't be directly observed (happy path is unchanged); confidence rests on logic + no-regression, not a reproduced blip-then-recovery.
- **Opportunities** — a "soft unreachable" state (retry-suggested) vs the current hard-down copy would read better for transient cases.
- **Threats** — Vercel-to-Vercel fetch flakiness is environmental and could recur; the retry masks the common case but a persistent datacenter-IP block would still (correctly) surface as unreachable.

---

## 📍 Session State (updated 2026-06-08 · Findability Benchmark feature SHIPPED + 4-round scoring recalibration — 193-site dataset, HEAD `e4f9da0`)

**Last worked on (2026-06-08):**
Built the Findability Benchmark end-to-end: every audit now feeds an aggregate dataset, the result page shows a per-site percentile + comparison vs the average, and a public editorial research page lives at `/audit/benchmarks`. Seeded **193 real small business sites** and ran FOUR data-driven calibration rounds that materially fixed the scoring — it was too lenient (avg 80→75, median 83→78, min 46→35, real bottom tail now; ~26% score <70 vs ~1% before).

**Files touched (all live on origin/main, HEAD `e4f9da0`, 12 commits `88e2438`→`e4f9da0`):**
- `site/supabase/migrations/0001_audit_runs.sql` + `0002_benchmark_rank_avg.sql` (NEW) — table + RLS insert-only + security-definer RPCs (`benchmark_stats`/`benchmark_top_issues`/`benchmark_rank`). Applied to the **Blog Hands Production** Supabase project (see Hosting).
- `site/src/lib/{supabase,audit-stats,benchmark-config,issue-descriptions}.ts` (NEW)
- `site/src/app/api/audit/record/route.ts` (NEW) — non-blocking capture; returns n/avg/median/percentile
- `site/src/components/sections/{BenchmarkBadge,TopIssuesList,DistributionChart}.tsx` (NEW)
- `site/src/app/audit/benchmarks/page.tsx` (NEW) — editorial research page; scores 100 on the rubric; interactive hover/tap bar graph
- `site/src/components/sections/AuditTool.tsx` — capture wiring, benchmark badge + CTA comparison, gap-focused messaging, methodology weights
- `site/src/lib/audit-scoring.ts` — **warn credit 0.5→0.3**; **category weights rebalanced** (AI 25→27, Structure 20→22, Accessibility 10→12, Mobile 10→7, Security 10→7)
- `site/src/lib/audit-parser.ts` — calibration fixes (see CHANGELOG 2026-06-08)
- `site/src/app/privacy/page.tsx` (data-storage disclosure), `sitemap.ts` (+`/audit/benchmarks`), `layout.tsx` (theme-color)
- `site/scripts/{seed-benchmarks,seed-benchmarks-bulk,seed-benchmarks-local}.ts` (NEW) — the 3 seed sources

**Where we are:** 🟢 LIVE + verified on prod. 193 real businesses (avg 75, median 78, min 35, max 94). Percentile active (n≥100). Benchmark page reads the live DB uncached → updates on every new audit.

**Next action:**
1. Audit real sites on the live tool to feel the stricter scoring + the "you beat X%" percentile.
2. (Optional further calibration) "Answerable content" still warns on 85% (kept scored — FAQs are universally achievable) + CSP 72%; revisit if users say they're noise.

**Unsaved decisions:** none — everything committed + pushed + live-verified.

**Gotchas / Errors encountered:**
- **Supabase free-project limit (2/account) hit** → couldn't create a dedicated chrishornak project, so `audit_runs` + RPCs live inside the **Blog Hands Production** Supabase project (`avsokercllnaiifoibwj`), isolated (RLS insert-only, never touches Blog Hands tables). Reversible.
- **VisitPittsburgh directory is JS-rendered (unscrapeable); the Enigma directory (`enigma.com/directory/<st>/<city>/`) is STATIC** — yielded ~140 ordinary SMBs across WV/OH/PA/KY (the realistic-sample source).
- **Distribution bars collapsed to min height** — `height: %` on an auto-height flex parent resolves to 0; fixed with pixel heights off the tallest bar.
- **Vercel env (`SUPABASE_URL`/`SUPABASE_ANON_KEY`) lives under a Vercel team Chris owns, not the shwishabit CLI scope** — Chris added them in the dashboard + redeployed (anon key is publishable, non-secret).

**Process retrospection:**
- **The corpus is a calibration radar** — any check firing on >75% of real sites is either a universal truth or an over-tuned check. Surfaced + fixed 6 real "our-end" scoring bugs this session. Codified as `feedback_benchmark_calibration_radar.md`.
- **Scoring-compression lesson:** a weighted average over mostly-passing fundamentals + half-credit warnings clusters everyone ~80. Restore signal by making warnings cost more + weighting toward high-variance categories, not platform defaults (Mobile/Security near-ceiling).

**SWOT:**
- **Strengths** — full feature in one session (DB→capture→UI→editorial page→193-site dataset); each calibration round verified against the live dataset before locking; every "our-end" claim verified against parser source before asserting; findability self-check caught the new page at 83 and drove it to 100.
- **Weaknesses** — reseeded the corpus ~6× (~12 min each) as calibration evolved; could have batched scoring changes into fewer reseeds. First seed (notable independents) skewed avg high before the Enigma local-SMB correction.
- **Opportunities** — the benchmark is original research → a "State of Small Business Findability" content/LinkedIn asset; record endpoint trusts client scores (server-side re-scoring would harden it); benchmarks page recomputes per request (light caching at scale).
- **Threats** — Answerable content (85%) + CSP (72%) still high (next calibration candidates); record-endpoint spoofable; `audit_runs` lives in the flagship Blog Hands prod DB (low-risk, but coupled).

---

## 📍 Session State (updated 2026-06-05 · structured-data findability fixes — 89→~99 on the rubric, 1 commit PUSHED)

**Last worked on (2026-06-05):**
Ran the `findability-auditor` against the live site (scored **89/100**, 6 flagged). After verifying each against the actual source, **3 were real wins, 2 were false positives, 1 a UX judgment call left alone.** Shipped the 3 (`00a4469` on `shwishabit/chrishornak` main, Vercel auto-deployed, live-verified):
1. **Raw email removed from Person/ContactPoint JSON-LD** ([layout.tsx](site/src/app/layout.tsx)) — was leaking `chris@chrishornak.com` into every page's source HTML; the `/#connect` URL carries the contact path. Enforces [[feedback-no-email-addresses-on-websites]].
2. **`Article.image` added** to all 6 guide schemas ([signal/[slug]/page.tsx](site/src/app/signal/[slug]/page.tsx)) → the existing per-guide dynamic OG card; required for Article rich-result eligibility.
3. **`Article.publisher` Person → Organization + `ImageObject` logo** (same file, `wordmark-dark.png`) per Google article-enrichment requirements.

**Skipped, with reasons (don't re-flag):**
- **`/signal` OG image** — false positive. Live HTML already emits `og:image → /signal/opengraph-image` via Next's file-based `opengraph-image.tsx`; adding explicit metadata would duplicate the tag.
- **Audit meta description (167 chars)** — the site's *own* tool grades descriptions 160–220 sliding, so 167 already scores; trimming wouldn't lift it.
- **Reduced-motion blanket disable** ([globals.css](site/src/styles/globals.css)) — passes the rubric; the conservative default is right for the audience (and Chris's ADHD). Left intentionally. If ever scoped, document as an explicit exception.

**Where we are:** 🟢 LIVE + verified. Guide pages emit `Article.image` + `Organization` publisher; home has no raw email (both confirmed in live HTML). tsc 0 / build 0.

**Next action (ordered):**
1. **Run chrishornak.com/audit on itself** post-deploy to confirm the score moved (also the standing backlog "Now" item).
2. **Google Rich Results Test** on a guide URL — confirm Article validates with the new `image` + Organization publisher.
3. Manual nits flagged, not chased: verify **HSTS** header on prod (`curl -sI chrishornak.com | grep -i strict`; add to `next.config.ts` header rule if absent); **mobile-menu ARIA** (`role="menu"` with `<a>` children wants `role="menuitem"` — possible axe violation).

**Unsaved decisions:** none — all 3 fixes committed + pushed + live-verified.

**Gotchas / Errors encountered:**
- **`site/` is a nested git repo** (remote `shwishabit/chrishornak`); the parent `Projects/chrishornak` has no `origin` and tracks `site` as a dirty submodule pointer. Commit + push from inside `site/`, not the parent.
- Auditor's `email`-key grep on rendered HTML initially read as "still 1 present" — it was the contact form's `<input type="email">` field, not a raw address. Confirmed the actual address + `mailto:` are gone.

**Process retrospection:**
- **Verify auditor findings against source before acting** — 2 of 6 were false positives that build/live HTML inspection caught (Next file-based OG, the site's own 160–220 description band). Relaying an audit verbatim would have shipped a duplicate OG tag and a pointless description trim.

---

## 📍 Session State (updated 2026-05-26 · /learn/vibe-coding + /principles SHIPPED with sidebar, diagrams, video callouts, copy-paste prompts)

**Last worked on:**
Built two new noindex routes on chrishornak.com (`/learn/vibe-coding` + `/learn/vibe-coding/principles`) as the companion guide for the new `vibe-coding-starter` repo. Replaced the standard chrishornak `<Navigation />` on these pages with a slim `VibeCodingTopBar` ("← chrishornak.com · Vibe Coding") so the in-guide TOC takes nav priority. Built a sticky docs-style left sidebar (`VibeCodingSidebar` — client component, IntersectionObserver-based active-section highlighting) + mobile sticky `<details>` collapsible TOC. Wired 3 Gemini-generated diagrams (`ecosystem.png`, `session-flow.png`, `rules.png`) + 6 video/doc callouts with visual distinction (video = teal play triangle; doc = muted document icon) + durations. Built `CopyablePrompt` client component (clipboard API + wrap-on-overflow) and seeded copy-paste prompts throughout the guide — clone, Claude Code install/login, setup-workspace, build-with-grill, deploy. Restructured the tutorial flow: removed the "Your first conversation" section and moved its prompt to the end of "Pick your first project" (the setup-workspace Q&A captures their project choice, so it should fire AFTER they pick). Updated `robots.ts` to add `/learn/vibe-coding` to disallow + new explicit AI-crawler rules (CCBot, GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, Google-Extended, PerplexityBot, Bytespider, cohere-ai, Amazonbot, Applebot-Extended).

**Files touched:**
- `src/app/learn/vibe-coding/layout.tsx` — new, noindex metadata.
- `src/app/learn/vibe-coding/page.tsx` — new main guide page (Hero → Tracks → Free Setup → Recommended Setup → Clone → Pick Your Project → Ship It → Domain → Stack).
- `src/app/learn/vibe-coding/principles/page.tsx` — new, 10 principles + "Working with your AI" section (Karpathy filter, Caveman, Fresh chats, Approval gates).
- `src/components/sections/VibeCodingTopBar.tsx` — new, replaces `<Navigation />` on the /learn pages.
- `src/components/sections/VibeCodingSidebar.tsx` — new, client component, IntersectionObserver active-section highlighting.
- `src/components/sections/VideoCallout.tsx` — new, with `kind="video"|"doc"` prop + duration rendering.
- `src/components/sections/CopyablePrompt.tsx` — new, client component, clipboard API + wrap-on-overflow.
- `src/app/robots.ts` — added `/learn/vibe-coding` to default disallow + 12 explicit AI-crawler rules.
- `public/learn/vibe-coding/{ecosystem.png, session-flow.png, rules.png}` — 3 Gemini-generated diagrams (~5MB each, Next.js Image optimizes on serve).

**Where we are:**
🟢 chrishornak.com is on `aed3f41`. Two new noindex routes live at `/learn/vibe-coding` + `/learn/vibe-coding/principles`. Build verified clean (23 static pages generated, both new routes prerendered). All copy-paste prompts wrap correctly (no horizontal scroll). Sticky sidebar works desktop + mobile.

**Next action (entry point for next session):**
1. **PA Pardon audit-shaped workaround revert** — still queued from 2026-05-08. `Projects/papardon/src/components/ui/Logo.tsx` (restore `alt="" role="presentation"`) + `Projects/papardon/src/components/sections/FAQ.tsx` (`<h3>` back to `<span>` inside `<summary>`). Re-audit after revert.
2. **Heading-skip footer scope reset** — remaining "weaker, later" item from 2026-05-08. Strict-WCAG keeping defensible; don't change unless multiple users complain. Location: `audit-parser.ts:975-1023`.
3. **Image-format check** still firing 13/17 even after Wave 2 calibration. Consider neutral-info reframe in a third calibration pass.
4. **Watch /learn/vibe-coding get used** — when Chris shares the link, log feedback to `memory/feedback_starter_*` for v0.3 iteration.

**Unsaved decisions:**
- **CSP nonces check.** `audit-parser.ts` doesn't yet detect CSP `'unsafe-inline'` as a Security warning. Still pending from 2026-05-11.
- **Memory writes still pending from 2026-05-08 retrospection:** `feedback_distinguish_block_classes.md`, `feedback_mine_test_data_before_patching.md`.

**Gotchas / Errors encountered:**
- **`github.com/chrishornak`** doesn't exist as a GitHub org/user. Caused initial wrong-URL push; corrected to `shwishabit/vibe-coding-starter` in 6 spots + re-pushed.
- **`overflow-x-auto` on `<pre>`** produced horizontal scrollbars on long copyable prompts. Fixed mid-session with `whitespace-pre-wrap break-words` + `overflow-wrap: anywhere`.
- **Video/doc visual distinction.** Initial VideoCallout used "Watch" + play icon for everything including a docs link. Caught by Chris in screenshot review; refactored to support `kind="video"|"doc"` with distinct icons/labels.

**Process retrospection:**
- **Top-bar replacement was a good call.** Chris's instinct that "the in-guide nav is more important than my main website nav" applies to any future documentation-style sub-section. Worth a memory rule: "On docs/guide subpages, swap site nav for slim return-to-home + in-page nav."
- **Visual signifiers must match content semantics.** A play icon on a docs link is dishonest. Same principle for any badge/chip/icon: type → visual treatment should be 1:1. Surfaced by Chris in screenshot review.
- **Restructure when asked.** "Your first conversation" was logically misplaced (Q&A fires AFTER they know what they're building, not before). The 5-minute restructure made the flow honest.

**SWOT (session retrospective):**

- **Strengths:**
  - Built sticky-sidebar-with-active-highlighting as a reusable component (`VibeCodingSidebar`) — could be promoted to a generic `<DocsSidebar />` if Chris adds more guide-style sections.
  - Verification held every push — `npm run build` exit 0 before every git push; zero broken deploys across 8+ commits in one session.
  - Honest about Veo limits (text-to-video, can't browse URLs) and proposed the right two-step workflow (Gemini reads → Veo generates).

- **Weaknesses:**
  - Multiple sub-iterations on the sidebar (initial → sticky → mobile sticky → restructure → new component). A clearer up-front [PLAN] would have collapsed 3 commits into 1.
  - Initial OPTIONAL-SKILLS menu was placeholder fluff with no actual skill files behind it. Chris caught and called for curation.
  - Video durations are estimates — could have WebFetched 4 YouTube pages for exact, chose speed instead.

- **Opportunities:**
  - **Promote VibeCodingSidebar → generic DocsSidebar.** Reusable for any future chrishornak docs section.
  - **Wire a Path A intro video** when Chris generates one in Veo — slot is ready at the hero of `/learn/vibe-coding`.
  - **Add `/learn` index page** if more guides land here over time.

- **Threats:**
  - **PA Pardon workaround revert still pending** from 2026-05-08. Will continue to silently expand if not cleaned up.
  - **Vercel auto-deploys from `main` with no staging.** Every commit goes live in 60s. Mitigation: verification chain held tonight.
  - **5MB PNG diagrams** could feel slow on first paint on mobile. Next.js Image optimizes to WebP/AVIF on serve, but worth monitoring Lighthouse on the live page after Vercel's cold-start optimization completes.
