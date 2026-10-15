'use client'

import { useState } from 'react'
import type { MailAccount, SalesDb, SgmState } from '@/lib/admin-dashboard'
import { ago, brandChip } from '@/lib/dash-format'
import { CopyButton } from './DashParts'

/* Tools & leads (2026-10-15): every lead the three brands' free tools and forms
 * caught, in one list, each labeled with its brand. "Leads" left contact details;
 * "Tool runs" are sites that used a tool and scored low but left no contact. */

interface Lead {
  key: string
  brand: string
  source: string
  who: string
  contact: string | null
  detail?: string
  at: string
  href?: string
  say: string
}

const BRANDS = ['Chris Hornak', 'Blog Hands', 'Swift Growth']

/** Form emails come "from" the website, so the person is in the subject:
 *  "New inquiry from Ann at Acme" → "Ann (Acme)", "Persona Tool Lead: Felix at abdi" → "Felix (abdi)". */
function personFrom(subject: string, fallback: string): string {
  const m = /^(?:new (?:inquiry|message) from|contract role from|[\w ]+ lead:)\s*(.+)$/i.exec(subject)
  if (!m) return fallback
  const [name, company] = m[1].split(/\s+at\s+/i)
  return company && company.trim() !== name.trim() ? `${name.trim()} (${company.trim()})` : name.trim()
}
const DAY = 864e5

export function DashToolLeads({ mail, salesDb, sgm }: { mail: MailAccount[] | null; salesDb: SalesDb | null; sgm: SgmState | null }) {
  const [brand, setBrand] = useState('all')
  const [kind, setKind] = useState<'leads' | 'runs'>('leads')
  const [q, setQ] = useState('')

  const leads: Lead[] = [
    ...(mail ?? []).flatMap((a) =>
      (a.leads ?? []).map((m) => ({
        key: `form:${m.id ?? m.link}`,
        brand: m.brand ?? 'Chris Hornak',
        source: m.form ?? 'website form',
        who: personFrom(m.subject, m.from),
        contact: null,
        detail: m.subject,
        at: m.at,
        href: m.link,
        say: `draft a reply to the ${m.brand ?? 'Chris Hornak'} ${m.form ?? 'form'} message "${m.subject}"`,
      })),
    ),
    ...(salesDb?.claims ?? []).map((c) => ({
      key: `claim:${c.id}`,
      brand: 'Blog Hands',
      source: 'Free post claim',
      who: c.domain ?? c.email ?? 'someone',
      contact: c.email,
      detail: c.topic ? `Topic: ${c.topic}` : undefined,
      at: c.at,
      say: `draft a follow-up to the Blog Hands free-post claim from ${c.email ?? c.domain}`,
    })),
    ...(salesDb?.signups ?? []).map((s) => ({
      key: `signup:${s.id}`,
      brand: 'Blog Hands',
      source: 'Sign-up',
      who: s.name || s.email,
      contact: s.email,
      detail: s.website ?? undefined,
      at: s.at,
      say: `draft a short personal welcome note to the new Blog Hands sign-up ${s.email}`,
    })),
    ...(sgm?.checks ?? []).map((c) => ({
      key: `check:${c.id}`,
      brand: 'Swift Growth',
      source: 'Buyer-Ready Check report request',
      who: `${c.name}${c.company ? ` (${c.company})` : ''}`,
      contact: c.email,
      detail: `${c.site}${c.score !== null ? ` · score ${c.score}` : ''} · status ${c.status}`,
      at: c.created_at,
      href: `mailto:${c.email}`,
      say: `draft the Buyer-Ready Check report email to ${c.name} <${c.email}> for ${c.site}`,
    })),
    ...(sgm?.audits ?? []).map((a) => ({
      key: `audit:${a.id}`,
      brand: 'Swift Growth',
      source: 'Local Audit email gate',
      who: a.business_name || a.email,
      contact: a.email,
      at: a.created_at,
      href: `mailto:${a.email}`,
      say: `draft a follow-up to the Local Audit lead ${a.email}`,
    })),
  ]

  const runs: Lead[] = [
    ...(salesDb?.low_scores ?? []).map((f) => ({
      key: `find:${f.domain}`,
      brand: 'Chris Hornak',
      source: `Findability score ${f.score}`,
      who: f.domain,
      contact: null,
      at: f.at,
      href: `https://${f.domain}`,
      say: `research this lead: ${f.domain} (Findability score ${f.score})`,
    })),
    ...(sgm?.scans ?? [])
      .filter((x) => (x.overall ?? 100) < 70)
      .map((x, i) => ({
        key: `scan:${i}:${x.created_at}`,
        brand: 'Swift Growth',
        source: `Local Audit ${x.letter ?? ''} ${x.overall ?? ''}`.trim(),
        who: x.business_name,
        contact: null,
        at: x.created_at,
        say: `research this lead: ${x.business_name} (Local Audit score ${x.overall})`,
      })),
  ]

  const list = (kind === 'leads' ? leads : runs)
    .filter((l) => brand === 'all' || l.brand === brand)
    .filter((l) => !q.trim() || `${l.brand} ${l.source} ${l.who} ${l.contact ?? ''} ${l.detail ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.at.localeCompare(a.at))
  // 14 days for every brand: the form emails, sign-ups and claims are only fetched for 14.
  const recent = (b: string) => leads.filter((l) => l.brand === b && Date.now() - Date.parse(l.at) <= 14 * DAY).length

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-panel p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">Leads from tools and forms</h2>
        <span className="text-xs text-muted-foreground">all three brands · last 14 days</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {BRANDS.map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={brand === b}
            onClick={() => setBrand(brand === b ? 'all' : b)}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${brand === b ? 'border-primary-line bg-primary-deep' : 'border-border hover:bg-well'}`}
          >
            <span className={brandChip(b)}>{b}</span>
            <span className="font-heading text-xl font-semibold tabular-nums">{recent(b)}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">leads, 14 days</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Show" className="inline-flex rounded-lg border border-border p-0.5 text-[13px]">
          {([['leads', 'Left contact details', leads.length], ['runs', 'Low scores, no contact', runs.length]] as const).map(([id, label, n]) => (
            <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)} className={`rounded-md px-2.5 py-1 ${kind === id ? 'bg-well text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {label} <span className="tabular-nums opacity-60">{n}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search leads"
          aria-label="Search leads"
          className="min-w-0 flex-1 basis-40 rounded-lg border border-border bg-well px-3 py-1.5 text-sm focus-visible:border-primary focus-visible:outline-none"
        />
      </div>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing here{brand !== 'all' ? ` for ${brand}` : ''}.</p>
      ) : (
        <ul className="mt-3">
          {list.map((l) => (
            <li key={l.key} className="flex flex-wrap items-start gap-x-3 gap-y-1 border-t border-border py-3 first:border-t-0">
              <span className={`mt-px ${brandChip(l.brand)}`}>{l.brand}</span>
              <div className="min-w-0 flex-1 basis-60">
                <p className="text-[13.5px]">
                  {l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">{l.who}</a> : <span className="font-medium">{l.who}</span>}
                  <span className="text-muted-foreground"> · {l.source}</span>
                </p>
                {(l.contact || l.detail) && (
                  <p className="mt-0.5 text-xs text-muted-foreground wrap-anywhere">{[l.contact, l.detail].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{ago(l.at)}</span>
              <CopyButton text={l.say} label="Copy" />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground/80">
        chrishornak.com tools collect no email, so their low scores show under &quot;Low scores, no contact&quot;. Swift Growth&apos;s contact, AEO, Persona and Accessibility forms only email you, so they show here from the inbox. On the new site that needs the Brevo key copied into Vercel at launch.
      </p>
    </section>
  )
}
