'use client'

import { useState } from 'react'
import type { Health, Level } from '@/lib/admin-dashboard'
import { CopyButton, Updated } from './DashParts'

/* Site health (v2, 2026-10-15): top priorities first, then one card per site
 * (status, cert days left, up or not), click a card or chip to see only that
 * site. Data: the morning sentinel sweep + the f0rmless watcher, split per site
 * by dash-refresh.mjs. */

const DOT: Record<Level, string> = { red: 'bg-danger', amber: 'bg-warning', plain: 'bg-muted-foreground/60', green: 'bg-primary' }
const RANK: Record<Level, number> = { red: 0, amber: 1, plain: 2, green: 3 }
const LABEL: Record<Level, string> = { red: 'Broken', amber: 'Needs attention soon', plain: "Couldn't check", green: 'OK' }
const CERT_WARN_DAYS = 30

interface Item { site: string; level: Level; check: string; text: string; say: string }

export function DashHealth({ health, updated }: { health: Health | null; updated?: string }) {
  const [site, setSite] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  if (!health) return <p className="mt-6 text-sm text-muted-foreground">No health report yet.</p>
  const { sentinel: s, f0rmless: f0 } = health

  // Older blobs (before the per-site split) fall back to the section items.
  const findings = s.findings ?? s.sections.flatMap((x) => x.items.map((t) => ({ site: 'All sites', level: x.level, check: x.label, text: t })))
  const f0Red = f0.status.includes('🔴')
  const items: Item[] = [
    ...findings.map((f) => ({ ...f, say: `fix runbook: ${f.site} — ${f.check}` })),
    ...(f0Red ? [{ site: 'f0rmless', level: 'red' as Level, check: 'Watcher: open problems', text: [f0.status, ...f0.findings.slice(0, 4)].join(' · '), say: 'refresh f0rmless' }] : []),
    ...(f0.wire ? [{ site: 'f0rmless', level: 'amber' as Level, check: 'THE WIRE is due', text: f0.wire, say: 'make the wire' }] : []),
    ...(s.certs ?? []).filter((c) => c.days < CERT_WARN_DAYS).map((c) => ({ site: c.site, level: (c.days < 14 ? 'red' : 'amber') as Level, check: `Certificate ends in ${c.days} days`, text: `${c.domain} certificate ends ${c.expires}.`, say: `fix runbook: ${c.domain} certificate ends ${c.expires}` })),
  ].sort((a, b) => RANK[a.level] - RANK[b.level])

  const sites = [...new Set([...(s.sites ?? []), ...items.map((i) => i.site)])].filter((x) => x !== 'All sites')
  const worst = (name: string): Level => {
    const own = items.filter((i) => i.site === name)
    if (own.length) return own[0].level
    return 'green'
  }
  const certOf = (name: string) => (s.certs ?? []).find((c) => c.site === name)
  const upOf = (name: string) => (s.up ?? []).some((u) => u.site === name)
  const shown = site === 'all' ? items : items.filter((i) => i.site === site || i.site === 'All sites')
  const priorities = items.filter((i) => i.level !== 'green').slice(0, 5)
  const sweptMs = s.swept_at ? Date.parse(s.swept_at.replace(' ', 'T')) : NaN
  const stale = Number.isNaN(sweptMs) || Date.now() - sweptMs > 26 * 3600e3

  return (
    <div className="mt-6 grid gap-5">
      {/* Summary */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-panel px-5 py-4">
        <p className="text-sm [&_b]:font-semibold [&_b]:tabular-nums">
          <b>{sites.length}</b> sites · <b className={items.some((i) => i.level === 'red') ? 'text-danger' : ''}>{items.filter((i) => i.level === 'red').length}</b> broken ·{' '}
          <b className={items.some((i) => i.level === 'amber') ? 'text-warning' : ''}>{items.filter((i) => i.level === 'amber').length}</b> need attention soon · <b>{items.filter((i) => i.level === 'plain').length}</b> couldn&apos;t check
        </p>
        <span className="flex flex-wrap items-center gap-3 text-xs">
          <span className={stale || s.failed ? 'text-warning' : 'text-muted-foreground'}>
            {s.failed ? 'The last sweep failed to run' : `Sites checked ${s.swept_at ?? 'never'}`}
            {stale && !s.failed && ' (over a day old)'}
          </span>
          <CopyButton text="sweep" label="Copy: run a sweep" />
        </span>
      </section>

      {/* Top priorities */}
      <section className="rounded-2xl border border-border bg-panel p-5 md:p-6">
        <h2 className="font-heading text-lg font-semibold">Top priorities</h2>
        {priorities.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing needs you. Every check passed.</p>
        ) : (
          <ol className="mt-2">
            {priorities.map((p, i) => (
              <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)] gap-x-3 border-t border-border py-3 first:border-t-0">
                <span className="pt-0.5 font-heading text-[15px] text-muted-foreground/60">{i + 1}</span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                    <span className="rounded border border-border px-1.5 py-px text-[10.5px] font-medium text-foreground/85">{p.site}</span>
                    <span className="inline-flex items-center gap-1.5"><i className={`h-1.5 w-1.5 rounded-full ${DOT[p.level]}`} />{LABEL[p.level]}</span>
                  </p>
                  <h3 className="mt-1 text-[14.5px] font-medium">{p.check}</h3>
                  <p className="mt-0.5 line-clamp-2 max-w-[90ch] text-[13px] text-muted-foreground">{p.text}</p>
                  <div className="mt-2"><CopyButton text={p.say} /></div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Site filter + cards */}
      <section>
        <div className="flex flex-wrap items-center gap-1.5">
          <SitePill on={site === 'all'} onClick={() => setSite('all')}>All sites</SitePill>
          {sites.map((x) => (
            <SitePill key={x} on={site === x} onClick={() => setSite(site === x ? 'all' : x)}>
              <i className={`h-1.5 w-1.5 rounded-full ${DOT[worst(x)]}`} aria-hidden="true" />
              {x}
            </SitePill>
          ))}
        </div>

        {site === 'all' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sites.map((x) => {
              const c = certOf(x)
              const n = items.filter((i) => i.site === x).length
              const lvl = worst(x)
              return (
                <button key={x} type="button" onClick={() => setSite(x)} className="rounded-xl border border-border bg-panel p-4 text-left transition-colors hover:bg-well">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{x}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><i className={`h-2 w-2 rounded-full ${DOT[lvl]}`} />{lvl === 'green' ? 'OK' : `${n} to look at`}</span>
                  </span>
                  <span className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    <span>{upOf(x) ? '✓ Up, with title and share tags' : x === 'f0rmless' ? f0.vitals ? `Watcher: ${f0Red ? 'problems open' : 'OK'}` : 'Watcher only' : 'Uptime not checked'}</span>
                    {c && (
                      <span className="flex items-center gap-2">
                        <span className={c.days < CERT_WARN_DAYS ? 'text-warning' : ''}>Certificate: {c.days} days left</span>
                        <span className="h-1 flex-1 overflow-hidden rounded-full bg-well" aria-hidden="true">
                          <span className={`block h-full ${c.days < CERT_WARN_DAYS ? 'bg-warning' : 'bg-primary/60'}`} style={{ width: `${Math.min(100, (c.days / 90) * 100)}%` }} />
                        </span>
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Findings for the chosen site (or all) */}
      <section className="rounded-2xl border border-border bg-panel p-5 md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold">{site === 'all' ? 'Every finding' : site}</h2>
          {site !== 'all' && certOf(site) && <span className="text-xs text-muted-foreground">{certOf(site)!.domain} · certificate ends {certOf(site)!.expires}</span>}
        </div>
        {shown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No findings{site !== 'all' ? ` for ${site}` : ''}. {site !== 'all' && upOf(site) ? 'It is up and its title and share tags are in place.' : ''}</p>
        ) : (
          <ul className="mt-2">
            {shown.map((f, i) => {
              const k = `${f.site}-${f.check}-${i}`
              return (
                <li key={k} className="border-t border-border py-3 first:border-t-0">
                  <button type="button" aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)} className="flex w-full items-start gap-2.5 text-left">
                    <i className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[f.level]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="text-[14px] font-medium">{f.check}</span>
                      <span className="text-xs text-muted-foreground"> · {f.site} · {LABEL[f.level]}</span>
                      <span className={`mt-0.5 text-[13px] text-muted-foreground ${open === k ? 'block' : 'line-clamp-1'}`}>{f.text}</span>
                    </span>
                    <span className="text-xs text-muted-foreground" aria-hidden="true">{open === k ? '▾' : '▸'}</span>
                  </button>
                  {open === k && <div className="mt-2 pl-4.5"><CopyButton text={f.say} /></div>}
                </li>
              )
            })}
          </ul>
        )}

        {(s.clean ?? []).length > 0 && (
          <details className="mt-3 border-t border-border pt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">What passed ({s.clean!.length} checks)</summary>
            <ul className="mt-2 grid gap-2">
              {s.clean!.map((c) => (
                <li key={c.title} className="text-[13px]">
                  <span className="font-medium">✓ {c.title}</span> <span className="text-muted-foreground">{c.text}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* f0rmless watcher */}
      {(site === 'all' || site === 'f0rmless') && (
        <section className="rounded-2xl border border-border bg-panel p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">f0rmless watcher</h2>
            <span className="text-xs text-muted-foreground">checks every 30 min · last {f0.checked_at ?? 'never'}</span>
          </div>
          <p className="mt-2 text-sm">{f0.status || 'No status.'}</p>
          {f0.vitals && <p className="mt-1 text-xs text-muted-foreground">{f0.vitals}</p>}
          {f0.findings.length > 0 && (
            <ul className="mt-3 grid gap-1.5">
              {f0.findings.map((f, i) => <li key={i} className="text-xs">{f}</li>)}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-3">
            <CopyButton text="refresh f0rmless" />
            <Updated iso={updated} />
          </div>
        </section>
      )}
    </div>
  )
}

function SitePill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${on ? 'border-primary-line bg-primary-deep text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  )
}
