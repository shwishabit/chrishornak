'use client'

import { useState } from 'react'
import {
  Search,
  Globe,
  Code2,
  ShieldCheck,
  Smartphone,
  BotMessageSquare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

const categories = [
  { icon: <Search className="h-3.5 w-3.5" />, label: 'Search', score: 75, pass: 4, total: 6 },
  { icon: <BotMessageSquare className="h-3.5 w-3.5" />, label: 'AI', score: 25, pass: 1, total: 6 },
  { icon: <Globe className="h-3.5 w-3.5" />, label: 'Social', score: 50, pass: 2, total: 5 },
  { icon: <Smartphone className="h-3.5 w-3.5" />, label: 'Mobile', score: 80, pass: 5, total: 6 },
  { icon: <Code2 className="h-3.5 w-3.5" />, label: 'Structure', score: 58, pass: 3, total: 6 },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Security', score: 58, pass: 3, total: 6 },
]

export function AuditPreview() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="mx-auto max-w-3xl cursor-default select-none"
      aria-hidden="true"
      onClick={() => setExpanded((prev) => !prev)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`relative overflow-hidden rounded-xl border transition-all duration-500 ${
          expanded ? 'max-h-[600px] border-border/30 bg-muted/15' : 'max-h-[140px] border-border/30 bg-muted/15'
        }`}
      >
        {/* Fade overlay when collapsed */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-linear-to-t from-background to-transparent transition-opacity duration-500 ${
            expanded ? 'opacity-0' : 'opacity-100'
          }`}
        />

        <div className={`p-5 transition-[filter,opacity] duration-500 ${expanded ? 'blur-0 opacity-100' : 'blur-[2px] opacity-70'}`}>
          {/* Score header */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <svg className="-rotate-90" width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/40" />
                <circle
                  cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5"
                  strokeLinecap="round" className="text-amber-400/50"
                  strokeDasharray="163" strokeDashoffset="75"
                />
              </svg>
              <span className="absolute font-heading text-base font-bold text-amber-400/70">54</span>
            </div>
            <div className="flex-1">
              <p className="font-heading text-sm font-bold text-foreground/80">Findability Score</p>
              <p className="mt-0.5 text-xs text-muted-foreground/50">yourbusiness.com</p>
              <div className="mt-2 flex gap-4">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400/70">
                  <CheckCircle2 className="h-3 w-3" /> 19 passed
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-400/70">
                  <AlertTriangle className="h-3 w-3" /> 8 warnings
                </span>
                <span className="flex items-center gap-1 text-[11px] text-red-400/70">
                  <XCircle className="h-3 w-3" /> 8 failed
                </span>
              </div>
            </div>
          </div>

          {/* Category rows */}
          <div className="mt-5 divide-y divide-border/15 rounded-lg border border-border/15">
            {categories.map((cat) => {
              const barColor = cat.score >= 75 ? 'bg-emerald-400/40' : cat.score >= 40 ? 'bg-amber-400/40' : 'bg-red-400/40'
              return (
                <div key={cat.label} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/30 text-muted-foreground/40">
                    {cat.icon}
                  </span>
                  <span className="w-24 shrink-0 text-xs text-muted-foreground/60">{cat.label}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-muted/30">
                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${cat.score}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground/40">
                    {cat.pass}/{cat.total}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
