# Evidence for the TRUST checks of the Authority Check (40 of 100 points)
Researched 2026-10-06 · deep · by source-researcher

## Answer
- Google's own words support the weighting: "Of these aspects, trust is most important." (Search Central) and the Quality Rater Guidelines (Sept 11, 2025) say Trust is "the most important member of the E-E-A-T family" (p.27).
- Strongest per check: Reviews = BrightLocal 2026 (n=1,002) and QRG p.23. Contact = QRG p.18 + Stanford. About = QRG p.27 + NN/G 2019. HTTPS = only Google's 2014 post (a small ranking signal) plus a 2022 padlock survey. Recently updated = Stanford 2002 (dated) and QRG p.158.
- Weakest links: no study ties "Secure site" to trust in a way I could open, and nothing supports the 2-month / 6-month thresholds. Say so on the "How we score" page rather than imply it.
- Caution on framing: the QRG tells raters to be "skeptical" of reviews the site owner could write (p.23). On-site testimonials are weaker evidence than third-party reviews. Do not claim "raters reward testimonials".

## How I verified (read this before reusing a quote)
- **RAW** = I read the page or PDF text itself: Google "creating helpful content", the QRG PDF (downloaded, 182 pp, text extracted, page numbers checked), Stanford guidelines page, NN/G About Us article, Fogg et al. 2002 PDF.
- **WX** = read through WebFetch, which summarises with a small model. Numbers and quotes are plausible but not checked byte-for-byte. Re-open before publishing: BrightLocal, Spiegel, NN/G Contact Us, NN/G Trustworthy Design, Google 2014 HTTPS post, Google padlock paper, Google dates doc.
- **DOSSIER** = reused from `.agent/seo-panel/*.md` with its original link; I did not re-open the page this session.

## Framing note (Google on E-E-A-T)
- "E-E-A-T itself isn't a specific ranking factor" — Google, Search Central, https://developers.google.com/search/docs/fundamentals/creating-helpful-content (wording taken from the Lily Ray dossier, which cites that page [DOSSIER]; I did not re-find the sentence in my own read). Use "makes people and raters trust the site", not "ranks you higher".

---

## 1. Reviews on your site (15 pts)

| Type | Exact quote or stat | Source | Year | URL | Strength |
|---|---|---|---|---|---|
| Survey | "While trust in reviews has fluctuated over time, it still sits at a significant 49% today." Sample 1,002 US adults, SurveyMonkey. Read as "as much trust as the people they know". [WX] | BrightLocal, Local Consumer Review Survey 2026 | 2026 (pub. Feb 11) | https://www.brightlocal.com/research/local-consumer-review-survey/ | strong (about reviews on review platforms, not testimonials on your own site) |
| Survey | "74% seek reviews written in the last three months." Also "68% will only use a business with four or more stars". [WX] | BrightLocal 2026 (same) | 2026 | https://www.brightlocal.com/research/local-consumer-review-survey/ | strong |
| Google raters | "You may consider a large number of detailed, trustworthy, positive user reviews as evidence of positive reputation for a store or business." QRG s.3.3.2, p.23 [RAW] | Google Search Quality Rater Guidelines | Sept 11, 2025 | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | strong |
| Google raters (caveat) | "Be skeptical of both positive and negative reviews. Anyone can write them, including the website owner" and "the content of the reviews matter, not just the number or star rating." p.23 [RAW] | QRG | 2025 | same | strong; supports "real names, real detail", warns against self-posted reviews |
| Google raters | Raters look for "independent reviews, references, news articles, and other sources of credible information". s.3.2/E-E-A-T p.27 [RAW] | QRG | 2025 | same | ok |
| Study | "The purchase likelihood for a product with five reviews is 270% greater than the purchase likelihood of a product with no reviews." Also: 190% lift on low-priced, 380% on high-priced items; verified-buyer badge +15% (as extracted). Product reviews on e-commerce; sample not stated in what I could read. [WX] | Spiegel Research Center, Northwestern (Medill), "How Online Reviews Influence Sales" | 2017 (dated) | https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/ | ok (dated, e-commerce products, not service businesses; eBook PDF would not parse) |
| Study | "reviews and recommendations from trusted peers are one of the most important criteria used when forming an impression about an organization." 70+ users, three rounds of testing. [RAW] | Nielsen Norman Group, "'About Us' Information on Corporate Websites" | May 26, 2019 | https://www.nngroup.com/articles/about-us-information-on-websites/ | ok (about impressions of companies, not conversion) |
| Expert | "Make sure you have a testimonials/reviews page on your own site, and it's linked in the main nav." [DOSSIER] | Darren Shaw, Whitespark, Local Search Ranking Factors 2026 | 2025-26 (report Nov 6, 2025) | https://whitespark.ca/local-search-ranking-factors/ | ok (practitioner advice from a ranking survey; ranking context) |
| Expert | "Third-party reviews show up in your Google Business Profile knowledge panel, which increases the credibility of your Google reviews." [DOSSIER] | Darren Shaw, Whitespark blog | Jan 7, 2025 | https://whitespark.ca/blog/3-ways-to-diversify-your-local-business-reviews/ | weak-ok (about credibility of third-party reviews) |

**Why:** "49% of consumers trust online reviews as much as people they know. (BrightLocal survey, 2026)"
Alternate if you want Google's voice: "Google's raters treat many detailed, trustworthy reviews as evidence of good reputation. (Rater Guidelines, 2025)".

---

## 2. How to reach you (11 pts)

| Type | Exact quote or stat | Source | Year | URL | Strength |
|---|---|---|---|---|---|
| Google raters | "Contact information and customer service information are extremely important for websites that handle money, such as stores, banks, credit card companies, etc." s.2.5.3, p.18 [RAW] | QRG | 2025 | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | strong (money sites; local service firms that take bookings or payments are close, but the sentence is not about them) |
| Google raters | "Many websites offer multiple ways to contact the website: email addresses, phone numbers, physical addresses, web contact forms" (paraphrase of p.18; exact wording is in the PDF). Also: "The types and amount of contact information needed depend on the type of website." [RAW] | QRG | 2025 | same | strong |
| Google raters | Pages that process payments "should receive a Low rating if there is an unsatisfying amount of customer service information or contact information." s.5.5, p.63 [RAW] | QRG | 2025 | same | strong for payment pages only |
| Google raters | Raters are told to "start with the homepage. Look for a 'contact us' or 'customer service' link." p.18 [RAW] | QRG | 2025 | same | ok (supports checking homepage + contact page) |
| Study | "A simple way to boost your site's credibility is by making your contact information clear: phone number, physical address, and email address." [RAW] | Stanford Web Credibility Project, Guidelines for Web Credibility (guideline 5) | 2002 (dated) | https://credibility.stanford.edu/guidelines/index.html | ok (dated, guideline not a measured stat) |
| Study | "a Web site wins credibility points by giving information about the organization behind the Web site: who they are, what they do, and how to contact them." 8.8% of 2,440 participant comments mentioned identity of the site operator; 6.4% mentioned customer service. 2,684 participants, 100 sites. [RAW] | Fogg et al. (Stanford + Consumer WebWatch), "How Do People Evaluate a Web Site's Credibility?" | Oct 29, 2002 (dated) | https://dejanmarketing.com/media/pdf/credibility-online.pdf (mirror; original at credibility.stanford.edu) | ok (dated; small share of comments; design look was top at 46.1%) |
| Study | "Clearly display contact phone numbers on your site. Don't hide or remove phone numbers." and "Always include your headquarters address in your contact information". 20 business professionals, 40 corporate websites. [WX] | Nielsen Norman Group, "'Contact Us' Page Guidelines" | Aug 18, 2019 | https://www.nngroup.com/articles/contact-us-pages/ | ok (qualitative, B2B corporate sites) |
| Study | "prominently displaying contact information (a good place is in the utility navigation)". Singapore usability study. [WX] | NN/G, "Trustworthiness in Web Design: 4 Credibility Factors" | May 8, 2016 (dated) | https://www.nngroup.com/articles/trustworthy-design/ | weak-ok |
| Expert | Phone/address on the site matching the Google Business Profile: "HTML NAP Matching GBP NAP" ranks #15 (score 153) for the local pack; address that is a PO box or virtual office is the #1 suspension-risk factor. [DOSSIER] | Whitespark Local Search Ranking Factors 2026 | 2025-26 | https://whitespark.ca/local-search-ranking-factors/ | ranking claim; weak for trust |

**Why:** "Google's raters call contact information "extremely important" for sites that handle money. (Quality Rater Guidelines, 2025)"

---

## 3. About page (8 pts)

| Type | Exact quote or stat | Source | Year | URL | Strength |
|---|---|---|---|---|---|
| Google (docs) | "Of these aspects, trust is most important." [RAW] | Google Search Central, "Creating helpful, reliable, people-first content" (E-E-A-T section) | updated 2026-10-05 per page footer | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | strong (weighting) |
| Google (docs) | Paraphrase: Google asks if content gives "background about the author or the site that publishes it, such as through links to an author page or a site's About page". [RAW] | same | 2026 | same | strong |
| Google raters | "Look at the 'About us' page on the website or profile page of the content creator as a starting point." p.27 [RAW] | QRG | 2025 | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | strong |
| Google raters | "We expect clear information about who (e.g., what individual, company, business, foundation, etc.) created the MC" s.5.5, p.63 [RAW] | QRG | 2025 | same | strong |
| Google raters | "Trust is the most important member of the E-E-A-T family because untrustworthy pages have low E-E-A-T no matter how Experienced, Expert, or Authoritative they may seem." p.27 [RAW] | QRG | 2025 | same | strong (supports the 40-point weight) |
| Study | "a Web site wins credibility points by giving information about the organization behind the Web site: who they are, what they do, and how to contact them." 8.8% of 2,440 comments; 2,684 participants. [RAW] | Fogg et al., Stanford / Consumer WebWatch | 2002 (dated) | https://dejanmarketing.com/media/pdf/credibility-online.pdf | ok (dated) |
| Study | "The easiest way to do this is by listing a physical address." (under "Show that there's a real organization behind your site") [RAW] | Stanford Guidelines for Web Credibility | 2002 (dated) | https://credibility.stanford.edu/guidelines/index.html | ok |
| Study | Users want plain-language "what companies do, their mission and values, location information" and increasingly check third-party review sites; 70+ users observed. (paraphrase; page text read) [RAW] | NN/G, "'About Us' Information on Corporate Websites" | May 26, 2019 | https://www.nngroup.com/articles/about-us-information-on-websites/ | ok |
| Expert | Make transparent "who your experts are, who your company is, how you make money, and why your content can be trusted." [DOSSIER] | Lily Ray, own article on E-E-A-T | undated on page | https://lilyray.nyc/e-a-t-expertise-authoritativeness-trustworthiness/ | ok |
| Expert | "E-E-A-T is a framework, not a checklist." (use as a disclaimer on "How we score") [DOSSIER] | Lily Ray, BuzzStream podcast page | June 18, 2026 | https://www.buzzstream.com/blog/lily-ray-podcast/ | ok (framing) |

**Why:** "Google's raters start at your "About us" page to judge whether you're trustworthy. (Quality Rater Guidelines, 2025)"

---

## 4. Secure site / HTTPS (2 pts)

| Type | Exact quote or stat | Source | Year | URL | Strength |
|---|---|---|---|---|---|
| Google (blog) | "we're starting to use HTTPS as a ranking signal"; "For now it's only a very lightweight signal—affecting fewer than 1% of global queries"; and the encouragement "to keep everyone safe on the web". [WX] | Google Webmaster/Search Central Blog, "HTTPS as a ranking signal" | Aug 2014 (dated) | https://developers.google.com/search/blog/2014/08/https-as-ranking-signal | ok for "Google says use HTTPS"; the signal part is a **ranking claim** |
| Study | n=1,880 online survey: "the majority of respondents (89%) had misconceptions about the" padlock icon; of people who consult it, those "reported reluctance to complete transactions without it". Authors conclude it shows connection security but is often misread as broader trustworthiness. [WX] | von Zezschwitz, Stark, Chen, "'It builds trust with the customers' - Exploring User Perceptions of the Padlock Icon in Browser UI" (SecWeb 2022, IEEE; hosted on research.google) | 2022 | https://research.google/pubs/it-builds-trust-with-the-customers-exploring-user-perceptions-of-the-padlock-icon-in-browser-ui/ | ok; honest nuance, only a minority check the padlock |
| Google raters | "Online stores need secure online payment systems and reliable customer service." p.26 [RAW]. The QRG text has no mention of HTTPS, SSL or padlock (searched the full extracted text). | QRG | 2025 | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | weak (not about HTTPS) |
| Google (docs) | Redirected page "Enable HTTPS on your servers" reads (as extracted): Google "uses HTTPS as a positive search quality indicator". Wording not verified. [WX] | web.dev | n/d | https://web.dev/enable-https/ | weak |
| Expert | "HTTPS by default" is #18 (score 154) for local organic; Localo's 16,098-GBP check found no effect for HTTPS (via dossier summary of a Localo post). [DOSSIER] | Whitespark LSRF 2026; Localo | 2025-26 | https://whitespark.ca/local-search-ranking-factors/ | ranking claim; weak for trust |

**Why:** "Google urges every site to use HTTPS "to keep everyone safe on the web". (Google Search Central, 2014)"
Dated source; the 2 points are small, which fits the thin evidence. Do not add a "% of users leave" stat (see NOT FOUND).

---

## 5. Recently updated (up to 4 pts)

| Type | Exact quote or stat | Source | Year | URL | Strength |
|---|---|---|---|---|---|
| Study | "People assign more credibility to sites that show they have been recently updated or reviewed." (guideline 8: "Update your site's content often (at least show it's been reviewed recently)") [RAW] | Stanford Web Credibility Project, Guidelines for Web Credibility | May 2002 (dated) | https://credibility.stanford.edu/guidelines/index.html | ok (only direct credibility statement found; dated; a guideline, not a measured stat) |
| Google raters | "unmaintained/abandoned 'old' websites or unmaintained and inaccurate/misleading content is a reason for a low Page Quality rating." Same paragraph: "Freshness is generally less of a concern for Page Quality rating." p.158 [RAW] | QRG | 2025 | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | strong for "abandoned = low"; also cuts against over-claiming for older pages |
| Google (docs) | "Add a user-visible date to the page and feature it prominently. Label your dates appropriately with text like 'Publish' or 'Last updated'." [WX] | Google Search Central, "Add a Byline Date to Google Search Results" | 2026 | https://developers.google.com/search/docs/appearance/publication-dates | ok (supports showing dates; not a trust claim) |
| Study | Participant comment on a site that looked unattended: "make it feel like no one is watching, taking care of the site." [RAW] | Fogg et al. 2002, p.46 | 2002 (dated) | https://dejanmarketing.com/media/pdf/credibility-online.pdf | weak (one anecdote, about a bug on the page) |
| Study | NN/G lists "comprehensive and current content" among four trust factors, citing a 1999 Jakob Nielsen list (as seen in a search summary only; article body not quoted). [WX, not quoted] | NN/G | 1999 / 2016 | https://www.nngroup.com/articles/trustworthy-design/ | weak (dated) |
| Survey | BrightLocal: "74% seek reviews written in the last three months." Evidence that recent matters for reviews, not for blog posts or page updates. [WX] | BrightLocal 2026 | 2026 | https://www.brightlocal.com/research/local-consumer-review-survey/ | weak for this check (different object) |

**Why:** "People see sites as more credible when they show a recent update or review. (Stanford Web Credibility, 2002)"
Flag "2002" on the card. The 2-month and 6-month cut-offs are your own thresholds; no source sets them.

---

## NOT FOUND
- Any study or survey on **on-site testimonials** (names + stars on a business's own homepage) and trust. Looked in: BrightLocal 2026 page (states nothing on this), Spiegel page, web search for Whitespark/BrightLocal. Only product-review conversion studies and third-party-review surveys exist.
- Spiegel sample size and method. The eBook PDF would not parse (logo/metadata only). The study is on product reviews, not local services.
- A survey on "Not secure" warnings and trust that I opened. Search Engine Land article (John Cabot survey, 1,324 UK users, "46 percent" would not enter names or financial info per search snippet) returned HTTP 403 and was NOT opened. Panda Security (2019), TrustedSite (2020) and Tidio figures appeared only in search snippets; not opened, not used.
- Google's own post "Moving towards a more secure web" (Security Blog, Sept 8, 2016): page loaded but the body text was not extracted. No Chrome "Not secure" announcement opened.
- The QRG says nothing about HTTPS, SSL or the padlock (full text searched).
- A source for the 2-month / 6-month "recently updated" windows, or any study that a dated blog post specifically raises trust. Stanford (2002) is the only direct statement.
- A Google statement that on-site testimonials count as trust evidence. The QRG treats reviews as reputation evidence and warns raters that owners can write them.
- NN/G or Baymard data on "Contact Us" with a hard number (e.g. % of users who look for a phone number). NN/G gives guidelines from qualitative studies only.
- Lily Ray or Darren Shaw statements specifically on phone/address as trust signals or on the HTTPS padlock (dossiers also record none). Darren's address/NAP evidence is ranking-factor scores only.
- BrightLocal raw page: curl returned no response; figures come through WebFetch only. The first WebFetch pass also reported "85% say positive reviews make them more likely to use a business" and "97% read reviews"; the second pass did not repeat them, so I did not use them.
- Fogg 2003 DUX paper (semantic scholar 403) not opened; only the 2002 report PDF was.

## Sources
1. Creating helpful, reliable, people-first content — https://developers.google.com/search/docs/fundamentals/creating-helpful-content — Google doc (RAW)
2. Search Quality Evaluator Guidelines, Sept 11, 2025 — https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf — Google rater doc, 182 pp (RAW). Pages cited are PDF page numbers: 18, 23, 26, 27, 63, 158
3. HTTPS as a ranking signal (2014) — https://developers.google.com/search/blog/2014/08/https-as-ranking-signal — Google blog (WX)
4. Enable HTTPS on your servers — https://web.dev/enable-https/ — Google doc (WX)
5. Add a Byline Date to Google Search Results — https://developers.google.com/search/docs/appearance/publication-dates — Google doc (WX)
6. "It builds trust with the customers" padlock paper — https://research.google/pubs/it-builds-trust-with-the-customers-exploring-user-perceptions-of-the-padlock-icon-in-browser-ui/ — research paper page (WX)
7. BrightLocal Local Consumer Review Survey 2026 — https://www.brightlocal.com/research/local-consumer-review-survey/ — survey (WX)
8. BrightLocal fake-reviews post (opened, not used) — https://www.brightlocal.com/blog/lcrs-fake-reviews/ — survey write-up (WX)
9. Spiegel Research Center, How Online Reviews Influence Sales — https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/ — study summary (WX)
10. NN/G About Us — https://www.nngroup.com/articles/about-us-information-on-websites/ — research article (RAW)
11. NN/G Contact Us Page Guidelines — https://www.nngroup.com/articles/contact-us-pages/ — research article (WX)
12. NN/G Trustworthiness in Web Design — https://www.nngroup.com/articles/trustworthy-design/ — research article (WX)
13. Stanford Guidelines for Web Credibility (2002) — https://credibility.stanford.edu/guidelines/index.html — guidelines (RAW)
14. Fogg et al., How Do People Evaluate a Web Site's Credibility? (Oct 2002) — https://dejanmarketing.com/media/pdf/credibility-online.pdf — study report (RAW; mirror)
15. Whitespark Local Search Ranking Factors 2026 — https://whitespark.ca/local-search-ranking-factors/ — survey (DOSSIER)
16. Whitespark, 3 Ways to Diversify Your Local Business Reviews — https://whitespark.ca/blog/3-ways-to-diversify-your-local-business-reviews/ — blog (DOSSIER)
17. Lily Ray, E-E-A-T — https://lilyray.nyc/e-a-t-expertise-authoritativeness-trustworthiness/ — own article (DOSSIER)
18. BuzzStream, AI Search Tactics That Will Bite You Later — https://www.buzzstream.com/blog/lily-ray-podcast/ — podcast page (DOSSIER)
19. Search Engine Land, "Nearly half of users have a bad reaction to 'not secure'" — https://searchengineland.com/nearly-half-of-users-have-a-bad-reaction-to-not-secure-browser-warning-survey-finds-312930 — 403, NOT opened
