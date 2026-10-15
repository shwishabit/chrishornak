'use client'

import type { MailAccount, MailMessage, SalesDb, SalesState, ScoutLead } from '@/lib/admin-dashboard'
import { ago, brandChip } from '@/lib/dash-format'
import { CopyButton, OutLink, SectionTitle, Updated } from './DashParts'

/* Sales tab (2026-10-15): every lead source in one place. Scout is the truth for
 * the pipeline; this tab only reads it. The Feed's Sales group shows what needs
 * Chris today; this tab shows everything. */

const STAGES: { id: ScoutLead['stage']; label: string }[] = [
  { id: 'proposal', label: 'Proposal' },
  { id: 'in_conversation', label: 'In conversation' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'new', label: 'New' },
]
const money = (n: number) => `$${n.toLocaleString('en-US')}`

function salesSummary(sales: SalesState | null) {
  const leads = sales?.scout.leads ?? []
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  return {
    open: leads.length,
    due: leads.filter((l) => l.due && l.due <= today).length,
    monthly: leads.reduce((t, l) => t + (l.value_monthly ?? 0), 0),
    byStage: STAGES.map((s) => [s.label, leads.filter((l) => l.stage === s.id).length] as const),
  }
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-panel p-5 md:p-6">
      <SectionTitle right={right}>{title}</SectionTitle>
      <div className="mt-3">{children}</div>
    </section>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>
const li = 'flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-2.5 text-[13.5px] first:border-t-0'

export function DashSales({
  sales,
  salesDb,
  mail,
  updated,
}: {
  sales: SalesState | null
  salesDb: SalesDb | null
  mail: MailAccount[] | null
  updated?: string
}) {
  const leads = sales?.scout.leads ?? []
  const sum = salesSummary(sales)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const forms: (MailMessage & { account: string })[] = (mail ?? []).flatMap((a) => (a.leads ?? []).map((m) => ({ ...m, account: a.label })))

  return (
    <div className="mt-6 grid gap-5">
      <Card
        title="Scout pipeline"
        right={
          <span className="flex items-center gap-3">
            <Updated iso={updated} />
            <OutLink href="https://swoop.swiftgrowth.marketing/admin/sales">Open Scout</OutLink>
          </span>
        }
      >
        {!sales && <Empty>Not read yet. The hourly PC job (dash-sales.mjs) pushes it.</Empty>}
        {sales && !sales.scout.ok && <p className="text-sm text-warning">{sales.scout.error}</p>}
        {sales?.scout.ok && (
          <>
            <p className="text-sm text-muted-foreground [&_b]:font-medium [&_b]:tabular-nums [&_b]:text-foreground">
              <b>{sum.open}</b> open leads · <b>{sum.due}</b> with a next step due · <b>{money(sum.monthly)}</b>/mo if they all close
            </p>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              {STAGES.map((s) => {
                const rows = leads.filter((l) => l.stage === s.id)
                return (
                  <div key={s.id} className="min-w-0">
                    <h3 className="border-b border-border pb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {s.label} <span className="tabular-nums text-muted-foreground/60">{rows.length}</span>
                    </h3>
                    {rows.length === 0 && <p className="py-2.5 text-sm text-muted-foreground">None.</p>}
                    <ul>
                      {rows.map((l) => {
                        const late = l.due && l.due < today
                        return (
                          <li key={l.id} className={li}>
                            <span className="min-w-0 flex-1">
                              <a href={l.link} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-4 hover:underline">{l.name}</a>
                              {l.next_step && <span className="text-muted-foreground"> · {l.next_step}</span>}
                              {l.last_email && (
                                <a href={l.last_email.link} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline">
                                  Last email {l.last_email.direction} {ago(l.last_email.at)}: {l.last_email.subject} ↗
                                </a>
                              )}
                              <span className="block text-xs text-muted-foreground">
                                {l.due ? <span className={late ? 'text-danger' : l.due === today ? 'text-warning' : ''}>due {l.due === today ? 'today' : l.due}</span> : 'no due date'}
                                {' · '}last touch {ago(l.last_touch)}
                                {l.value_monthly ? ` · ${money(l.value_monthly)}/mo` : l.value_oneoff ? ` · ${money(l.value_oneoff)}` : ''}
                              </span>
                            </span>
                            <CopyButton text={`draft a follow-up to ${l.name} (Scout lead ${l.id})`} label="Copy" />
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Website form messages" right={<span className="text-xs text-muted-foreground">all three brands · 14 days</span>}>
          {!mail && <Empty>The inbox is not connected yet.</Empty>}
          {mail && forms.length === 0 && <Empty>No form messages in the last 14 days.</Empty>}
          <ul>
            {forms.map((m) => (
              <li key={m.id ?? m.link} className={li}>
                <a href={m.link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 hover:underline">
                  <span className={`mr-1.5 ${brandChip(m.brand ?? 'Chris Hornak')}`}>{m.brand ?? 'Chris Hornak'}</span>
                  {m.subject} <span className="text-xs text-muted-foreground">· {m.form ?? 'form'} · {m.account} inbox</span>
                </a>
                <span className="text-xs tabular-nums text-muted-foreground">{ago(m.at)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Spec-site emails not sent" right={<span className="text-xs text-muted-foreground">Swift Growth Leads</span>}>
          {(sales?.drafts ?? []).length === 0 && <Empty>Every drafted email is marked sent.</Empty>}
          <ul>
            {(sales?.drafts ?? []).map((d) => (
              <li key={d.id} className={li}>
                <span className="min-w-0 flex-1">
                  {d.name} <span className="block text-xs text-muted-foreground">{d.file} · changed {d.updated}</span>
                  {d.last_email && (
                    <a href={d.last_email.link} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline">
                      Last email {d.last_email.direction} {ago(d.last_email.at)}: {d.last_email.subject} ↗
                    </a>
                  )}
                </span>
                <OutLink href={d.preview}>Preview</OutLink>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Blog Hands sign-ups and free posts" right={<span className="text-xs text-muted-foreground">14 days</span>}>
          {!salesDb && <Empty>Not reachable.</Empty>}
          {salesDb && salesDb.signups.length + salesDb.claims.length === 0 && <Empty>No new sign-ups or free-post claims.</Empty>}
          <ul>
            {salesDb?.signups.map((s) => (
              <li key={s.id} className={li}>
                <span className="min-w-0 flex-1">
                  {s.name || s.email} <span className="text-xs text-muted-foreground">· signed up · {s.email}{s.website ? ` · ${s.website}` : ''}</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{ago(s.at)}</span>
              </li>
            ))}
            {salesDb?.claims.map((c) => (
              <li key={c.id} className={li}>
                <span className="min-w-0 flex-1">
                  Free post{c.domain ? ` for ${c.domain}` : ''} <span className="text-xs text-muted-foreground">· {c.email ?? 'no email'}</span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{ago(c.at)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Low Findability scores" right={<span className="text-xs text-muted-foreground">under 60 · 14 days</span>}>
          {!salesDb && <Empty>Not reachable.</Empty>}
          {salesDb && salesDb.low_scores.length === 0 && <Empty>No low scores in the last 14 days.</Empty>}
          <ul>
            {salesDb?.low_scores.map((f) => (
              <li key={f.domain} className={li}>
                <a href={`https://${f.domain}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:underline">{f.domain}</a>
                <span className="rounded-full bg-danger/15 px-2 text-xs font-semibold tabular-nums text-danger">{f.score}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{ago(f.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
