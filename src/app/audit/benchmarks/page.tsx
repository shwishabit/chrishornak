import type { Metadata } from 'next'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { getBenchmarkStats, getTopIssues } from '@/lib/audit-stats'
import { BENCHMARK_MIN_N, CATEGORY_ORDER } from '@/lib/benchmark-config'
import { scoreColor } from '@/lib/audit-scoring'
import { TopIssuesList } from '@/components/sections/TopIssuesList'
import { DistributionChart } from '@/components/sections/DistributionChart'

// Always read fresh aggregates.
export const revalidate = 0

export const metadata: Metadata = {
  title: 'The State of Small Business Findability',
  alternates: { canonical: '/audit/benchmarks' },
  description:
    'Real findability data from small business websites: average and median scores, the issues almost everyone misses, and how the seven signals stack up.',
  openGraph: {
    type: 'article',
    title: 'The State of Small Business Findability',
    description:
      'What we see when we score small business websites: the typical score, the most common gaps, and where the signal breaks down.',
    images: [{ url: '/images/og-image-audit.png', width: 1200, height: 630, alt: 'The State of Small Business Findability' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The State of Small Business Findability',
    description:
      'What we see when we score small business websites: the typical score, the most common gaps, and where the signal breaks down.',
    images: ['/images/og-image-audit.png'],
  },
}

const round = (n: number | null) => (n == null ? null : Math.round(n))

export default async function BenchmarksPage() {
  const [stats, topIssues] = await Promise.all([getBenchmarkStats(), getTopIssues(100)])

  const n = stats?.n ?? 0
  const hasData = !!stats && n > 0
  const gated = n < BENCHMARK_MIN_N

  const avg = round(stats?.avg ?? null)
  const median = round(stats?.median ?? null)
  const topIssue = topIssues[0]

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      <div className="relative px-6 pt-36 pb-24 md:pt-40 md:px-12 lg:px-24">
        <div className="mx-auto w-full max-w-3xl">
          {/* ── Header ─────────────────────────────────────────────── */}
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Findability Benchmarks
          </p>

          {!hasData ? (
            <>
              <h1 className="mt-4 font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl">
                The small business findability benchmark is warming up.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Not enough sites have been checked yet to publish a benchmark.
                Run the Findability Check on your own site and you&apos;ll be one
                of the first in the dataset.
              </p>
              <a
                href="/audit"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/20"
              >
                Check your site &rarr;
              </a>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl">
                {gated ? (
                  <>What {n.toLocaleString()} small business sites tell us about being found.</>
                ) : (
                  <>Most small business websites score {median}. Here&apos;s where they break down.</>
                )}
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Every site checked here gets the same scan: seven signals, dozens of
                checks, one score out of 100. Across the{' '}
                <span className="font-semibold text-foreground">{n.toLocaleString()}</span> sites
                we&apos;ve measured so far, the average is{' '}
                <span className="font-semibold text-foreground">{avg}</span>
                {median != null && <> and the median is <span className="font-semibold text-foreground">{median}</span></>}.
                {topIssue && (
                  <> The single most common gap: <span className="font-semibold text-foreground">{topIssue.label.toLowerCase()}</span>, on {topIssue.pct}% of them.</>
                )}
              </p>

              {/* ── Headline numbers ───────────────────────────────── */}
              <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Average score', value: avg },
                  { label: 'Median score', value: median },
                  { label: 'Sites checked', value: n.toLocaleString() },
                  { label: 'Range', value: stats?.min != null && stats?.max != null ? `${round(stats.min)}–${round(stats.max)}` : '—' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 active:scale-95"
                  >
                    <div className="font-heading text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Distribution ───────────────────────────────────── */}
              {stats && stats.distribution.length > 0 && (
                <section className="mt-16">
                  <h2 className="font-heading text-xl font-bold md:text-2xl">How the scores spread</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The number of sites in each 10-point band{median != null && <> — half score above {median}, half below</>}.
                  </p>
                  <DistributionChart distribution={stats.distribution} n={n} />
                </section>
              )}

              {/* ── Top issues ─────────────────────────────────────── */}
              {topIssues.length > 0 && (
                <section className="mt-16">
                  <h2 className="font-heading text-xl font-bold md:text-2xl">
                    The things almost everyone misses
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Ranked by how many of the checked sites trip on them.
                  </p>
                  <TopIssuesList issues={topIssues} />
                </section>
              )}

              {/* ── Category averages ──────────────────────────────── */}
              {stats && Object.keys(stats.categoryAvgs).length > 0 && (
                <section className="mt-16">
                  <h2 className="font-heading text-xl font-bold md:text-2xl">Where the signal is weakest</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Average score in each of the seven categories.
                  </p>
                  <div className="mt-6 space-y-2.5">
                    {CATEGORY_ORDER.filter((c) => stats.categoryAvgs[c] != null)
                      .map((cat) => ({ cat, score: Math.round(stats.categoryAvgs[cat]) }))
                      .sort((a, b) => a.score - b.score)
                      .map(({ cat, score }) => (
                        <div key={cat} className="group -mx-2 flex items-center gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-muted/10">
                          <span className="w-28 shrink-0 text-sm text-muted-foreground transition-colors group-hover:text-foreground">{cat}</span>
                          <div
                            role="meter"
                            aria-valuenow={score}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${cat} average score: ${score} out of 100`}
                            className="h-2 flex-1 overflow-hidden rounded-full bg-muted/40"
                          >
                            <div className={`h-full ${scoreColor(score).bg} opacity-80 transition-opacity duration-300 group-hover:opacity-100`} style={{ width: `${score}%` }} />
                          </div>
                          <span className={`w-8 shrink-0 text-right text-sm font-semibold ${scoreColor(score).text} transition-transform group-hover:scale-110`}>{score}</span>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* ── Methodology / sample disclosure ────────────────── */}
              <section className="mt-16 rounded-xl border border-border/30 bg-muted/10 p-5">
                <h2 className="text-sm font-semibold text-foreground">About this data</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Each site is scored by the same{' '}
                  <a href="/audit" className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">Findability Check</a>{' '}
                  anyone can run — seven weighted categories covering search, AI readiness, social, mobile,
                  structure, accessibility, and security. The benchmark draws on real small business websites
                  across the U.S. — local restaurants, shops, auto and home services, medical and professional
                  practices, and independent makers, spanning small and mid-size cities — and grows with every
                  public check. It&apos;s a real but non-random sample, not a national census, and individual
                  sites are never published, only the aggregate.
                  {gated && (
                    <> Comparative percentiles (&ldquo;you beat X% of sites&rdquo;) switch on once the dataset passes {BENCHMARK_MIN_N} sites.</>
                  )}
                </p>
              </section>

              {/* ── CTA ────────────────────────────────────────────── */}
              <section className="mt-12 text-center">
                <h2 className="font-heading text-xl font-bold md:text-2xl">See where your site lands.</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Free, instant, no signup. You&apos;ll get your score and the specific gaps to fix first.
                </p>
                <a
                  href="/audit"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/20"
                >
                  Check your site &rarr;
                </a>
              </section>
            </>
          )}
        </div>
      </div>

      <Footer />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
            { '@type': 'ListItem', position: 2, name: 'Findability Check', item: `${siteConfig.domain}/audit` },
            { '@type': 'ListItem', position: 3, name: 'Benchmarks', item: `${siteConfig.domain}/audit/benchmarks` },
          ],
        }}
      />
      {hasData && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: 'Small Business Findability Benchmark',
            description:
              'Aggregate findability scores from small business websites — average and median scores out of 100, score distribution, the most common issues, and per-category averages across seven signals.',
            url: `${siteConfig.domain}/audit/benchmarks`,
            creator: { '@type': 'Person', name: 'Chris Hornak', url: siteConfig.domain },
            isAccessibleForFree: true,
            variableMeasured: 'Website findability score (0–100)',
            measurementTechnique: 'Automated on-page analysis across search, AI, social, mobile, structure, accessibility, and security signals',
            dateModified: new Date().toISOString().slice(0, 10),
          }}
        />
      )}
    </main>
  )
}
