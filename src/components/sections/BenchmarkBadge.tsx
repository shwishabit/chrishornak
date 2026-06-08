'use client'

import { TrendingUp, Users } from 'lucide-react'
import { BENCHMARK_MIN_N } from '@/lib/benchmark-config'

interface BenchmarkBadgeProps {
  n: number
  betterThanPct: number | null
}

/** Per-result standing vs. the corpus. Below BENCHMARK_MIN_N completed audits,
 *  shows an honest "N sites checked" counter — no percentile claim. At/above the
 *  floor, shows the comparative percentile. Renders nothing on an empty corpus. */
export function BenchmarkBadge({ n, betterThanPct }: BenchmarkBadgeProps) {
  if (!n || n < 1) return null

  const gated = n < BENCHMARK_MIN_N || betterThanPct == null

  return (
    <a
      href="/audit/benchmarks"
      className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground"
    >
      {gated ? (
        <>
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>
            One of <span className="font-semibold text-foreground">{n.toLocaleString()}</span> sites checked so far
          </span>
        </>
      ) : (
        <>
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span>
            Better than <span className="font-semibold text-primary">{betterThanPct}%</span> of the{' '}
            {n.toLocaleString()} sites checked
          </span>
        </>
      )}
      <span className="text-primary/60">→</span>
    </a>
  )
}
