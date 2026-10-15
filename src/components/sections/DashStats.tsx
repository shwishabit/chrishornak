'use client'

import { useState } from 'react'
import type { AdminOverview, DomainLogRow } from '@/lib/admin-audit'
import type { BlogHandsStats, Health, MailAccount } from '@/lib/admin-dashboard'
import type { JobLead } from '@/lib/admin-jobs'
import { CONTRA_JOBS, ago } from '@/lib/dash-format'
import { OutLink, Sparkline } from './DashParts'

/* Key numbers row (v3, 2026-10-15). Order is Chris's: Findability, Blog Hands,
 * Job hunt, Inbox, then f0rmless (secondary, smallest). Click a tile to open its
 * detail panel under the row; click again to close. */

type Id = 'find' | 'bh' | 'jobs' | 'mail' | 'f0'
const n = (v: number) => v.toLocaleString('en-US')

// Blog Hands leads with the most important number that isn't zero.
const BH_ORDER: [keyof BlogHandsStats, string][] = [
  ['signups_7d', 'sign-ups, 7 days'],
  ['active_subs', 'active subscriptions'],
  ['posts_delivered_7d', 'posts delivered, 7 days'],
  ['free_claims_7d', 'free posts claimed, 7 days'],
  ['grader_runs_7d', 'Blog Grader runs, 7 days'],
  ['paid_orders_30d', 'paid orders, 30 days'],
  ['accounts_total', 'accounts, all time'],
]

function scoreClass(s: number) {
  return s >= 85 ? 'bg-primary/15 text-primary' : s >= 70 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'
}

function Kv({ items }: { items: [React.ReactNode, string][] }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(([v, l], i) => (
        <div key={i}>
          <p className="font-heading text-xl font-semibold tabular-nums">{v}</p>
          <p className="text-xs text-muted-foreground">{l}</p>
        </div>
      ))}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border py-2.5 text-[13px] first:border-t-0">{children}</li>
}

export function DashStats({
  overview,
  domains,
  bh,
  jobs,
  newLeads,
  mail,
  mailUpdated,
  health,
}: {
  overview: AdminOverview | null
  domains: DomainLogRow[]
  bh: BlogHandsStats | null
  jobs: { counts: Record<string, number>; pitched7d: number; followupsDue: number }
  newLeads: JobLead[]
  mail: MailAccount[] | null
  mailUpdated?: string
  health: Health | null
}) {
  const [open, setOpen] = useState<Id | null>(null)
  const toggle = (id: Id) => setOpen((cur) => (cur === id ? null : id))

  const bhHits = bh ? BH_ORDER.filter(([k]) => Number(bh[k]) > 0) : []
  const f0 = health?.f0rmless
  const f0Red = f0?.status.includes('🔴')
  const f0Issues = /(\d+) persisted/.exec(f0?.status ?? '')?.[1]
  const vit = (re: RegExp) => re.exec(f0?.vitals ?? '')?.[1] ?? '—'
  const mailNew = mail?.reduce((t, a) => t + (a.unread_primary ?? 0), 0) ?? 0
  const mailBad = mail?.filter((a) => !a.ok) ?? []

  const tiles: { id: Id; label: string; minor?: boolean; badge?: React.ReactNode; big: React.ReactNode; sub: React.ReactNode }[] = [
    {
      id: 'find',
      label: 'Findability tool',
      big: overview ? <>{n(overview.last_7d)}<small>scans, 7 days</small></> : '—',
      sub: overview ? <><b>{overview.today}</b> today · avg score <b>{overview.avg_score ?? '—'}</b> · <b>{overview.leads}</b> leads</> : 'Not reachable',
    },
    {
      id: 'bh',
      label: 'Blog Hands',
      big: !bh ? <>—<small>not connected yet</small></> : bhHits.length ? <>{n(Number(bh[bhHits[0][0]]))}<small>{bhHits[0][1]}</small></> : <>0<small>activity this week</small></>,
      sub: !bh ? 'Run the Blog Hands SQL step' : bhHits[1] ? <><b>{n(Number(bh[bhHits[1][0]]))}</b> {bhHits[1][1]}</> : 'Nothing else moved this week',
    },
    {
      id: 'jobs',
      label: 'Job hunt',
      big: <>{n(jobs.counts.new ?? 0)}<small>new leads to review</small></>,
      sub: <><b>{jobs.pitched7d}</b> pitched this week · <b>{jobs.followupsDue}</b> follow-ups due</>,
    },
    {
      id: 'mail',
      label: 'Inbox',
      badge: mailBad.length ? <span className="inline-flex items-center gap-1.5 text-[11px] text-danger"><i className="h-1.5 w-1.5 rounded-full bg-danger" />check</span> : undefined,
      big: mail ? <>{n(mailNew)}<small>new in Primary</small></> : <>—<small>not connected yet</small></>,
      sub: mail ? mail.map((a, i) => <span key={a.email}>{i > 0 && ' · '}{a.label} <b>{a.ok ? a.unread_primary : '!'}</b></span>) : 'Add app passwords on your PC',
    },
    {
      id: 'f0',
      label: 'f0rmless',
      minor: true,
      badge: f0 ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] text-muted-foreground"><i className={`h-1.5 w-1.5 rounded-full ${f0Red ? 'bg-danger' : 'bg-primary'}`} />{f0Red ? `${f0Issues ?? ''} issues` : 'ok'}</span> : undefined,
      big: <>{vit(/entries=(\d+)/)}<small>matches</small></>,
      sub: <><b>{vit(/\blive=(\d+)/)}</b> live now</>,
    },
  ]

  return (
    <section aria-label="Key numbers">
      <div className={`grid grid-cols-1 overflow-hidden border border-border bg-panel sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1.2fr_1.2fr_0.8fr] ${open ? 'rounded-t-2xl' : 'rounded-2xl'}`}>
        {tiles.map((t, i) => (
          <button
            key={t.id}
            type="button"
            aria-expanded={open === t.id}
            aria-controls="dash-detail"
            onClick={() => toggle(t.id)}
            className={`relative grid min-w-0 content-start gap-1.5 border-border px-5 py-4 text-left transition-colors hover:bg-well focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary
              ${open === t.id ? 'bg-well after:absolute after:inset-x-5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary' : ''}
              ${tileBorders(i, tiles.length)}`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t.label}</span>
              <span className="flex items-center gap-2">
                {t.badge}
                <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform ${open === t.id ? 'rotate-180 text-primary' : 'text-muted-foreground/60'}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </span>
            </span>
            <span className={`font-heading font-semibold tabular-nums tracking-tight [&_small]:ml-1.5 [&_small]:font-sans [&_small]:text-[13px] [&_small]:font-normal [&_small]:tracking-normal [&_small]:text-muted-foreground ${t.minor ? 'text-[22px]' : 'text-[28px] leading-tight'}`}>
              {t.big}
            </span>
            <span className="text-xs text-muted-foreground [&_b]:font-medium [&_b]:tabular-nums [&_b]:text-foreground">{t.sub}</span>
          </button>
        ))}
      </div>

      {open && (
        <div id="dash-detail" className="rounded-b-2xl border border-t-0 border-border bg-well px-5 py-5 md:px-6">
          {open === 'find' && (
            <>
              <DetailHead title="Findability tool" link={<OutLink href="https://chrishornak.com/audit">Open the tool</OutLink>} />
              {overview && (
                <Kv items={[[overview.today, 'scans today'], [overview.last_7d, 'scans, 7 days'], [overview.last_30d, 'scans, 30 days'], [n(overview.unique_domains), 'sites, all time'], [overview.avg_score ?? '—', 'average score'], [overview.leads, 'leads, all time']]} />
              )}
              <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Latest sites scanned</p>
              <ul>
                {domains.slice(0, 8).map((r) => (
                  <Row key={r.domain}>
                    <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate underline-offset-4 hover:underline">{r.domain}</a>
                    <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{r.scan_count > 1 ? `×${r.scan_count} · ` : ''}{r.created_at.slice(0, 10)}</span>
                    <span className={`rounded-full px-2 text-xs font-semibold tabular-nums ${scoreClass(r.overall_score)}`}>{r.overall_score}</span>
                  </Row>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">The full list is in the Findability tab.</p>
            </>
          )}

          {open === 'bh' && (
            <>
              <DetailHead title="Blog Hands" link={<OutLink href="https://bloghands.com/admin">Open Blog Hands admin</OutLink>} />
              {bh ? (
                <>
                  <Kv items={[[bh.signups_7d, 'sign-ups, 7 days'], [bh.signups_30d, 'sign-ups, 30 days'], [bh.active_subs, 'active subscriptions'], [bh.posts_delivered_7d, 'posts delivered, 7 days'], [bh.free_claims_7d, 'free posts claimed, 7 days'], [bh.grader_runs_7d, 'Blog Grader runs, 7 days'], [bh.paige_flagged_open, 'Paige posts to review'], [bh.paige_failed_7d, 'Paige runs failed, 7 days'], [bh.paid_orders_30d, 'paid orders, 30 days'], [`$${n(Math.round(bh.revenue_30d_cents / 100))}`, 'paid, 30 days'], [n(bh.accounts_total), 'accounts, all time'], [bh.subscribers, 'subscribers']]} />
                  <div className="flex flex-wrap gap-8">
                    <div><p className="text-xs text-muted-foreground">Sign-ups, 14 days</p><Sparkline values={bh.daily.map((d) => d.signups)} label="Sign-ups per day, last 14 days" /></div>
                    <div><p className="text-xs text-muted-foreground">Blog Grader runs, 14 days</p><Sparkline values={bh.daily.map((d) => d.grades)} label="Blog Grader runs per day, last 14 days" /></div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">The numbers connect after the Blog Hands SQL step runs in Supabase.</p>
              )}
            </>
          )}

          {open === 'jobs' && (
            <>
              <DetailHead title="Job hunt" link={<OutLink href={CONTRA_JOBS}>Open Contra&apos;s job board</OutLink>} />
              <Kv items={(['new', 'pitched', 'replied', 'won', 'passed'] as const).map((s) => [jobs.counts[s] ?? 0, s === 'new' ? 'new to review' : s])} />
              <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">New leads to review</p>
              <ul>
                {newLeads.slice(0, 6).map((l) => (
                  <Row key={l.id}>
                    <span className="min-w-0 flex-1"><b className="font-semibold">{l.who}</b> <span className="text-muted-foreground">· {l.ask.slice(0, 120)}</span></span>
                    <span className="text-xs text-muted-foreground">{l.fit}{l.pay_hr ? ` · $${l.pay_hr}/hr` : ''}</span>
                    {l.link && <OutLink href={l.link}>Open</OutLink>}
                  </Row>
                ))}
                {newLeads.length === 0 && <li className="text-sm text-muted-foreground">No new leads. Check Contra.</li>}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Everything else is in the Job hunt tab.</p>
            </>
          )}

          {open === 'mail' && (
            <>
              <DetailHead title="Inbox · new in Primary, last 7 days" link={<span className="text-xs text-muted-foreground">updated {ago(mailUpdated)}</span>} />
              {!mail && <MailSetup />}
              <div className="grid gap-6 lg:grid-cols-2">
                {mail?.map((a) => (
                  <div key={a.email} className="min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="font-semibold">{a.label} <span className="text-xs font-normal text-muted-foreground">{a.email}</span></p>
                      <OutLink href={a.inbox}>Open inbox</OutLink>
                    </div>
                    {!a.ok && <p className="text-sm text-danger">{a.error} Check the app password in dashboard.env.</p>}
                    <ul>
                      {a.messages?.map((m, i) => (
                        <Row key={i}>
                          <a href={m.link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:underline">
                            <b className="font-semibold">{m.from}</b> <span className="text-muted-foreground">· {m.subject}</span>
                          </a>
                          <span className="text-xs tabular-nums text-muted-foreground">{ago(m.at)}</span>
                        </Row>
                      ))}
                      {a.ok && !a.messages?.length && <li className="py-2 text-sm text-muted-foreground">Nothing new in Primary.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}

          {open === 'f0' && f0 && (
            <>
              <DetailHead title="f0rmless" link={<OutLink href="https://www.f0rmless.com">Open f0rmless</OutLink>} />
              <p className="text-sm">{f0.status}</p>
              {f0.wire && <p className="mt-1 text-xs text-warning">{f0.wire}</p>}
              <ul className="mt-3">
                {f0.findings.slice(0, 6).map((x, i) => <Row key={i}><span className="min-w-0 flex-1 text-xs">{x}</span></Row>)}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Watcher checked {f0.checked_at ?? 'never'} · more in Site health.</p>
            </>
          )}
        </div>
      )}
    </section>
  )
}

// 1 column on phones, 2 on tablets, 5 in a row on desktop.
function tileBorders(i: number, count: number) {
  return [
    i > 0 ? 'border-t' : '',
    i < 2 ? 'sm:border-t-0' : '',
    i % 2 === 1 ? 'sm:border-l' : '',
    i === count - 1 ? 'sm:col-span-2 lg:col-span-1' : '',
    'lg:border-t-0',
    i > 0 ? 'lg:border-l' : '',
  ].join(' ')
}

function DetailHead({ title, link }: { title: string; link: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      {link}
    </div>
  )
}

function MailSetup() {
  return (
    <div className="text-sm text-muted-foreground">
      <p>Connect each Gmail inbox once, on your PC:</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Sign in to the Google account. Open <b className="text-foreground">myaccount.google.com/apppasswords</b>. (2-Step Verification must be on.)</li>
        <li>Make an app password named &quot;Dashboard&quot;. Copy the 16 letters.</li>
        <li>Paste them after <code>ACCOUNT_N_APP_PASSWORD=</code> in <code>C:\Users\Blog Hands\.claude\dashboard.env</code>. Save.</li>
      </ol>
      <p className="mt-2">It shows up within the hour.</p>
    </div>
  )
}
