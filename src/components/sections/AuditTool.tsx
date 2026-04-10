'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  Info,
  X,
  ChevronDown,
  ArrowLeft,
  Code2,
  Globe,
  ShieldCheck,
  Smartphone,
  BotMessageSquare,
  Share2,
  Link,
  Accessibility,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fadeUp, stagger, ease } from '@/lib/animations'
import {
  type Status,
  type AuditItem,
  type AuditCategory,
  type AuditResult,
  CATEGORY_WEIGHTS,
  scoreColor,
  computeOverallScore,
  computeCategoryScore,
  rankCategories,
} from '@/lib/audit-scoring'
import { parseAudit, type FetchedPage } from '@/lib/audit-parser'
import { getPreviousResult, saveAuditResult, type AuditHistoryEntry } from '@/lib/audit-history'

/* ── Category icon map ───────────────────────────────────────────────── */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Search': <Search className="h-4 w-4" />,
  'AI': <BotMessageSquare className="h-4 w-4" />,
  'Social': <Globe className="h-4 w-4" />,
  'Mobile': <Smartphone className="h-4 w-4" />,
  'Structure': <Code2 className="h-4 w-4" />,
  'Accessibility': <Accessibility className="h-4 w-4" />,
  'Security': <ShieldCheck className="h-4 w-4" />,
}

/* ── Typewriter placeholder ───────────────────────────────────────────────── */

const EXAMPLE_DOMAINS = [
  'mybusiness.com',
  'localshop.co',
  'yourbrand.com',
  'bestpizza.com',
  'janesmith.dev',
]

function useTypingPlaceholder(domains: string[]) {
  const [text, setText] = useState('')
  const idx = useRef(0)
  const phase = useRef<'typing' | 'pausing' | 'deleting'>('typing')
  const charPos = useRef(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      const domain = domains[idx.current]

      if (phase.current === 'typing') {
        charPos.current++
        setText(domain.slice(0, charPos.current))
        if (charPos.current >= domain.length) {
          phase.current = 'pausing'
          timer = setTimeout(tick, 2000)
        } else {
          timer = setTimeout(tick, 70 + Math.random() * 40)
        }
      } else if (phase.current === 'pausing') {
        phase.current = 'deleting'
        timer = setTimeout(tick, 30)
      } else {
        charPos.current--
        setText(domain.slice(0, charPos.current))
        if (charPos.current <= 0) {
          idx.current = (idx.current + 1) % domains.length
          phase.current = 'typing'
          timer = setTimeout(tick, 2000)
        } else {
          timer = setTimeout(tick, 30)
        }
      }
    }

    // Blink for 4s before first domain starts typing
    timer = setTimeout(tick, 4000)
    return () => clearTimeout(timer)
  }, [domains])

  return text
}

/* ── Status icon ──────────────────────────────────────────────────────────── */

function StatusIcon({ status }: { status: Status }) {
  if (status === 'pass')
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
  if (status === 'warn')
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
  return <XCircle className="h-4 w-4 shrink-0 text-red-400" />
}

/* ── Score ring ───────────────────────────────────────────────────────────── */

function ScoreRing({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = scoreColor(score).text

  return (
    <div className="relative inline-flex h-36 w-36 items-center justify-center">
      <svg className="-rotate-90" width="136" height="136" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/50"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={color}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <span className={`absolute font-heading text-3xl font-bold ${color}`}>
        {score}
      </span>
    </div>
  )
}

/* ── Category score bar ───────────────────────────────────────────────────── */

function CategoryScoreBar({ items, muted = false }: { items: AuditItem[]; muted?: boolean }) {
  const total = items.length
  const passes = items.filter((i) => i.status === 'pass').length
  const warns = items.filter((i) => i.status === 'warn').length
  const fails = items.filter((i) => i.status === 'fail').length

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
        {passes > 0 && (
          <div
            className={`transition-all duration-500 ${muted ? 'bg-muted-foreground/30' : 'bg-emerald-400'}`}
            style={{ width: `${(passes / total) * 100}%` }}
          />
        )}
        {warns > 0 && (
          <div
            className={`transition-all duration-500 ${muted ? 'bg-muted-foreground/18' : 'bg-amber-400'}`}
            style={{ width: `${(warns / total) * 100}%` }}
          />
        )}
        {fails > 0 && (
          <div
            className={`transition-all duration-500 ${muted ? 'bg-muted-foreground/10' : 'bg-red-400'}`}
            style={{ width: `${(fails / total) * 100}%` }}
          />
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {passes}/{total}
      </span>
    </div>
  )
}

/* ── Audit item row ───────────────────────────────────────────────────────── */

function AuditItemRow({ item }: { item: AuditItem }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <StatusIcon status={item.status} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-foreground">{item.label}</span>
          <span className="text-xs text-muted-foreground">{item.value}</span>
        </div>
        {item.extracted && (
          <pre className="mt-1.5 overflow-hidden whitespace-pre-wrap break-all rounded-md border border-border/30 bg-muted/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {item.extracted}
          </pre>
        )}
        {item.recommendation && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/80">
            {item.recommendation}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Category summary sentence ─────────────────────────────────────────── */

const CATEGORY_SUMMARIES: Record<string, { good: string; minor: string; major: string }> = {
  'Search': {
    good: 'Google can find, access, and understand your pages',
    minor: 'Small SEO gaps that could cost you search impressions',
    major: 'Critical issues preventing Google from properly indexing your pages',
  },
  'AI': {
    good: 'Well-positioned for AI-powered search',
    minor: 'Missing signals that help AI tools cite your content',
    major: 'Few signals for AI tools to reference your content',
  },
  'Social': {
    good: 'Your page looks great in search results and social shares',
    minor: 'Shared links are missing some polish',
    major: 'Shared links are missing key elements',
  },
  'Mobile': {
    good: 'Your site is well set up for mobile visitors',
    minor: 'Small mobile experience issues worth fixing',
    major: 'Mobile visitors are likely having a poor experience',
  },
  'Structure': {
    good: 'Well-structured content and healthy link profile',
    minor: 'Some content and link issues could work harder for your SEO',
    major: 'Structure and link problems that make it harder for search engines',
  },
  'Security': {
    good: 'Your site looks safe and trustworthy to visitors',
    minor: 'Minor security gaps that could affect trust',
    major: 'Security issues that put visitor trust at risk',
  },
  'Accessibility': {
    good: 'Your site is well-structured for assistive technology',
    minor: 'Some accessibility gaps that could exclude visitors',
    major: 'Accessibility issues that make your site hard to use for many people',
  },
}

function categorySummary(name: string, items: AuditItem[]): string {
  const fails = items.filter((i) => i.status === 'fail').length
  const warns = items.filter((i) => i.status === 'warn').length
  const summaries = CATEGORY_SUMMARIES[name]

  if (!summaries) return ''
  if (fails === 0 && warns === 0) return summaries.good
  if (fails === 0) return summaries.minor
  return summaries.major
}

/* ── Collapsible passes row ───────────────────────────────────────────────── */

function PassedChecksRow({ items }: { items: AuditItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const passed = items.filter((i) => i.status === 'pass')

  if (passed.length === 0) return null

  return (
    <div className="border-t border-border/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-6 py-3 text-left transition-colors hover:bg-muted/20"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span className="text-sm text-emerald-400">
          {passed.length} check{passed.length > 1 ? 's' : ''} passed
        </span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/10 px-6 pb-2">
              {passed.map((item) => (
                <div key={item.label} className="py-3">
                  <AuditItemRow item={item} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Methodology modal ────────────────────────────────────────────────────── */

const methodologyCategories = [
  {
    name: 'Search',
    weight: 25,
    why: 'Can search engines find you? If they can\'t find, access, and index your page, nothing else matters. We check indexability (the single most critical signal — if this fails, the whole category scores zero), your page title, meta description, canonical URL, crawl permissions, sitemap, URL redirects, and response time.',
    sources: 'Google Search Central, Moz Beginner\'s Guide to SEO',
  },
  {
    name: 'AI',
    weight: 25,
    why: 'Does AI know you exist? AI-powered search (Google AI Overviews, ChatGPT, Perplexity) is the fastest-growing way people find businesses. We check structured data (including schema depth validation), Q&A content, trust signals, citability, entity clarity, business description, whether AI crawlers can access your site, and whether you have an llms.txt file. This is where most sites have the biggest gap today.',
    sources: 'Authoritas GEO Study (2024), Princeton LLM Citation Research, Schema.org',
  },
  {
    name: 'Social',
    weight: 10,
    why: 'Do you look good when shared? Open Graph and Twitter Card tags control how your links appear when shared on Facebook, LinkedIn, Bluesky, and X. Social profile links help search engines connect your brand across the web. These don\'t directly affect Google rankings, but they drive the traffic and engagement that does.',
    sources: 'Facebook Open Graph Protocol, X Developer Documentation',
  },
  {
    name: 'Mobile',
    weight: 10,
    why: 'Does it work on their phone? Google has used mobile-first indexing as the default since 2023, meaning it primarily uses the mobile version of your site for ranking. We check viewport configuration, HTML5 standards, tap target spacing, text readability, and image formats. If your site doesn\'t work well on phones, it doesn\'t work well in Google.',
    sources: 'Google Mobile-First Indexing Documentation, Google Search Central',
  },
  {
    name: 'Structure',
    weight: 20,
    why: 'Is your page well-built? Proper heading hierarchy helps Google understand your topic. Image descriptions are an accessibility requirement and a ranking signal. Internal links distribute ranking power across your site. Content depth determines whether search engines and AI have enough to work with.',
    sources: 'Ahrefs Featured Snippet Research, SEMrush Ranking Factors, WCAG 2.1 Guidelines',
  },
  {
    name: 'Accessibility',
    weight: 10,
    why: 'Can everyone use your site? About 1 in 4 adults has a disability. If your site isn\'t accessible, you\'re invisible to a quarter of your potential audience — and potentially out of ADA compliance. We check whether screen readers can navigate your page (landmarks, labels, language), whether keyboard users can see what\'s focused, and whether links make sense out of context.',
    sources: 'WCAG 2.1 AA Guidelines, ADA Title III, CDC Disability Statistics',
  },
  {
    name: 'Security',
    weight: 10,
    why: 'Do visitors trust your site? HTTPS has been a Google ranking signal since 2014, and Chrome marks non-HTTPS sites as "Not Secure." We also check for mixed content, whether external links are safe, whether forms submit data securely, and whether a Content Security Policy is in place. Visitors — and search engines — trust secure sites more.',
    sources: 'Google HTTPS Ranking Signal (2014), Chrome Security Indicators, OWASP Guidelines',
  },
]

function MethodologyModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Focus the modal on mount
    modalRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        ref={modalRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease }}
        className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/30 bg-background p-6 shadow-2xl outline-none md:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold">How the score works</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your score is a weighted average across 7 categories covering
              SEO fundamentals, AI search readiness, and accessibility. Categories
              that have a bigger impact on your visibility are worth more points.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scoring method */}
        <div className="mt-6 rounded-xl border border-border/30 bg-muted/20 p-4">
          <h3 className="text-sm font-semibold text-foreground">Scoring method</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Each check on your page earns a status: <span className="text-emerald-400">pass</span> (full
            credit), <span className="text-amber-400">warning</span> (half credit),
            or <span className="text-red-400">fail</span> (no credit). Your category
            score is the percentage of total credit earned. Your overall score
            is the weighted average of all categories — so fixing a fail in a
            high-weight category moves your score more than fixing one in a
            low-weight category.
          </p>
        </div>

        {/* Category weights */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Category weights and why they matter
          </h3>
          {methodologyCategories.map((cat) => (
            <div
              key={cat.name}
              className="rounded-xl border border-border/30 bg-muted/10 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {cat.name}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {cat.weight}%
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {cat.why}
              </p>
              <p className="mt-1.5 text-[11px] italic text-muted-foreground/60">
                Sources: {cat.sources}
              </p>
            </div>
          ))}
        </div>

        {/* Limitations */}
        <div className="mt-6 rounded-xl border border-border/30 bg-muted/10 p-4">
          <h3 className="text-sm font-semibold text-foreground">What this doesn&apos;t cover</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This checks what&apos;s on your page right now. The deeper factors below also affect how you rank and get found — and that&apos;s where a strategist comes in.
          </p>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li><span className="font-semibold text-foreground">Page speed &amp; Core Web Vitals</span> — How fast your site loads and responds. Google uses this as a ranking signal.</li>
            <li><span className="font-semibold text-foreground">Backlink authority</span> — Who links to you and how much trust that carries. One of the strongest ranking factors.</li>
            <li><span className="font-semibold text-foreground">Keyword strategy</span> — Whether you&apos;re targeting the right terms and how you stack up against competitors.</li>
            <li><span className="font-semibold text-foreground">Content quality</span> — Whether your copy is compelling and converts, not just whether it exists.</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            <a href="/#connect" className="font-semibold text-primary transition-colors duration-200 hover:text-primary/80">
              Let&apos;s figure out what&apos;s next&nbsp;&rarr;
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */

const OVERVIEW_TAB = 'Overview'

interface AuditToolProps {
  onResult?: (hasResult: boolean) => void
}

export function AuditTool({ onResult }: AuditToolProps = {}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [activeTab, setActiveTab] = useState(OVERVIEW_TAB)
  const [showMethodology, setShowMethodology] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [progressStep, setProgressStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [previousResult, setPreviousResult] = useState<AuditHistoryEntry | null>(null)
  const hasAutoRun = useRef(false)
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typedPlaceholder = useTypingPlaceholder(EXAMPLE_DOMAINS)

  // Show animated placeholder + cursor when empty, not focused, and no result
  const showAnimatedPlaceholder = !url && !inputFocused && !result && !loading

  const MAX_URL_LENGTH = 2000
  const COOLDOWN_MS = 5000
  const [, forceRender] = useState(0)
  const onCooldown = Date.now() < cooldownUntil

  // Re-render when cooldown expires to re-enable the button
  useEffect(() => {
    if (!cooldownUntil) return
    const remaining = cooldownUntil - Date.now()
    if (remaining <= 0) return
    const timer = setTimeout(() => forceRender((n) => n + 1), remaining)
    return () => clearTimeout(timer)
  }, [cooldownUntil])

  // Auto-run if ?url= query param is present
  useEffect(() => {
    if (hasAutoRun.current) return
    const params = new URLSearchParams(window.location.search)
    const queryUrl = params.get('url')
    if (queryUrl) {
      hasAutoRun.current = true
      setUrl(queryUrl)
      // Trigger submit after state update
      setTimeout(() => {
        const form = document.querySelector<HTMLFormElement>('[data-audit-form]')
        form?.requestSubmit()
      }, 100)
    }
  }, [])

  function getShareUrl(): string {
    const domain = url.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
    return `${window.location.origin}/audit?url=${encodeURIComponent(domain)}`
  }

  async function handleShare() {
    const shareUrl = getShareUrl()
    const score = result ? computeOverallScore(result.categories) : 0
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Native share only on mobile (desktop share dialogs are clunky)
    if (isMobile && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Findability Check`,
          text: `I scored ${score} on the Findability Check. See how your site stacks up:`,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function normalizeUrl(input: string): string {
    let cleaned = input.trim()
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'https://' + cleaned
    }
    return cleaned
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || onCooldown) return

    if (url.trim().length > MAX_URL_LENGTH) {
      setError('That URL is too long. Try a shorter one.')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)
    setPreviousResult(null)
    setActiveTab(OVERVIEW_TAB)
    setProgressStep(0)

    const normalized = normalizeUrl(url)

    // Progress step timers
    const step1 = setTimeout(() => setProgressStep(1), 1500)
    const step2 = setTimeout(() => setProgressStep(2), 3500)

    // Abort if the API takes too long (large sites may have slow sitemaps)
    const controller = new AbortController()
    const fetchTimeout = setTimeout(() => controller.abort(), 20_000)

    try {
      const res = await fetch(
        `/api/audit?url=${encodeURIComponent(normalized)}`,
        { signal: controller.signal },
      )
      clearTimeout(fetchTimeout)
      const data = await res.json()
      clearTimeout(step1)
      clearTimeout(step2)

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong fetching that URL.')
        setLoading(false)
        return
      }

      const page: FetchedPage = data
      const parsed = parseAudit(page)

      const auditResult: AuditResult = {
        url: parsed.url,
        categories: parsed.categories.map((cat) => ({
          ...cat,
          icon: CATEGORY_ICONS[cat.name] ?? <Search className="h-4 w-4" />,
        })),
      }

      setResult(auditResult)
      onResult?.(true)

      // Before/after tracking — load previous, then save current
      const prev = getPreviousResult(normalized)
      setPreviousResult(prev)

      const overall = computeOverallScore(auditResult.categories)
      const catScores: Record<string, number> = {}
      for (const cat of rankCategories(auditResult.categories)) {
        catScores[cat.name] = cat.score
      }
      saveAuditResult(normalized, overall, catScores)

      // Update URL for sharing
      const domain = normalized.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
      window.history.replaceState(null, '', `/audit?url=${encodeURIComponent(domain)}`)
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'That site took too long to respond. It may be blocking automated requests.'
          : 'Couldn\u2019t reach that site. Double-check the URL and try again \u2014 or drop me a message and I\u2019ll take a look.'
      setError(msg)
    } finally {
      clearTimeout(fetchTimeout)
      setLoading(false)
      setCooldownUntil(Date.now() + COOLDOWN_MS)
    }
  }

  // Computed scores
  const overallScore = result ? computeOverallScore(result.categories) : 0
  const ranked = result ? rankCategories(result.categories) : []
  const bestCategory = ranked.length > 0
    ? [...ranked].sort((a, b) => b.score - a.score || b.weight - a.weight)[0]
    : null
  const worstCategory = ranked.length > 0
    ? [...ranked].sort((a, b) => a.score - b.score || b.weight - a.weight)[0]
    : null
  const worstItem = worstCategory?.items.find((i) => i.status === 'fail')
    ?? worstCategory?.items.find((i) => i.status === 'warn')

  const allItems = result?.categories.flatMap((c) => c.items) ?? []
  const passes = allItems.filter((i) => i.status === 'pass').length
  const warns = allItems.filter((i) => i.status === 'warn').length
  const fails = allItems.filter((i) => i.status === 'fail').length

  const tabs = result
    ? [OVERVIEW_TAB, ...result.categories.map((c) => c.name)]
    : []

  const activeCategory = result?.categories.find((c) => c.name === activeTab)
  const activeCategoryScore = activeCategory ? computeCategoryScore(activeCategory) : 0

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* ── Methodology modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMethodology && (
          <MethodologyModal onClose={() => setShowMethodology(false)} />
        )}
      </AnimatePresence>

      {/* ── Input form ─────────────────────────────────────────────────── */}
      <motion.form
        data-audit-form
        onSubmit={handleSubmit}
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, ease }}
        className={`glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-3 ${!result && !loading ? 'audit-form-glow' : ''}`}
      >
        <div
          className="relative flex-1 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={inputFocused ? 'mybusiness.com' : ''}
            aria-label="Website URL"
            maxLength={MAX_URL_LENGTH}
            required
            className="h-11 w-full rounded-lg border border-border/50 bg-muted/50 pl-10 pr-4 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none selection:bg-primary/30 selection:text-foreground"
          />
          {/* Animated typewriter placeholder */}
          {showAnimatedPlaceholder && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center pl-10 pr-4"
              aria-hidden="true"
            >
              <span className="text-base md:text-sm text-muted-foreground">
                <span className="text-muted-foreground/50">try </span>{typedPlaceholder}
                <motion.span
                  className="inline-block w-[8px] h-[1em] align-middle ml-px rounded-sm"
                  style={{ backgroundColor: '#2dd4a8' }}
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5] }}
                />
              </span>
            </div>
          )}
        </div>
        <Button type="submit" size="md" isLoading={loading} disabled={loading || onCooldown} className="shrink-0">
          {loading ? 'Analyzing…' : 'Check findability'}
        </Button>
      </motion.form>
      {!loading && !result && !error && (
        <p className="mt-3 text-center text-xs text-muted-foreground/80">Usually takes a few seconds</p>
      )}

      {/* ── Loading state ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center gap-3 text-center"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground" key={progressStep}>
              {progressStep === 0 && 'Fetching your site…'}
              {progressStep === 1 && 'Analyzing findability…'}
              {progressStep === 2 && 'Building your report…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 rounded-xl border border-border/30 bg-muted/15 p-6 text-center"
          >
            <p className="text-sm text-foreground">{error}</p>
            <a
              href="/#connect"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              Get in touch &rarr;
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="mt-8"
          >

            {/* ── Tab bar — dropdown on mobile, inline tabs on desktop ── */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease }}
              className="mb-6"
            >
              {/* Mobile: dropdown */}
              <div className="md:hidden">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  aria-label="Audit category"
                  className="w-full appearance-none rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm font-medium text-foreground focus:border-primary/50 focus:outline-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  {tabs.map((tab) => {
                    const rankedCat = ranked.find((c) => c.name === tab)
                    const catScore = rankedCat ? Math.round((rankedCat.items.filter(i => i.status === 'pass').length / rankedCat.items.length) * 100) : 0
                    return (
                      <option key={tab} value={tab}>
                        {tab === OVERVIEW_TAB ? tab : `${tab} — ${catScore}%`}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Desktop: inline tabs */}
              <div className="hidden gap-1.5 md:flex">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab
                  const rankedCat = ranked.find((c) => c.name === tab)
                  const dotColor = rankedCat ? scoreColor(rankedCat.score).dot : ''

                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`relative shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }`}
                    >
                      {tab}
                      {dotColor && !isActive && (
                        <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>

            {/* ── Overview tab ───────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {activeTab === OVERVIEW_TAB && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease }}
                  className="space-y-6"
                >
                  {/* Score card */}
                  <div className="glass-card flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-start sm:gap-10">
                    <div className="relative">
                      <ScoreRing score={overallScore} />
                      {previousResult && overallScore !== previousResult.overall && (
                        <span className={`absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${overallScore > previousResult.overall ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {overallScore > previousResult.overall ? '+' : ''}{overallScore - previousResult.overall}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-heading text-xl font-bold">
                        Findability Score
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground break-all">
                        {result.url}
                      </p>

                      {/* Micro executive summary */}
                      {bestCategory && worstCategory && (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          {overallScore === 100 ? (
                            <>Perfect score across every signal. Your site is well-built and highly findable.</>
                          ) : bestCategory.name === worstCategory.name ? (
                            <>All categories scored similarly{overallScore >= 75 ? ' — solid across the board' : ' — a balanced foundation to build on'}.</>
                          ) : (
                            <>
                              {bestCategory.name} is your strongest area
                              {bestCategory.score >= 75 && ' — looking solid'}.
                              {' '}Your biggest opportunity is{' '}
                              <button
                                onClick={() => setActiveTab(worstCategory.name)}
                                className="font-semibold text-foreground underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
                              >
                                {worstCategory.name}
                              </button>
                              {worstItem && (
                                <> — start with {worstItem.label.toLowerCase()}</>
                              )}
                              .
                            </>
                          )}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 sm:justify-start">
                        <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> {passes} passed
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" /> {warns} warnings
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-red-400">
                          <XCircle className="h-3.5 w-3.5" /> {fails} failed
                        </span>
                      </div>
                      <div className="mt-3">
                        <CategoryScoreBar items={allItems} />
                      </div>
                      <button
                        onClick={() => setShowMethodology(true)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                      >
                        <Info className="h-3 w-3" />
                        How this score works
                      </button>
                    </div>
                  </div>

                  {/* Category list */}
                  <div className="glass-card divide-y divide-border/20 overflow-hidden">
                    {ranked.map((category) => {
                      const catScoreVal = category.score
                      const iconColor = scoreColor(catScoreVal).ring

                      return (
                      <button
                        key={category.name}
                        onClick={() => setActiveTab(category.name)}
                        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/20"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/10 group-hover:text-primary ${iconColor}`}>
                          {category.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-heading text-sm font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                                {category.name}
                                {previousResult?.categories[category.name] != null && category.score !== previousResult.categories[category.name] && (
                                  <span className={`ml-1.5 text-xs font-medium ${category.score > previousResult.categories[category.name] ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {category.score > previousResult.categories[category.name] ? '+' : ''}{Math.round(category.score - previousResult.categories[category.name])}
                                  </span>
                                )}
                              </span>
                              <span className="ml-2 shrink-0 text-xs text-muted-foreground/80 transition-colors group-hover:text-muted-foreground hidden sm:inline">
                                {categorySummary(category.name, category.items)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground/80 sm:hidden">
                              {categorySummary(category.name, category.items)}
                            </p>
                          </div>
                          <div className="mt-2">
                            {/* Mobile: always colored, animate on scroll */}
                            <motion.div
                              className="sm:hidden"
                              initial={{ scaleX: 0 }}
                              whileInView={{ scaleX: 1 }}
                              viewport={{ once: true, margin: '-20px' }}
                              transition={{ duration: 0.6, ease }}
                              style={{ transformOrigin: 'left' }}
                            >
                              <CategoryScoreBar items={category.items} />
                            </motion.div>
                            {/* Desktop: muted, colored on hover */}
                            <div className="hidden transition-opacity group-hover:[&_div]:opacity-100! sm:block">
                              <div className="group-hover:hidden">
                                <CategoryScoreBar items={category.items} muted />
                              </div>
                              <div className="hidden group-hover:block">
                                <CategoryScoreBar items={category.items} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 -rotate-90 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                      </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Category detail tab ──────────────────────────────── */}
              {activeCategory && (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <div className="glass-card overflow-hidden">
                    {/* Category header + summary */}
                    <div className="border-b border-border/30 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          {activeCategory.icon}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h3 className="font-heading text-base font-bold">
                              {activeCategory.name}
                            </h3>
                            <span className={`text-sm font-semibold ${scoreColor(activeCategoryScore).text}`}>
                              {activeCategoryScore}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {CATEGORY_WEIGHTS[activeCategory.name] ?? 5}% of total score
                            </span>
                          </div>
                          <div className="mt-1 max-w-48">
                            <CategoryScoreBar items={activeCategory.items} />
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {categorySummary(activeCategory.name, activeCategory.items)}
                      </p>
                    </div>

                    {/* All items: fails first, then warnings, then passes */}
                    <div className="divide-y divide-border/20 px-6">
                      {[...activeCategory.items]
                        .sort((a, b) => {
                          const order: Record<Status, number> = { fail: 0, warn: 1, pass: 2 }
                          return order[a.status] - order[b.status]
                        })
                        .map((item) => (
                          <div key={item.label} className="py-4">
                            <AuditItemRow item={item} />
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Back to overview */}
                  <button
                    onClick={() => setActiveTab(OVERVIEW_TAB)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to overview
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA — always visible across all tabs */}
            <div className="glass-card mt-6 p-8 text-center">
              <h3 className="font-heading text-lg font-bold">
                Your site scored {overallScore}.{' '}
                {overallScore >= 80
                  ? "Here\u2019s how to build on that."
                  : overallScore >= 50
                    ? "Here\u2019s where I\u2019d start."
                    : "Here\u2019s where I\u2019d start."}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A strong score means you&apos;re findable. The next question is whether visitors are taking action. That&apos;s the conversation.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  data-cal-link="chris-hornak/30min"
                  data-cal-namespace="30min"
                  data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"dark"}'
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-glow"
                >
                  Let&apos;s walk through it
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
                >
                  {copied ? <Link className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                  {copied ? 'Link copied!' : 'Share results'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
