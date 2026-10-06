# Evidence for the Authority Check: Link strength, Review spread, Seen elsewhere
Researched 2026-10-06 · deep (about 14 sources opened, plus 6 panel dossiers reused) · by source-researcher

## Read this first (framing rules for the copy)
- Google says E-E-A-T is not a ranking factor. Exact words: "While E-E-A-T itself isn't a specific ranking factor, using a mix of factors that can identify content with good E-E-A-T is useful." — Google Search Central, Creating helpful, reliable, people-first content, https://developers.google.com/search/docs/fundamentals/creating-helpful-content (raw HTML opened, undated page) [source]
- Google says it does not use third-party metrics: "We don't use domain authority at all in our algorithms." — John Mueller, Twitter, 24 Feb 2020, as reported by Search Engine Roundtable, https://www.seroundtable.com/google-still-uses-pagerank-29056.html [source, secondary report of a tweet; I did not open the tweet]. DR and Open PageRank are third-party scores. Do not call them Google signals.
- The rater guidelines are instructions for human raters who evaluate search quality. They are not the ranking algorithm. "Why" lines below say "Google's raters", never "Google ranks".
- Our checks (Review spread, Seen elsewhere) test whether THE SITE LINKS OUT to those profiles. The guidelines describe raters looking at what OTHERS say about the site, off the site. So the on-site link is a proxy for having that presence. It is not the thing Google or raters measure. [inference]
- Reputation research is limited by design: "small websites may have little or no reputation information. This is not indicative of high or low quality." (QRG 3.3.5, quoted in full below). Do not imply a low score means Google thinks a site is poor. [source]

Strength key: strong = primary source, direct fit, current; ok = primary but indirect, or secondary but sound, or expert opinion; weak = dated, vendor, narrow sample, or indirect.
"ranking claim" = the item says something affects rankings. "quality signal" = the item says something about quality or trust, not rankings.

---

## CHECK 1. Link strength (up to 11 pts): Ahrefs Domain Rating, or Open PageRank as fallback

Honest framing: "other sites vouching for you". Google's own words support the idea that other sites linking is a quality input. Google does not use DR. DR is a stand-in.

| Type | Exact quote or stat | Source | Year | Full URL | Strength |
|---|---|---|---|---|---|
| Google (docs) | "one of the factors used to determine quality is understanding if other prominent websites link or refer to the content." Paraphrase of next sentence: Google says this is generally a good sign the information is trustworthy. Note: it says "the content", i.e. pages, not whole domains. [quality signal] | Google, How Search works, "Quality of Content" section | undated page, opened 2026-10-06 | https://www.google.com/intl/en_us/search/howsearchworks/how-search-works/ranking-results/ | strong |
| Google (docs) | "We have various systems that understand how pages link to each other as a way to determine what pages are about" and PageRank is described as one of Google's core ranking systems (wording per page extraction: "one of our core ranking systems used when Google first launched"). [ranking claim, Google's own] | Google Search Central, Ranking systems guide, "Link analysis systems and PageRank" | undated page, opened 2026-10-06 | https://developers.google.com/search/docs/appearance/ranking-systems-guide | strong |
| Google (person) | "We don't use domain authority at all in our algorithms." Same post: "Yes, we do use PageRank internally, among many, many other signals." (second quote per page extraction) | John Mueller via Search Engine Roundtable | 2020 | https://www.seroundtable.com/google-still-uses-pagerank-29056.html | ok (secondary report, primary speaker) |
| Tool vendor (definition) | "Domain Rating (DR) is an Ahrefs metric that shows the relative strength of a website's backlink profile." | Ahrefs, Tim Soulo, "Domain Rating" (blog) | 2022 (4 May) | https://ahrefs.com/blog/domain-rating/ | strong (for what DR is) |
| Tool vendor (limits) | "Ahrefs' DR metric is purely link-based." and "DR doesn't account for backlink SPAM. In fact, large amounts of low-quality backlinks may actually increase your DR, not decrease it." (two quotes, both per page extraction) | Ahrefs, same article | 2022 | https://ahrefs.com/blog/domain-rating/ | strong (for what DR is not) |
| Tool vendor (correlation) | "Although DR correlates strongly with a website's search traffic, you should not focus your efforts on growing this metric specifically." [correlation, not a ranking claim] | Ahrefs, same article | 2022 | https://ahrefs.com/blog/domain-rating/ | ok |
| Tool vendor (fallback) | Open PageRank data source: "Common Crawl, a nonprofit that crawls the public web and releases the data for anyone to use." Score merges link-vote weighting with "the number of distinct domains that link to you". Page does not say it is Google's PageRank. | Open PageRank methodology (Keywords Everywhere) | undated | https://openpagerank.keywordseverywhere.com/methodology | ok |
| Rater guidelines | Raters are told to look for "information written by a person or organization, not statistics or other machine-compiled information." Same section says Similarweb-type traffic data is not evidence of reputation. Reading: raters do not score on link metrics. [inference] | Search Quality Rater Guidelines, 3.3.1 Reputation of the Website | 2025 (11 Sep) | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | ok (limits the claim) |
| Expert (panel) | "None of these scores are used by Google. They are not ranking factors." (names DR, DA, Authority Score) | Lily Ray, 2020 slide deck | 2020 | https://www.slideshare.net/slideshow/actionable-tips-to-increase-your-website-authority-lily-ray/232928167 | ok (reused from lily-ray.md; I did not re-open) |
| Expert (panel) | "Links will become 'just-one-of-many' authority/quality signals" | Jason Barnard, Sitechecker interview, 17 Nov 2020 | 2020 | https://sitechecker.pro/interview-jason-barnard/ | ok (reused from jason-barnard.md; a counterweight) |
| Expert (panel) | Link quality ranked #3 for local organic results in a survey of 47 experts: "Quality/Authority of Inbound Links to Domain", score 187 of a possible 235. Expert opinion, not measured data; the report says "None of the experts have special access to the internal workings of Google's local search algorithm." [ranking claim, opinion] | Whitespark, Local Search Ranking Factors 2026 (Darren Shaw) | 2025 (published 6 Nov 2025) | https://whitespark.ca/local-search-ranking-factors/ | ok (score verified in raw HTML) |
| Expert (panel) | "Links are just not where it's at; AI tools don't really give two craps about them either." Counter-evidence: do not lean on links for AI visibility claims. Too crude to print. | Rand Fishkin, Up Arrow Podcast, 29 Jul 2025 | 2025 | https://www.elumynt.com/podcast/audience-is-everything-rand-fishkin-on-ai-search-seo-and-the-future-of-marketing | weak (reused from rand-fishkin.md; counterweight only) |

Suggested fix-card line (built from the Google How Search works item):
**Why:** Google: a quality factor is whether other prominent websites link or refer to the content. (How Search Works)
(18 words. Pair with a small footnote: "DR is Ahrefs' estimate, not a Google score.")

Notes for the "How we score" page [inference]:
- Say plainly what DR is: a 0-100 estimate of backlink-profile strength computed by Ahrefs. Say what it is not: not Google's, not traffic, not content quality, and it can be raised by low-quality links.
- The tool's line "Links grow over months, as other sites link to you" has no source in this dossier. See NOT FOUND.

---

## CHECK 2. Review spread (up to 5 pts): links to review profiles on other sites

| Type | Exact quote or stat | Source | Year | Full URL | Strength |
|---|---|---|---|---|---|
| Survey (stat) | "The average consumer uses six different review sites when choosing businesses". Sample: 1,002 US adult consumers via SurveyMonkey; published 11 Feb 2026. Fieldwork dates not stated on the page. Google was used by 71% (down from 83% in 2025). Two page reads agreed; my raw-HTML check failed (connection error), so re-confirm the wording before print. | BrightLocal, Local Consumer Review Survey 2026 | 2026 | https://www.brightlocal.com/research/local-consumer-review-survey/ | strong |
| Survey (stat) | 97% of consumers read reviews for local businesses (figure from the search-result summary and the page read; sample as above). | BrightLocal, same survey | 2026 | https://www.brightlocal.com/research/local-consumer-review-survey/ | ok |
| Rater guidelines | "You may consider a large number of detailed, trustworthy, positive user reviews as evidence of positive reputation for a store or business." [quality signal] | Search Quality Rater Guidelines, 3.3.2 Customer Reviews as Reputation Information | 2025 (11 Sep) | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | strong |
| Rater guidelines | Raters are shown this search for outside reviews: "[ibm reviews -site:ibm.com]", described as "A search for reviews of IBM that excludes pages on ibm.com." The point: reviews on other sites, not the company's own. | Search Quality Rater Guidelines, 3.3.3 How to Search for Reputation Information | 2025 | same PDF | strong |
| Rater guidelines | "Be skeptical of both positive and negative reviews." Paraphrase: anyone can write them, including the owner or someone hired. Also "Try to find as many reviews as possible." Also: "the content of the reviews matter, not just the number or star rating." | QRG 3.3.2 | 2025 | same PDF | strong (cuts against a spread-only score; see notes) |
| Expert (panel) | "Third-party reviews show up in your Google Business Profile knowledge panel, which increases the credibility of your Google reviews." | Darren Shaw, Whitespark blog, 3 Ways to Diversify Your Local Business Reviews, 7 Jan 2025 | 2025 | https://whitespark.ca/blog/3-ways-to-diversify-your-local-business-reviews/ | ok (opened this session) |
| Expert (panel) | "Google digests the data from all your reviews across the web to determine whether they want to show your business to searchers or not." [ranking claim, vendor opinion, no data given; the page has no statistics] | Darren Shaw, same post | 2025 | https://whitespark.ca/blog/3-ways-to-diversify-your-local-business-reviews/ | weak (ranking claim, unsupported) |
| Expert (panel) | "Get reviews on the prominent review sites in your industry. You can't just send review requests to Google anymore." | Darren Shaw, Local Search Ranking Factors 2026, recommendations list | 2025 | https://whitespark.ca/local-search-ranking-factors/ | ok (verified in raw HTML) |
| Expert survey (stat) | "Diversity of Third-Party Sites on Which Reviews are Present" scored 79 (rank #106) for the local pack, 102 (#60) for local organic, 136 (#11) for AI search visibility, out of a possible 235. 47 experts, opinion not measured data. [ranking claim, opinion] | Whitespark, Local Search Ranking Factors 2026 | 2025 | https://whitespark.ca/local-search-ranking-factors/ | ok (honest: matters little for the map pack, more for AI) |
| Expert (panel) | "They will believe you if you claim and frame on your website, and you prove it off your website." (page excerpt, not a transcript) | Jason Barnard, James Dooley podcast ep. 294, 30 Jan 2026 | 2026 | https://jamesdooleypodcast.uk.com/episodes/number-one-seo-ranking-factor-is-the-algorithmic-trinity-james-dooley-interviews-jason-barnard/ | weak (reused; Kalicube sells related services) |

Suggested fix-card line (built from the BrightLocal item):
**Why:** Consumers use an average of six review sites when choosing a business. (BrightLocal, 2026)
(14 words.)

Notes [inference]:
- The strongest Google-side sources reward reading review content, quantity, and independence. A "links to Yelp and BBB" check is a proxy for having profiles there. The How we score page should say so.
- The tool checks that the site links to profiles; the rater guidelines say owners can write their own reviews. Say the tool cannot verify review quality.

---

## CHECK 3. Seen elsewhere (up to 4 pts): links to press, podcasts, associations, directories that feature the business

| Type | Exact quote or stat | Source | Year | Full URL | Strength |
|---|---|---|---|---|---|
| Rater guidelines | "look for independent reviews, references, recommendations by experts, news articles, and other sources of credible information about the website." [quality signal] | Search Quality Rater Guidelines, 3.3.1 Reputation of the Website | 2025 (11 Sep) | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf | strong |
| Rater guidelines | "News articles, Wikipedia articles, blog posts, magazine articles, forum discussions, and ratings from independent organizations can all be great sources of reputation information." | QRG 3.3.1 | 2025 | same PDF | strong |
| Rater guidelines | "Recommendations from expert sources, such as professional societies, are strong evidence of a positive reputation." Context: this sentence is in the YMYL (health, money, safety topics) paragraph. | QRG 3.3.1 | 2025 | same PDF | strong for associations; applies to YMYL topics only |
| Rater guidelines | "Be skeptical of claims that websites make about themselves, particularly when there is a clear conflict of interest." | QRG 3.3.1 | 2025 | same PDF | strong (explains why a link alone is thin proof) |
| Rater guidelines | "small websites may have little or no reputation information. This is not indicative of high or low quality." Also: "Many small local businesses or community organizations have a small 'web presence' and rely on word of mouth." | QRG 3.3.5 What to Do When You Find No Reputation Information | 2025 | same PDF | strong (limit on the claim; keep in How we score) |
| Google (docs) | "If someone researched the site producing the content, would they come away with an impression that it is well-trusted or widely-recognized as an authority on its topic?" | Google Search Central, Creating helpful, reliable, people-first content, "Expertise" questions | undated page, opened 2026-10-06 | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | strong |
| Expert survey (stat) | "Quality/Authority of Unstructured Citations (Newspaper Articles, Blog Posts, Gov Sites, Industry Associations)" ranked #4 for AI search visibility, score 160 of 235. "Prominence on Key Industry-Relevant Domains" ranked #3, score 167. 47 experts, opinion not measured data. [ranking claim, opinion, AI search] | Whitespark, Local Search Ranking Factors 2026 | 2025 | https://whitespark.ca/local-search-ranking-factors/ | ok (verified in raw HTML) |
| Expert (panel) | "In AI SEO, mentions (citations) are the new link." | Darren Shaw, same report intro | 2025 | https://whitespark.ca/local-search-ranking-factors/ | ok (opinion) |
| Expert (panel) | "Evidence from a source with nothing to gain carries more weight than anything a brand says about itself." | Kalicube (Jason Barnard's company), 1 Oct 2026 | 2026 | https://kalicube.com/learning-spaces/faq-list/generative-ai/why-being-right-isnt-enough-for-ai-to-trust-your-brand | weak (reused; Kalicube is commercially interested) |
| Expert (panel) | "Unlinked mentions that Ahrefs was talking about are hugely important." (AI-citation context) | Cyrus Shepard, BuzzStream, 1 Jul 2026 | 2026 | https://www.buzzstream.com/blog/ai-citation-ranking-factors-podcast/ | weak (reused; opinion) |
| Survey (stat) | 58% of Gen Z say news articles influence brand credibility (72% say customer reviews). Sample 2,000 Americans aged 18-28, run by Walr for We Are Talker, 6-13 Feb 2026, online. Gen Z only, from a PR-driven site. | We Are Talker | 2026 | https://wearetalker.com/gen-z-trust-reviews-and-independent-research-more-than-influencers-when-evaluating-brands/ | weak (narrow sample; secondary publisher) |
| Research (dated) | "Are you affiliated with a respected organization? Make that clear." Also: guidelines "based on three years of research that included over 4,500 people." Same page: show a real organization via a physical address or a chamber of commerce membership. Year not printed on the opened page; I believe it is early 2000s [inference]. | Stanford Web Credibility Project, Guidelines | dated (pre-2019, year not confirmed) | http://credibility.stanford.edu/guidelines/index.html | weak (dated; use only as background) |

Suggested fix-card line (built from the QRG 3.3.1 item):
**Why:** Google's raters look for news articles, expert recommendations and independent ratings about a site. (Search Quality Rater Guidelines, 2025)
(19 words.)

Notes [inference]:
- A badge or link on your own page is a self-claim; the guidelines tell raters to be skeptical of those. The useful part is that the independent mention exists. Tell owners to link to real coverage, not logos.
- Raters are told small local businesses may have little reputation information and not to treat that as low quality. Keep the score label gentle.

---

## Reused from the panel dossiers (original links kept)
- Jason Barnard: sitechecker.pro interview (links "just-one-of-many"), Kalicube 1 Oct 2026 page, Dooley podcast. From `.agent/seo-panel/jason-barnard.md`. That dossier notes its quotes came from WebFetch extraction; re-open before public use. I did not re-open them here.
- Darren Shaw: Whitespark blog 7 Jan 2025 (opened again here, matches), Local Search Ranking Factors 2026 (opened again, scores verified). From `.agent/seo-panel/darren-shaw.md`.
- Lily Ray, Cyrus Shepard, Rand Fishkin: quotes reused from their dossiers, not re-opened. Mike King's leak post claim that Google has a "siteAuthority" feature was left out on purpose: it is disputed and would blur the "Google does not use DR" framing. Link: https://ipullrank.com/google-algo-leak (not re-opened).

## NOT FOUND
- A primary Google statement that links from a business's own page to review profiles or press count for anything. Looked in: Search Central docs, QRG sections 3.3.1-3.3.5, How Search works. The guidelines describe off-site reputation only. Our on-site-link check is a proxy.
- Any source on how long links take to build ("Links grow over months"). Looked in: Ahrefs DR article, Google docs. Nothing opened gives a timeframe. Either drop the claim or label it as our experience.
- A measured study (with sample size) that "as seen in" or press logos on a small-business site raise trust or conversion. Looked in: one broad web search; results were vendor blogs (Crazy Egg, Marketeam, Trustpilot and others), not opened, not cited. Only the 2026 Gen Z survey (weak) and the Stanford guidelines (dated) are cited.
- A study on podcasts or professional associations specifically as trust signals for local businesses. Looked in: web search, Whitespark report. Only the QRG "professional societies" line (YMYL) and Whitespark's citation list (AI search, opinion).
- BrightLocal's fieldwork dates and its exact "six sites" wording from raw HTML. The raw fetch failed (connection error). The wording comes from two WebFetch page reads and a search snippet.
- Google's current statement on third-party authority metrics from Google itself. Only Mueller's 2020 tweet via Search Engine Roundtable. I did not open the tweet. The Search Engine Journal page on Mueller's 2018 Reddit AMA does not reproduce his wording.
- A dated Google page version: Search Central and How Search works pages show no date in what I read.
- A Google-published statement on Open PageRank (none expected). The Open PageRank methodology page says nothing about being separate from Google's PageRank.
- Direct panel quotes on Ahrefs DR by name: not in any of the six panel dossiers (their own Not found lists say so).

## Sources
1. Search Quality Rater Guidelines, 11 Sep 2025 (sections 3.3, 3.3.1, 3.3.2, 3.3.3, 3.3.5; downloaded and read as text) — https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf — doc. Section page numbers are not given here because the printed numbers and the table of contents disagreed in my text extraction; cite by section number.
2. Google, How Search works: Ranking results — https://www.google.com/intl/en_us/search/howsearchworks/how-search-works/ranking-results/ — doc (raw HTML)
3. Google Search Central, Creating helpful, reliable, people-first content — https://developers.google.com/search/docs/fundamentals/creating-helpful-content — doc (raw HTML)
4. Google Search Central, Ranking systems guide — https://developers.google.com/search/docs/appearance/ranking-systems-guide — doc (raw HTML for PageRank sentence; remainder via page extraction)
5. Search Engine Roundtable, Google Still Uses PageRank & No, Google Does Not Use Domain Authority (Mueller, Feb 2020) — https://www.seroundtable.com/google-still-uses-pagerank-29056.html — news
6. Ahrefs, Domain Rating (Tim Soulo, 4 May 2022) — https://ahrefs.com/blog/domain-rating/ — vendor doc
7. Open PageRank methodology — https://openpagerank.keywordseverywhere.com/methodology — vendor doc
8. BrightLocal, Local Consumer Review Survey 2026 — https://www.brightlocal.com/research/local-consumer-review-survey/ — survey
9. Whitespark, Local Search Ranking Factors 2026 — https://whitespark.ca/local-search-ranking-factors/ — expert survey
10. Whitespark, 3 Ways to Diversify Your Local Business Reviews — https://whitespark.ca/blog/3-ways-to-diversify-your-local-business-reviews/ — blog
11. We Are Talker, Gen Z trust reviews and independent research — https://wearetalker.com/gen-z-trust-reviews-and-independent-research-more-than-influencers-when-evaluating-brands/ — survey (PR publisher)
12. Stanford Web Credibility Project, Guidelines — http://credibility.stanford.edu/guidelines/index.html — research (dated)
13. Panel dossiers (reused, not re-opened except where stated) — c:\Users\Blog Hands\.antigravity\.agent\seo-panel\ (jason-barnard.md, darren-shaw.md, lily-ray.md, cyrus-shepard.md, rand-fishkin.md, mike-king.md)
