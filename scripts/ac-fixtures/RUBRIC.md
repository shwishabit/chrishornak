# Authority Check labels: what "yes" means

One label per site per check: `true` (the homepage shows it), `false` (it doesn't), or `null` (can't tell from the saved page; not scored). Label what a visitor or a careful reader of the page would say, not what our rules find. Read the page as saved (`npx tsx scripts/ac-fixtures.mts digest <domain>`): visible text, links, image alt / title / file name, JSON-LD, and any extra page the check read.

| Check | `true` when the homepage… | `false` examples |
|---|---|---|
| `work` Your work shown | shows or links (same site) to the business's own past work: portfolio, projects, gallery, case studies, results, before / after; or a client list / client logo wall | a Services page; stock photos |
| `track` Track record | states 5+ years doing the work (a start year 5+ years ago, "20 years of experience", schema foundingDate), or a count of 20+ clients / customers / jobs / projects / brands (since 2026-10-02 testimonials and review counts count only in `reviews`) | "since 2024"; "2027 Weddings" (a season); testimonials; "700+ reviews" |
| `people` Real people | names at least one real person who works there (owner, founder, staff), in text, image alt, or schema founder / employee / Person | customer names in testimonials; "About us"; "Google Partner"; "Meet the team" with no name |
| `credentials` Credentials | shows a licence, certification, accreditation, award, ranking (Inc. 5000), partner status (Google Partner), membership (BBB), degree letters (DDS, CPA, Esq.). Text, alt or a telling image file name. Since 2026-10-02 a founding year or years in business is not a credential here (it is `track`; Findability's own rule still counts it) | "We're the best"; "since 1998"; "30 years of experience" |
| `trade` What you do | says in plain words what kind of business it is (plumber, law firm, digital marketing agency, bakery) | only a brand name |
| `about` About page | links to a page on the same site about the business or its people (About, Our story, Team, Company, Meet the doctor, Our firm) | a LinkedIn "about" link |
| `address` How to reach you | shows a phone number (text or `tel:` link) or a street address | a city alone; email alone; a form alone; schema only |
| `reviews` Reviews on your site | shows customer reviews: quoted customer words, a star rating, a review count, or a review widget, on the homepage or on the site's own reviews page the check read | "Reviews" as a menu word only |
| `reviewSites` Links to your reviews | links (or embeds, or lists in schema `sameAs`) the business's own profile on an independent review site: a Google Business Profile listing, Yelp, BBB, Clutch, G2, Capterra, UpCity, DesignRush, Trustpilot, Healthgrades, Avvo, Houzz, Angi… | Facebook / LinkedIn / Instagram; a Google Maps link to a street address; "906 Google reviews" with no link |
| `https` Secure site | final address starts with `https://` | |
| `schema` Business details for Google | has JSON-LD that parses, with a top-level (or `@graph`) entry of an Organization-family type: Organization, LocalBusiness or any subtype (ProfessionalService, Dentist, Attorney, HVACBusiness, AutoRepair, Bakery…), or Person for a one-person business. The entry names the business as the page does and has a url on this site, a sameAs, a phone or an address (since 2026-10-02, SEO panel rounds 4–5) | WebSite / WebPage / BreadcrumbList only; a Person or Organization only as an article's author or publisher; a block that doesn't parse (a `//` comment, stray text) |

**About page (since 2026-10-02):** for `people`, `credentials` and `track`, "the homepage" means the homepage **or** the About page the check reads (it reads one when the homepage misses any of the three). Those cells were first labelled from the homepage, then every "no" was judged again from the saved About page by a blind labeller; a "yes" there turns the label to `true` (its `why` starts "About page:").

Limits: images are judged by alt, title and file name only (no pixels). Numbers filled in by JavaScript are not in the saved page, so they count as absent. The labels for the 14 agencies started from the hand check of 2026-10-02 (`drafts/research/agency-trust-signals.md`, report https://claude.ai/artifact/8KAMpDcbeCdpeNbi5c4rDu); every site was then re-labelled blind against this rubric and the two compared.

Added 2026-10-02 (SEO panel final spec):

| Check | Yes when | Not when |
|---|---|---|
| `focus` Focus: offer pages | the homepage links 3+ separate same-site pages, one per offering: services, products, practice areas, treatments, classes, menu or product categories, SaaS features | one "Services" page; anchors on one page; blog posts, case studies, locations, team bios |
| `seen` Seen elsewhere | links (or JSON-LD sameAs) to 1+ outside places that list, feature or recognise the business: press articles, podcasts, associations, chambers, best-of lists, directories, LinkedIn company page, Crunchbase, partner directories | review sites (those are `reviewSites`); social profiles; the business's own podcast; logos with no link |
