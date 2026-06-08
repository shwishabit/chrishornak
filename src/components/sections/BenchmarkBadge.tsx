'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BENCHMARK_MIN_N } from '@/lib/benchmark-config'

interface BenchmarkBadgeProps {
  score: number
  n: number
  avg: number | null
  betterThanPct: number | null
}

/** Compares a fresh score against the live benchmark. Shows the gap vs. the
 *  average site, plus a percentile once the corpus passes BENCHMARK_MIN_N.
 *  Renders nothing on an empty corpus. */
export function BenchmarkBadge({ score, n, avg, betterThanPct }: BenchmarkBadgeProps) {
  if (!n || n < 1) return null

  const gated = n < BENCHMARK_MIN_N || betterThanPct == null
  const delta = avg != null ? score - avg : null
  const Icon = delta == null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown
  const tone =
    delta == null || delta === 0 ? 'text-muted-foreground' : delta > 0 ? 'text-emerald-400' : 'text-amber-400'

  return (
    <a
      href="/audit/benchmarks"
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground"
    >
      <Icon className={`h-3.5 w-3.5 ${tone}`} />
      <span>
        {avg != null && delta != null ? (
          delta === 0 ? (
            <>Right at the <span className="font-semibold text-foreground">{avg}</span> average</>
          ) : (
            <>
              <span className={`font-semibold ${tone}`}>
                {Math.abs(delta)} point{Math.abs(delta) !== 1 ? 's' : ''} {delta > 0 ? 'above' : 'below'}
              </span>{' '}
              the <span className="font-semibold text-foreground">{avg}</span> average
            </>
          )
        ) : (
          <>Compared to the benchmark</>
        )}
        {gated ? (
          <> · {n.toLocaleString()} sites checked</>
        ) : (
          <> · better than <span className="font-semibold text-primary">{betterThanPct}%</span></>
        )}
      </span>
      <span className="text-primary/60">→</span>
    </a>
  )
}
