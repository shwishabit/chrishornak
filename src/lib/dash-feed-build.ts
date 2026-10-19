/* ── Dashboard Feed builder (server-side, 2026-10-15) ───────────────────────
 * Turns every source into one list in Chris's morning order:
 *   Email → Sales → Jobs → Marketing → Client work → Other.
 * Item ids must stay stable across hourly refreshes (dash_feed_status keys on
 * them): Gmail message id, job_leads.id, project:<id>:<hash of next step>,
 * today items = hash of kind + title, recurring items carry their day/week.
 * Time estimates are the defaults agreed in drafts/dashboard-feed-plan.md.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import type { DashProject, DashState, LastEmail, Level, SalesDb, Todo, TodayItem } from './admin-dashboard'
import type { JobLead } from './admin-jobs'
import { blueskyPosts } from './bluesky-posts'
import { CONTRA_JOBS } from './dash-format'
import { nyDate, type FeedItem } from './dash-feed'

const DAY = 864e5
const FOLLOW_UP_AFTER_DAYS = 5
const BSKY_MIN_DAYS_AHEAD = 3 // same as the cron's low-queue email

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const daysSince = (iso: string | null | undefined, now: number) => (iso ? Math.floor((now - Date.parse(iso)) / DAY) : null)
const agoDays = (d: number | null) => (d === null ? '' : d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`)

// Chris runs several brands, so every Feed item says whose it is.
const BRAND_WORDS: [RegExp, string][] = [
  [/f0rmless|the wire|devlog/i, 'f0rmless'],
  [/blog ?hands|paige|blog grader/i, 'Blog Hands'],
  [/swift|sgm|scout|swoop|spec[- ]site/i, 'Swift Growth'],
  [/chrishornak|findability|bluesky|linkedin/i, 'Chris Hornak'],
  [/job (hunt|search)|contra|upwork|pitch/i, 'Job hunt'],
  [/\bgame|hardsite|stratego|breach|rafter|tetris|scandisk|fuse\b/i, 'Games'],
]
const brandOf = (text: string, fallback = 'Workspace') => BRAND_WORDS.find(([re]) => re.test(text))?.[1] ?? fallback
const OWNED_BRAND: Record<string, string> = { bloghands: 'Blog Hands', chrishornak: 'Chris Hornak', 'swift-growth-website': 'Swift Growth', f0rmless: 'f0rmless' }
function projectBrand(p: DashProject): string {
  if (p.tag === 'Client') return p.name.replace(/\s+[—(-].*$/, '')
  return OWNED_BRAND[p.folder] ?? (/^swift/i.test(p.folder) ? 'Swift Growth' : brandOf(p.name + ' ' + p.folder))
}
const lastEmailLink = (e: LastEmail | null | undefined, now: number) =>
  e
    ? { href: e.link, label: e.direction === 'about them' ? `Related email (${agoDays(daysSince(e.at, now))})` : `Last email (${e.direction}, ${agoDays(daysSince(e.at, now))})` }
    : undefined

/** Short stable hash (djb2, base 36) for ids built from text. */
export function hashId(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** ISO week label like 2026-W42, for weekly items. */
function isoWeek(day: string): string {
  const d = new Date(day + 'T12:00:00Z')
  const wd = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - wd + 3) // the Thursday of this week decides the year
  const y = d.getUTCFullYear()
  const w = Math.floor((d.getTime() - Date.UTC(y, 0, 1)) / (7 * DAY)) + 1
  return `${y}-W${String(w).padStart(2, '0')}`
}

export function buildFeed({
  state,
  jobLeads,
  questionLeads,
  salesDb,
  todos = [],
  now = Date.now(),
}: {
  state: DashState | null
  jobLeads: JobLead[]
  questionLeads: JobLead[]
  salesDb: SalesDb | null
  todos?: Todo[]
  now?: number
}): FeedItem[] {
  const today = nyDate(new Date(now))
  const week = isoWeek(today)
  const items: FeedItem[] = []
  const add = (i: FeedItem) => items.push(i)

  // ── 1. Email: unread Primary, both inboxes. ~2 min each. ──
  for (const a of state?.mail?.accounts ?? []) {
    if (!a.ok) {
      add({ id: `mail-error:${a.email}:${today}`, group: 'email', level: 'red', title: `${a.label} inbox is not connected`, detail: a.error ?? 'Gmail did not answer.', brand: a.label, meta: a.email, mins: 5, say: 'check the dashboard app password in dashboard.env', rank: -1 })
      continue
    }
    for (const m of a.messages ?? []) {
      const d = daysSince(m.at, now)
      add({
        id: `mail:${m.id ?? hashId(m.link + m.subject)}`,
        group: 'email',
        level: d !== null && d >= 2 ? 'amber' : 'plain',
        title: m.subject,
        brand: a.label,
        meta: `${m.from} · ${agoDays(d)}`,
        mins: 2,
        href: m.link,
        hrefLabel: 'Open in Gmail',
        say: `draft a reply to the email from ${m.from} about "${clip(m.subject, 80)}" (${a.label} inbox)`,
        rank: -Date.parse(m.at), // newest first
      })
    }
  }

  // ── 2. Sales: a lead reply is money. ──
  for (const a of state?.mail?.accounts ?? []) {
    for (const m of a.leads ?? []) {
      const d = daysSince(m.at, now)
      add({
        id: `form:${m.id ?? hashId(m.link + m.subject)}`,
        group: 'sales',
        // Amber, not red: contact forms catch a lot of vendor spam. Red stays for real breakage.
        level: m.spam ? 'plain' : 'amber',
        spam: m.spam ? m.spamWhy ?? 'looks like junk' : undefined,
        title: m.subject,
        detail: `Sent through the ${m.brand === 'Chris Hornak' || !m.brand ? 'chrishornak.com' : m.brand} ${m.form ?? 'form'}. Reply the same day if you can.`,
        brand: m.brand ?? 'Chris Hornak',
        meta: `${m.form ?? 'website form'} · ${a.label} inbox · ${agoDays(d)}`,
        mins: 10,
        href: m.link,
        hrefLabel: 'Open in Gmail',
        say: `draft a reply to the ${m.brand ?? 'Chris Hornak'} ${m.form ?? 'form'} message "${clip(m.subject, 80)}"`,
        rank: 0 - Date.parse(m.at) / 1e15,
      })
    }
  }

  const sales = state?.sales
  if (sales && !sales.scout.ok) {
    add({ id: `scout-error:${today}`, group: 'sales', level: 'amber', title: 'Scout leads could not be read', detail: sales.scout.error ?? 'The PC job could not reach Scout.', brand: 'Swift Growth', meta: 'Scout CRM', mins: 5, say: 'check why dash-sales.mjs cannot read Scout', rank: 9 })
  }
  const stale: string[] = []
  for (const l of sales?.scout.leads ?? []) {
    const touched = daysSince(l.last_touch, now)
    const overdue = l.due ? Math.floor((Date.parse(today + 'T12:00:00Z') - Date.parse(l.due + 'T12:00:00Z')) / DAY) : null
    const late = l.stage === 'in_conversation' || l.stage === 'proposal'
    // Needs Chris today: a next step due now or earlier, or a warm lead gone quiet 7+ days with no date set.
    const due = overdue !== null && overdue >= 0
    const quiet = !l.due && late && touched !== null && touched >= 7
    if (!due && !quiet) continue
    // Over a month late is pipeline cleanup, not today's follow-up: one item for all of them.
    if ((overdue ?? 0) > 30 || (quiet && touched! > 30)) {
      stale.push(l.name)
      continue
    }
    const value = l.value_monthly ? `$${l.value_monthly}/mo` : l.value_oneoff ? `$${l.value_oneoff}` : ''
    add({
      id: `scout:${l.id}:${l.due ?? 'quiet'}`,
      group: 'sales',
      level: (overdue ?? 0) >= 7 || (quiet && touched! >= 14) ? 'red' : 'amber',
      title: l.next_step ? `${l.name}: ${l.next_step}` : `${l.name}: no next step set`,
      detail: due ? (overdue === 0 ? 'Next step is due today.' : `Next step was due ${overdue} day${overdue === 1 ? '' : 's'} ago.`) : `No touch in ${touched} days and no next step date.`,
      brand: 'Swift Growth',
      meta: ['Scout', l.stage.replace('_', ' '), value, touched !== null ? `last touch ${agoDays(touched)}` : ''].filter(Boolean).join(' · '),
      link2: lastEmailLink(l.last_email, now),
      mins: 10,
      href: l.link,
      hrefLabel: 'Open in Scout',
      say: `draft a follow-up to ${l.name} (Scout lead ${l.id})${l.next_step ? `: ${clip(l.next_step, 100)}` : ''}`,
      rank: 10 - (overdue ?? touched ?? 0) / 1000,
    })
  }
  if (stale.length) {
    add({
      id: `scout-cleanup:${week}`,
      group: 'sales',
      level: 'amber',
      title: `Clean up ${stale.length} old Scout lead${stale.length === 1 ? '' : 's'}`,
      brand: 'Swift Growth',
      detail: 'Their next steps were due more than 30 days ago. Close each one as lost, or set a new step and date.',
      meta: `Scout · ${clip(stale.slice(0, 4).join(', '), 120)}${stale.length > 4 ? ` +${stale.length - 4} more` : ''}`,
      mins: Math.min(60, stale.length * 3),
      href: 'https://swoop.swiftgrowth.marketing/admin/sales',
      hrefLabel: 'Open Scout',
      say: 'help me clean up the Scout pipeline: list the leads with next steps more than 30 days overdue',
      rank: 60,
    })
  }
  for (const d of sales?.drafts ?? []) {
    add({
      id: `draft:${d.id}`,
      group: 'sales',
      level: 'amber',
      title: `Send the email to ${d.name}`,
      detail: d.last_email
        ? `Drafted in email-draft.md and not sent yet. Your last email with them: "${clip(d.last_email.subject, 80)}".`
        : 'Drafted in email-draft.md and not sent yet. Check the "before send" notes, then send.',
      brand: 'Swift Growth',
      link2: lastEmailLink(d.last_email, now),
      meta: `Swift Growth Leads spec site · file changed ${d.updated}`,
      mins: 10,
      href: d.preview,
      hrefLabel: 'Open the preview',
      say: `let's send the ${d.name} email: read ${d.file} first`,
      rank: 20,
    })
  }
  for (const s of salesDb?.signups ?? []) {
    const d = daysSince(s.at, now)
    add({
      id: `bh-signup:${s.id}`,
      group: 'sales',
      level: 'plain',
      title: `New Blog Hands sign-up: ${s.name || s.email}`,
      brand: 'Blog Hands',
      href: `https://bloghands.com/admin/accounts/${s.id}`,
      hrefLabel: 'Open in Blog Hands admin',
      link2: lastEmailLink(sales?.last_by_email?.[s.email.toLowerCase()], now),
      detail: s.website ? `Website: ${s.website}` : undefined,
      meta: `Blog Hands · ${s.email} · ${agoDays(d)}`,
      mins: 5,
      say: `draft a short personal welcome note to the new Blog Hands sign-up ${s.email}`,
      rank: 30 + (d ?? 0) / 100,
    })
  }
  for (const c of salesDb?.claims ?? []) {
    const d = daysSince(c.at, now)
    add({
      id: `bh-claim:${c.id}`,
      group: 'sales',
      level: 'plain',
      title: `Free post claimed${c.domain ? ` for ${c.domain}` : ''}`,
      brand: 'Blog Hands',
      link2: c.email ? lastEmailLink(sales?.last_by_email?.[c.email.toLowerCase()], now) : undefined,
      detail: c.topic ? `Topic: ${clip(c.topic, 140)}` : undefined,
      meta: `Blog Hands free post · ${c.email ?? 'no email'} · ${agoDays(d)}`,
      mins: 5,
      say: `draft a follow-up to the Blog Hands free-post claim from ${c.email ?? c.domain ?? 'this visitor'}`,
      rank: 40 + (d ?? 0) / 100,
    })
  }
  for (const f of (salesDb?.low_scores ?? []).slice(0, 5)) {
    const d = daysSince(f.at, now)
    add({
      id: `find:${f.domain}`,
      group: 'sales',
      level: 'plain',
      title: `${f.domain} scored ${f.score} on the Findability tool`,
      brand: 'Chris Hornak',
      detail: 'A possible outreach lead. Nobody left contact details, so look them up first.',
      meta: `Findability · ${agoDays(d)}`,
      mins: 10,
      href: `https://${f.domain}`,
      hrefLabel: 'Open the site',
      say: `research this lead: ${f.domain} (Findability score ${f.score})`,
      rank: 50 + (d ?? 0) / 100,
    })
  }

  // New Swift Growth site: Buyer-Ready Check report requests (status new) + Local Audit email-gate leads.
  for (const c of (sales?.sgm?.checks ?? []).filter((x) => x.status === 'new')) {
    const d = daysSince(c.created_at, now)
    add({
      id: `sgm-check:${c.id}`,
      group: 'sales',
      level: d !== null && d >= 1 ? 'red' : 'amber',
      title: `Report request: ${c.name}${c.company ? ` (${c.company})` : ''}`,
      detail: `Asked for the complete Buyer-Ready Check report for ${c.site}${c.score !== null ? `. Score ${c.score}${c.tier ? `, ${c.tier}` : ''}` : ''}.`,
      brand: 'Swift Growth',
      meta: `Buyer-Ready Check · ${c.email} · ${agoDays(d)}`,
      link2: lastEmailLink(sales?.last_by_email?.[c.email.toLowerCase()], now),
      mins: 15,
      href: `mailto:${c.email}`,
      hrefLabel: 'Email them',
      say: `draft the Buyer-Ready Check report email to ${c.name} <${c.email}> for ${c.site} (SGM site_check_leads ${c.id})`,
      rank: 1 - Date.parse(c.created_at) / 1e15,
    })
  }
  for (const a of (sales?.sgm?.audits ?? []).filter((x) => (daysSince(x.created_at, now) ?? 99) <= 14)) {
    const d = daysSince(a.created_at, now)
    add({
      id: `sgm-audit:${a.id}`,
      group: 'sales',
      level: 'amber',
      title: `Local Audit lead${a.business_name ? `: ${a.business_name}` : ''}`,
      detail: 'Gave an email to see their Google Business Profile audit.',
      brand: 'Swift Growth',
      meta: `Local Audit tool · ${a.email} · ${agoDays(d)}`,
      link2: lastEmailLink(sales?.last_by_email?.[a.email.toLowerCase()], now),
      mins: 10,
      href: `mailto:${a.email}`,
      hrefLabel: 'Email them',
      say: `draft a follow-up to the Local Audit lead ${a.email}${a.business_name ? ` (${a.business_name})` : ''}`,
      rank: 2 - Date.parse(a.created_at) / 1e15,
    })
  }

  // ── 3. Jobs: newest new leads first, then pitches with no reply after 5 days. ──
  const fresh = jobLeads.filter((l) => l.status === 'new' && l.fit !== 'skip').sort((a, b) => b.added.localeCompare(a.added))
  for (const l of fresh) {
    add({
      id: `job:${l.id}`,
      group: 'jobs',
      level: l.highlight || l.fit === 'strong' ? 'green' : 'plain',
      title: `${l.who}: ${clip(l.ask, 110)}`,
      brand: 'Job hunt',
      detail: l.fit_why ? clip(l.fit_why, 200) : undefined,
      meta: [l.source, `${l.fit} fit`, l.pay_hr ? `$${l.pay_hr}/hr` : '', l.work_type !== 'unknown' ? l.work_type : '', `added ${agoDays(daysSince(l.added, now))}`].filter(Boolean).join(' · '),
      mins: 15,
      href: l.link,
      hrefLabel: 'Open the job',
      say: `apply to this: ${l.link}`,
      job: { id: l.id, done: 'pitched', skip: 'passed', undo: 'new' },
      doneLabel: 'Pitched',
      rank: 0,
    })
  }
  for (const l of jobLeads) {
    if (l.status !== 'pitched' || !l.status_changed) continue
    const d = daysSince(l.status_changed, now)!
    if (d <= FOLLOW_UP_AFTER_DAYS) continue
    add({
      id: `followup:${l.id}:${l.status_changed.slice(0, 10)}`,
      group: 'jobs',
      level: 'amber',
      title: `Follow up with ${l.who}`,
      brand: 'Job hunt',
      detail: `You pitched ${d} days ago and have no reply yet.`,
      meta: `${l.source} · ${clip(l.ask, 80)}`,
      mins: 5,
      href: l.link,
      hrefLabel: 'Open the job',
      say: `draft a short follow-up to ${l.who} for job lead ${l.id}`,
      rank: 100 - d / 1000,
    })
  }

  // ── 4. Marketing ──
  for (const q of questionLeads.filter((l) => l.status === 'new')) {
    add({
      id: `job:${q.id}`,
      group: 'marketing',
      level: 'plain',
      title: clip(q.ask, 200),
      brand: 'Chris Hornak',
      detail: q.fit_why ? q.fit_why.replace(/^.*Reply angle:\s*/, 'Angle: ') : undefined,
      meta: `Bluesky question · @${q.handle ?? q.who} · ${q.posted ?? ''}`,
      mins: 5,
      href: q.link,
      hrefLabel: 'Open the post',
      say: `draft a value-only Bluesky reply to ${q.link}`,
      job: { id: q.id, done: 'replied', skip: 'skipped', undo: 'new' },
      doneLabel: 'Answered',
      rank: 10,
    })
  }
  const daysAhead = new Set(blueskyPosts.filter((p) => p.date > today).map((p) => p.date)).size
  if (daysAhead < BSKY_MIN_DAYS_AHEAD) {
    add({
      id: `bsky-posts:${today}`,
      group: 'marketing',
      level: daysAhead === 0 ? 'red' : 'amber',
      title: 'Write more Bluesky posts',
      brand: 'Chris Hornak',
      detail: daysAhead === 0 ? 'No future days have a post. The robot posts nothing until you add some.' : `Only ${daysAhead} day${daysAhead === 1 ? '' : 's'} of posts are left in the queue.`,
      meta: 'src/lib/bluesky-posts.ts',
      mins: 20,
      say: 'write the next batch of Bluesky posts in src/lib/bluesky-posts.ts',
      rank: 0,
    })
  }
  add({
    id: `contra:${today}`,
    group: 'marketing',
    level: 'plain',
    title: "Look at Contra's job board",
    brand: 'Job hunt',
    detail: 'Every day. New listings go fast.',
    meta: 'daily',
    mins: 10,
    href: CONTRA_JOBS,
    hrefLabel: 'Open Contra jobs',
    say: 'refresh job hunting',
    rank: 20,
  })
  add({
    id: `linkedin:${week}`,
    group: 'marketing',
    level: 'plain',
    title: "Draft this week's LinkedIn post",
    brand: 'Chris Hornak',
    detail: 'Teach something from real work this week. No asking for work.',
    meta: `weekly · ${week}`,
    mins: 20,
    say: 'what should I post on LinkedIn this week',
    rank: 40,
  })

  // ── 5 + 6. Today items from the PC brief, then project next steps. ──
  const OTHER_RANK: Record<TodayItem['kind'], number> = { alert: 0, top3: 1, due: 2, followup: 3, question: 4, play: 5, house: 6 }
  const OTHER_MINS: Record<TodayItem['kind'], number> = { alert: 15, top3: 30, due: 20, followup: 5, question: 5, play: 15, house: 10 }
  for (const t of state?.today?.items ?? []) {
    const wire = t.kind === 'due' && /THE WIRE/i.test(t.title)
    const jobs = t.kind === 'due' && /job search/i.test(t.title)
    add({
      // Digits out of the hash: "27 rule changes" → "28 rule changes" next hour is the same item.
      id: wire ? `wire:${week}` : `today:${t.kind}:${hashId(t.title.replace(/\d+/g, '#'))}`,
      group: wire ? 'marketing' : jobs ? 'jobs' : 'other',
      level: t.level,
      title: t.title,
      detail: t.detail,
      brand: wire ? 'f0rmless' : jobs ? 'Job hunt' : t.kind === 'play' ? 'Games' : brandOf(`${t.title} ${t.detail} ${t.badge}`),
      meta: t.badge,
      mins: wire ? 60 : OTHER_MINS[t.kind],
      href: t.href,
      say: t.say,
      rank: wire ? 30 : jobs ? 50 : OTHER_RANK[t.kind],
    })
  }

  for (const p of state?.projects?.items ?? []) {
    if (p.lane !== 'you' || p.tag === 'Game' || !p.next) continue
    const client = p.tag === 'Client'
    const level: Level = p.flag ? 'red' : client && (p.days ?? 0) >= 7 ? 'red' : 'plain'
    add({
      id: `project:${p.id}:${hashId(p.next)}`,
      group: client ? 'client' : 'other',
      level,
      title: `${p.name}: ${clip(p.next, 140)}`,
      brand: projectBrand(p),
      detail: p.flag ? `Open problem: ${p.flag}` : client && (p.days ?? 0) >= 7 ? `Nothing moved in ${p.days} days. The client may be waiting on you.` : undefined,
      meta: [p.tag, p.days !== null ? `last touched ${agoDays(p.days)}` : ''].filter(Boolean).join(' · '),
      mins: client ? 45 : 30,
      href: p.url ?? undefined,
      hrefLabel: p.url ? 'Open the site' : undefined,
      say: p.say,
      // Client: longest wait first. Owned: after the brief's items, most recent first.
      rank: client ? -(p.days ?? 0) : 10 + (p.days ?? 0) / 1000,
    })
  }

  // Labeled to-dos (Chris types them in the To-do card): due today or earlier, open.
  for (const t of todos) {
    if (!t.label || t.done_at || t.archived_at || t.day > today) continue
    add({
      id: `todo:${t.id}`,
      todo: t.id,
      group: t.label as FeedItem['group'],
      level: t.day < today ? 'amber' : 'plain',
      title: t.text,
      detail: t.day < today ? `On your to-do list since ${t.day}.` : undefined,
      brand: t.brand || 'To-do',
      meta: 'your to-do',
      ...(t.steps?.length && { steps: t.steps }),
      mins: t.steps?.length ? Math.max(15, t.steps.filter((s) => !s.done).length * 5) : 15,
      say: `help me do this to-do: ${t.text}`,
      rank: 3,
    })
  }

  return items
}
